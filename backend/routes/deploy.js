const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const deployService = require('../services/infrastructure/deployService');
const preflightService = require('../services/infrastructure/preflightService');
const InfrastructureRouter = require('../services/infrastructure/InfrastructureRouter');
const ProjectAnalyzer = require('../services/core/ProjectAnalyzer');
const githubService = require('../services/infrastructure/githubService');
const { encrypt, decrypt } = require('../utils/crypto');
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const auditService = require('../services/core/auditService');

async function getUserConnection(userId, provider) {
    try {
        // Source 1: Check specialized user_cloud_connections table (Newer system)
        const connRes = await pool.resilientQuery(
            `SELECT connection_data FROM user_cloud_connections 
             WHERE user_id = $1 AND provider = $2`,
            [userId, provider.toLowerCase()]
        );
        
        if (connRes.rows.length > 0) {
            return { ...connRes.rows[0].connection_data, provider: provider.toLowerCase() };
        }

        // Source 2: Fallback to user profile cloud_credentials (Legacy/Profile system)
        const creds = await User.getCloudCredentials(userId);
        const p = provider.toLowerCase();
        const profileConn = creds[p] || creds[p.toUpperCase()] || creds[provider];
        
        if (profileConn) {
            return { ...profileConn, provider: p };
        }

        return null;
    } catch (err) {
        console.error(`[DEPLOY] Error fetching connection for ${provider}:`, err.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEPLOYMENT PLAN - Auto-detect project and map to provisioned infrastructure
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/deploy/plan
// Analyzes the project and returns a deployment plan for user confirmation
router.post('/plan', authMiddleware, async (req, res) => {
    try {
        const { workspace_id, repoUrl, branch } = req.body;

        if (!workspace_id) {
            return res.status(400).json({ error: "Missing workspace_id" });
        }

        // 1. Get workspace with infra outputs
        const wsRes = await pool.resilientQuery('SELECT * FROM workspaces WHERE id = $1', [workspace_id]);
        if (wsRes.rows.length === 0) return res.status(404).json({ error: "Workspace not found" });
        const workspace = wsRes.rows[0];

        const infraOutputs = workspace.state_json?.infra_outputs || {};
        const infraSpec = workspace.state_json?.infraSpec || {};
        const services = infraSpec.canonical_architecture?.deployable_services || infraSpec.services || [];
        const provider = workspace.state_json?.connection?.provider || infraSpec.resolved_region?.provider || 'aws';

        let analysis = null;

                // 2. If repo URL provided, clone and analyze
        if (repoUrl) {
            const workDir = path.join(__dirname, '../tmp', `plan-${workspace_id}-${Date.now()}`);
            try {
                if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });
                fs.mkdirSync(workDir, { recursive: true });

                await githubService.cloneRepo(repoUrl, workDir);
                analysis = ProjectAnalyzer.analyze(workDir);

                // Cleanup with robust retry (Fixes EBUSY on Windows due to indexing/locks)
                let retries = 5;
                while (retries > 0) {
                    try {
                        fs.rmSync(workDir, { recursive: true, force: true });
                        break;
                    } catch (e) {
                        retries--;
                        if (retries === 0) {
                            console.warn(`[PLAN] Final cleanup failed for ${workDir} after multiple attempts. This directory may need manual removal.`, e.message);
                        } else {
                            // Exponential backoff
                            const delay = (5 - retries) * 1000;
                            await new Promise(r => setTimeout(r, delay));
                        }
                    }
                }
            } catch (analyzeErr) {
                // Cleanup on error
                try { fs.rmSync(workDir, { recursive: true, force: true }); } catch (e) {}
                console.error('[PLAN] Analysis error:', analyzeErr.message);
            }
        }

        // 3. Build deployment plan
        const plan = InfrastructureRouter.buildPlan(analysis, infraOutputs, services, provider);

        res.json({
            success: true,
            plan,
            analysis: analysis ? {
                strategy: analysis.strategy,
                runtime: analysis.runtime,
                framework: analysis.framework,
                reason: analysis.reason
            } : null
        });

    } catch (err) {
        console.error("[PLAN] Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/deploy/env-vars
// Securely store user environment variables for deployment
router.post('/env-vars', authMiddleware, async (req, res) => {
    try {
        const { workspace_id, envVars } = req.body;

        if (!workspace_id || !envVars) {
            return res.status(400).json({ error: "Missing workspace_id or envVars" });
        }

        // Store env vars encrypted in the workspace state_json
        // In production, these would go to AWS Secrets Manager / SSM Parameter Store
        const encryptedEnv = {};
        for (const [k, v] of Object.entries(envVars)) {
            encryptedEnv[k] = encrypt(v);
        }

        await pool.resilientQuery(
            `UPDATE workspaces 
             SET state_json = jsonb_set(
                COALESCE(state_json, '{}'), 
                '{user_env_vars}', 
                $1::jsonb
             )
             WHERE id = $2`,
            [JSON.stringify(encryptedEnv), workspace_id]
        );

        res.json({ success: true, count: Object.keys(envVars).length });

        // Log Env Var Update
        await auditService.log(req.user.id, workspace_id, 'ENV_VARS_UPDATE', { 
            count: Object.keys(envVars).length 
        });
    } catch (err) {
        console.error("[ENV-VARS] Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/deploy
// Start a new deployment
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { workspace_id, source, config } = req.body;
        const userId = req.user.id;

        console.log(`[DEPLOY] Request received for workspace ${workspace_id} from user ${userId}`);
        console.log(`[DEPLOY] Source: ${source}, Config:`, JSON.stringify(config));

        if (!workspace_id || !source || !config) {
            console.log("[DEPLOY] ❌ Missing required fields");
            return res.status(400).json({ error: "Missing required fields" });
        }

        // 1. Get Workspace & Validation
        const wsRes = await pool.resilientQuery('SELECT * FROM workspaces WHERE id = $1', [workspace_id]);
        if (wsRes.rows.length === 0) {
            console.log(`[DEPLOY] ❌ Workspace ${workspace_id} not found`);
            return res.status(404).json({ error: "Workspace not found" });
        }
        const workspace = wsRes.rows[0];

        // 🛡️ PREFLIGHT VALIDATION (3-Layer Refactor Layer 3)
        const providerRaw = workspace.state_json?.infraSpec?.resolved_region?.provider || workspace.state_json?.connection?.provider || 'aws';
        const provider = providerRaw.toLowerCase();
        console.log(`[DEPLOY] Detected provider: ${provider}`);

        if (provider === 'aws') {
            console.log(`[PREFLIGHT] Starting AWS validation for workspace ${workspace_id}...`);
            const conn = await getUserConnection(userId, 'aws');
            if (!conn) {
                console.log(`[PREFLIGHT] ❌ No AWS connection found for user ${userId}`);
                return res.status(400).json({ error: "No AWS connection found. Please connect your cloud account first." });
            }

            console.log(`[PREFLIGHT] Connection found. Role ARN: ${conn.role_arn}`);

            // Extract services for targeted preflight checks
            const services = workspace.state_json?.infraSpec?.services?.map(s => s.service_id) || [];
            const preflight = await preflightService.validateAWS(workspace.state_json?.region || 'ap-south-1', conn, services);
            
            if (!preflight.valid) {
                console.log(`[PREFLIGHT] ❌ Validation failed:`, JSON.stringify(preflight.checks));
                return res.status(403).json({
                    error: "Preflight Validation Failed",
                    details: preflight.checks.filter(c => c.status === 'FAIL')
                });
            }
            console.log(`[PREFLIGHT] ✅ AWS validation PASSED.`);
        }

        // 2. Create Deployment Record
        const deploymentId = await deployService.createDeployment(workspace_id, source, config);

        // 3. Trigger Async Deployment (with decrypted vars)
        const userEnvVars = workspace.state_json?.user_env_vars || {};
        const decryptedVars = {};
        for (const [k, v] of Object.entries(userEnvVars)) {
            decryptedVars[k] = decrypt(v);
        }
        workspace.state_json.user_env_vars = decryptedVars;

        if (source === 'github') {
            deployService.deployFromGithub(deploymentId, workspace, config);
        } else if (source === 'docker') {
            deployService.deployFromDocker(deploymentId, workspace, config);
        } else {
            return res.status(400).json({ error: "Invalid source type" });
        }

        res.json({ deploymentId, status: 'pending' });

        // Log Deployment Activity
        await auditService.log(userId, workspace_id, 'DEPLOYMENT_STARTED', { 
            deploymentId, 
            source, 
            trigger: config?.trigger || 'manual' 
        });

    } catch (err) {
        console.error("Deploy Route Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/deploy/:id/status
router.get('/:id/status', authMiddleware, async (req, res) => {
    try {
        const deployment = await deployService.getDeploymentStatus(req.params.id);
        if (!deployment) return res.status(404).json({ error: "Deployment not found" });
        res.json(deployment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/deploy/workspace/:workspaceId/latest
// Fetch the most recent deployment for a workspace (to hydrate logs)
router.get('/workspace/:workspaceId/latest', authMiddleware, async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const result = await pool.resilientQuery(
            'SELECT * FROM deployments WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 1',
            [workspaceId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No deployments found for this workspace" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Latest Deploy Error:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/deploy/all
 * Fetch all deployments for the current user across all workspaces
 */
router.get('/all', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.resilientQuery(
            `SELECT 
                d.id, d.status, d.source_type, d.url, d.logs, d.created_at, d.updated_at,
                w.name as workspace_name, w.id as workspace_id
             FROM deployments d
             JOIN workspaces w ON d.workspace_id = w.id
             JOIN projects p ON w.project_id::text = p.id::text
             WHERE p.owner_id::text = $1::text
             ORDER BY d.created_at DESC`,
            [String(userId)]
        );

        res.json(result.rows);
    } catch (err) {
        console.error("Fetch All Deployments Error:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/deploy/workspace/:workspaceId
 * Fetch all deployments for a specific workspace
 */
router.get('/workspace/:workspaceId', authMiddleware, async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const result = await pool.resilientQuery(
            'SELECT id, status, source_type, url, logs, config, created_at, updated_at FROM deployments WHERE workspace_id = $1 ORDER BY created_at DESC',
            [workspaceId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error("Fetch Deployments Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DESTROY ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

const destroyService = require('../services/infrastructure/destroyService');

// POST /api/deploy/:workspaceId/destroy
// Initiate infrastructure destruction (requires typed confirmation)
router.post('/:workspaceId/destroy', authMiddleware, async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { confirmation } = req.body;
        const userId = req.user.id;

        // Server-side validation of typed confirmation
        if (!destroyService.validateConfirmation(confirmation)) {
            return res.status(400).json({
                error: "Invalid confirmation",
                details: "You must type exactly 'DELETE' to confirm destruction."
            });
        }

        const result = await destroyService.initiateDestroy(
            parseInt(workspaceId),
            userId,
            confirmation
        );

        res.json(result);

    } catch (err) {
        console.error("Destroy Route Error:", err);
        res.status(err.message.includes('Cannot destroy') ? 400 : 500).json({ error: err.message });
    }
});

// GET /api/deploy/:workspaceId/destroy/:jobId/status
// Poll destroy job status
router.get('/:workspaceId/destroy/:jobId/status', authMiddleware, async (req, res) => {
    try {
        const { jobId } = req.params;
        const status = destroyService.getJobStatus(jobId);

        if (!status) {
            return res.status(404).json({ error: "Destroy job not found" });
        }

        res.json(status);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
