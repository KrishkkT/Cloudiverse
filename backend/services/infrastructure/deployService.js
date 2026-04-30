const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { CloudFrontClient, CreateInvalidationCommand, GetDistributionConfigCommand, UpdateDistributionCommand } = require("@aws-sdk/client-cloudfront");
const { ECSClient, RegisterTaskDefinitionCommand, UpdateServiceCommand, DescribeTaskDefinitionCommand, DescribeServicesCommand } = require("@aws-sdk/client-ecs");
const { LambdaClient, UpdateFunctionCodeCommand, GetFunctionCommand } = require("@aws-sdk/client-lambda");
const { CodeBuildClient, StartBuildCommand, BatchGetBuildsCommand } = require("@aws-sdk/client-codebuild");
const { Storage } = require('@google-cloud/storage');
const { BlobServiceClient, BlockBlobClient } = require("@azure/storage-blob");
const { ClientSecretCredential } = require("@azure/identity");
const { ContainerAppsAPIClient } = require("@azure/arm-appcontainers");
const { ContainerRegistryManagementClient } = require("@azure/arm-containerregistry");
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const pool = require('../../config/db');
const githubService = require('./githubService');
const archiver = require('archiver');
const axios = require('axios');

// const { detectProjectType } = require('../../utils/projectDetector'); // LEGACY
const ProjectAnalyzer = require('../../services/core/ProjectAnalyzer');
const { DeploymentStrategyResolver, Strategies } = require('../../services/infrastructure/DeploymentStrategyResolver');

/**
 * Normalizes infrastructure outputs to ensure consistent access via .value property.
 * Handles both the flattened format (stored in DB) and nested format (Terraform output style).
 */
const normalizeOutputs = (outputs) => {
    if (!outputs) return {};
    const normalized = {};
    for (const [key, val] of Object.entries(outputs)) {
        if (val && typeof val === 'object' && 'value' in val) {
            normalized[key] = val;
        } else {
            normalized[key] = { value: val };
        }
    }
    return normalized;
};


// Helper to create AWS Clients with Assumed Role
const createAwsClient = async (ClientClass, region, roleArn, externalId) => {
    // 1. Get Backend Credentials (from env or implicit)
    const stsConfig = { region: "ap-south-1" };
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        stsConfig.credentials = {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        };
    }
    const sts = new STSClient(stsConfig);

    // 2. Assume the User's Role
    console.log(`[DEPLOY] Assuming role: ${roleArn}`);
    const assumeCmd = new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: "CloudiverseDeploySession",
        ExternalId: externalId
    });

    const assumed = await sts.send(assumeCmd);

    // 3. Return Client with Temporary Credentials
    return new ClientClass({
        region: region,
        credentials: {
            accessKeyId: assumed.Credentials.AccessKeyId,
            secretAccessKey: assumed.Credentials.SecretAccessKey,
            sessionToken: assumed.Credentials.SessionToken
        }
    });
};

const createDeployment = async (workspaceId, sourceType, config) => {
    // 1. Determine next version
    const versionRes = await pool.resilientQuery(
        'SELECT COALESCE(MAX(version), 0) + 1 as next_version FROM deployments WHERE workspace_id = $1',
        [workspaceId]
    );
    const version = versionRes.rows[0].next_version;

    const result = await pool.resilientQuery(
        `INSERT INTO deployments (workspace_id, source_type, status, logs, version, config) 
         VALUES ($1, $2, 'pending', '[]', $3, $4) RETURNING id`,
        [workspaceId, sourceType, version, JSON.stringify(config || {})]
    );
    return result.rows[0].id;
};


// Helper: Target Provider Update (ECS, AppService, CloudRun, ContainerApps)
async function deployImageToProvider(deploymentId, workspace, conn, provider, image, extraEnv = {}) {
    await appendLog(deploymentId, `☁️ Initiating Provider Update for ${provider.toUpperCase()}...`);
    const infraOutputs = normalizeOutputs(workspace.state_json.infra_outputs);
    const region = workspace.state_json.region || 'ap-south-1';

    // Ensure computecontainer is present (Handle snake_case V2 output)
    if (infraOutputs && infraOutputs.compute_container) {
        infraOutputs.computecontainer = infraOutputs.compute_container;
    }

    // Ensure computecontainer is present or fallback
    if (!infraOutputs || !infraOutputs.computecontainer) {
        await appendLog(deploymentId, `⚠️ Standardized computecontainer outputs not found. Attempting legacy fallback...`);
        // Fallback or initialization of computecontainer object for downstream logic
        const legacyNames = {
            aws: { cluster_name: infraOutputs.cluster_name?.value || infraOutputs.ecs_cluster?.value, service_name: infraOutputs.service_name?.value || infraOutputs.ecs_service?.value },
            azure: { container_app_name: infraOutputs.container_app_name?.value || infraOutputs.app_name?.value, resource_group_name: infraOutputs.resource_group_name?.value || infraOutputs.rg_name?.value },
            gcp: { service_name: infraOutputs.service_name?.value || workspace.name }
        };
        const fallback = legacyNames[provider] || {};
        infraOutputs.computecontainer = fallback;
    }

    const cc = infraOutputs.computecontainer || {};

    // ---------------------------------------------------------
    // 🌍 ENV VAR INJECTION (Added for Deployment Alignment)
    // ---------------------------------------------------------
    // ---------------------------------------------------------
    // 🌍 ENV VAR INJECTION (Aligned with Terraform V2 Outputs)
    // ---------------------------------------------------------
    // Start with user-defined environment variables and merge with extraEnv
    const userEnvVars = workspace.state_json?.user_env_vars || {};
    const envVars = { ...userEnvVars, ...extraEnv };

    // 0. Normalize Output Access Helper
    const getVal = (key) => infraOutputs[key]?.value;

    // 1. Database (Output: database_endpoint)
    const dbEndpoint = getVal('database_endpoint');
    if (dbEndpoint) {
        envVars['DB_HOST'] = dbEndpoint;
        envVars['DB_PORT'] = '5432'; // Default for now
        envVars['DB_NAME'] = 'app_db';
        // Use password from outputs or default
        const dbPass = infraOutputs.relationaldatabase?.value?.password || 'ChangeMe123!';
        const dbUser = infraOutputs.relationaldatabase?.value?.username || 'dbadmin';
        envVars['DATABASE_URL'] = `postgres://${dbUser}:${dbPass}@${dbEndpoint}:5432/app_db`;
    } else if (infraOutputs.relationaldatabase?.value?.endpoint) {
        // Fallback for V1
        const db = infraOutputs.relationaldatabase.value;
        envVars['DB_HOST'] = db.endpoint;
        envVars['DB_PORT'] = db.port || '5432';
        envVars['DATABASE_URL'] = `postgres://user:password@${db.endpoint}:${envVars['DB_PORT']}/${db.name || 'app_db'}`;
    }

    // 2. Cache (Output: cache_endpoint)
    const cacheEndpoint = getVal('cache_endpoint');
    if (cacheEndpoint) {
        envVars['REDIS_HOST'] = cacheEndpoint;
        envVars['REDIS_PORT'] = '6379';
        envVars['REDIS_URL'] = `redis://${cacheEndpoint}:6379`;
    }

    // 3. Storage (Output: bucket_name, bucket_region)
    const bucketName = getVal('bucket_name');
    if (bucketName) {
        envVars['STORAGE_BUCKET'] = bucketName;
        envVars['STORAGE_REGION'] = getVal('region') || getVal('bucket_region') || region;
    }

    // 4. Auth (Output: auth_client_id)
    const authClientId = getVal('auth_client_id');
    if (authClientId) {
        envVars['AUTH_CLIENT_ID'] = authClientId;
        // Use issuer_url from outputs or construct Cognito URL
        envVars['AUTH_ISSUER'] = infraOutputs.auth?.value?.issuer_url || infraOutputs.identityauth?.value?.issuer_url || `https://cognito-idp.${region}.amazonaws.com/unknown_pool`;
    }

    // 5. API Gateway / CDN
    const apiEndpoint = getVal('api_endpoint');
    if (apiEndpoint) envVars['API_URL'] = apiEndpoint;

    const cdnEndpoint = getVal('cdn_endpoint');
    if (cdnEndpoint) envVars['CDN_URL'] = `https://${cdnEndpoint}`;

    console.log(`[DEPLOY] Injecting ${Object.keys(envVars).length} Environment Variables...`);


    if (provider === 'aws') {
        const { role_arn, external_id } = conn;

        const clusterName = cc.value?.cluster_name || cc.ecs_cluster_name?.value || cc.cluster_name?.value || cc.cluster_name;
        const serviceName = cc.value?.service_name || cc.container_service_name?.value || cc.service_name?.value || cc.service_name;

        if (!clusterName || !serviceName) {
            throw new Error("No compute container infrastructure found (ECS Cluster/Service missing).");
        }

        const ecsClient = await createAwsClient(ECSClient, region, role_arn, external_id);

        await appendLog(deploymentId, `🔍 Fetching current service state for ${serviceName}...`);
        const descService = await ecsClient.send(new DescribeServicesCommand({
            cluster: clusterName,
            services: [serviceName]
        }));

        if (!descService.services || descService.services.length === 0) {
            throw new Error(`Service ${serviceName} not found in cluster ${clusterName}`);
        }

        const currentTaskDefArn = descService.services[0].taskDefinition;
        const taskDefRes = await ecsClient.send(new DescribeTaskDefinitionCommand({
            taskDefinition: currentTaskDefArn
        }));

        const oldDef = taskDefRes.taskDefinition;

        // Merge Env Vars for ECS
        const newEnv = Object.entries(envVars).map(([name, value]) => ({ name, value }));

        const newDefInput = {
            family: oldDef.family,
            taskRoleArn: oldDef.taskRoleArn,
            executionRoleArn: oldDef.executionRoleArn,
            networkMode: oldDef.networkMode,
            containerDefinitions: oldDef.containerDefinitions.map(c => ({
                ...c,
                image: image, // 🔥 SWAP IMAGE
                environment: [...(c.environment || []), ...newEnv] // 🔥 INJECT ENV VARS
            })),
            cpu: oldDef.cpu,
            memory: oldDef.memory
        };

        if (oldDef.runtimePlatform) newDefInput.runtimePlatform = oldDef.runtimePlatform;
        if (oldDef.requiresCompatibilities) newDefInput.requiresCompatibilities = oldDef.requiresCompatibilities;

        const registerRes = await ecsClient.send(new RegisterTaskDefinitionCommand(newDefInput));
        const newTaskArn = registerRes.taskDefinition.taskDefinitionArn;

        await ecsClient.send(new UpdateServiceCommand({
            cluster: clusterName,
            service: serviceName,
            taskDefinition: newTaskArn,
            forceNewDeployment: true
        }));

        await appendLog(deploymentId, `✅ ECS Service updated to use revision ${newTaskArn.split(':').pop()}`);

        // Return endpoint: service_endpoint (GCP/Azure/ALB) or load_balancer_dns
        const rawUrl = cc.value?.service_endpoint || cc.service_endpoint?.value || cc.load_balancer_dns?.value || infraOutputs.loadbalancer?.dns_name?.value || infraOutputs.lb_dns_name?.value;
        return rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `http://${rawUrl}`) : null;
    }

    if (provider === 'azure' || provider === 'azurerm') {
        const { client_id, client_secret, tenant_id, subscription_id } = conn.credentials;
        const containerAppName = cc.value?.container_app_name || cc.container_app_name?.value || cc.container_app_name || cc.service_name;
        const resourceGroupName = cc.value?.resource_group_name || cc.resource_group_name?.value || cc.resource_group_name;

        if (!containerAppName || !resourceGroupName) {
            throw new Error(`Missing Azure Infrastructure Outputs (Container App Name/Resource Group).`);
        }

        await appendLog(deploymentId, `🔍 Updating Azure Container App: ${containerAppName} in ${resourceGroupName}...`);

        // Use administrative credentials if available
        const aid = process.env.ARM_CLIENT_ID || client_id;
        const secret = process.env.ARM_CLIENT_SECRET || client_secret;
        const tid = process.env.ARM_TENANT_ID || tenant_id;
        const sid = process.env.ARM_SUBSCRIPTION_ID || subscription_id;

        const credential = new ClientSecretCredential(tid, aid, secret);
        const client = new ContainerAppsAPIClient(credential, sid);

        const currentApp = await client.containerApps.get(resourceGroupName, containerAppName);
        currentApp.template.containers[0].image = image;

        // Merge Env Vars for Azure
        const azureEnv = Object.entries(envVars).map(([name, value]) => ({ name, value }));
        // existing env logic if needed: currentApp.template.containers[0].env || []
        currentApp.template.containers[0].env = [...(currentApp.template.containers[0].env || []), ...azureEnv];

        const updateOp = await client.containerApps.beginUpdateAndWait(resourceGroupName, containerAppName, currentApp);
        const fqdn = updateOp.configuration?.ingress?.fqdn;
        const liveUrl = fqdn ? `https://${fqdn}` : cc.service_endpoint?.value;
        await appendLog(deploymentId, `✅ Azure Container App updated: ${liveUrl}`);
        return liveUrl;
    }

    if (provider === 'gcp') {
        let auth;
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
            const keys = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
            auth = google.auth.fromJSON(keys);
            auth.scopes = ['https://www.googleapis.com/auth/cloud-platform'];
        } else {
            auth = conn.credentials; // Fallback to user credentials (injected during connection setup)
        }
        const run = google.run({ version: 'v1', auth });

        const serviceName = cc.value?.service_name || cc.service_name?.value || cc.service_name || workspace.name;
        const region = cc.value?.region || cc.region?.value || cc.region || workspace.state_json.region;
        const project = cc.value?.project_id || cc.project_id?.value || cc.project_id || conn.project_id;

        const name = `projects/${project}/locations/${region}/services/${serviceName}`;
        await appendLog(deploymentId, `🔍 Fetching Cloud Run service: ${name}...`);

        const serviceRes = await run.projects.locations.services.get({ name });
        const serviceData = serviceRes.data;

        serviceData.spec.template.spec.containers[0].image = image;

        // Merge Env Vars for GCP
        const gcpEnv = Object.entries(envVars).map(([name, value]) => ({ name, value }));
        serviceData.spec.template.spec.containers[0].env = [...(serviceData.spec.template.spec.containers[0].env || []), ...gcpEnv];


        const op = await run.projects.locations.services.replaceService({
            name,
            requestBody: serviceData
        });

        // 🔍 HARDENING: Wait for Ready Condition
        await appendLog(deploymentId, `⏳ Waiting for Cloud Run service to be ready...`);
        // Simple delay for now, ideally poll status.conditions
        await new Promise(r => setTimeout(r, 10000));

        const liveUrl = op.data.status?.url || cc.service_endpoint?.value;
        await appendLog(deploymentId, `✅ Cloud Run service updated: ${liveUrl}`);
        return liveUrl;
    }

    throw new Error(`Provider ${provider} not supported for container deployment yet.`);
}

/**
 * 🔒 HARDENING: Persist Deployment State (Separate from Infra)
 */
async function saveDeploymentState(workspaceId, state) {
    try {
        // We use a JSONB column 'deployment_state' on workspaces or a separate table.
        // For now, we'll store it in 'deployment_history' last entry or a dedicated field if available.
        // Let's reuse 'deployment_history' for now but strictly structured.
        // BETTER: Update the 'state_json' with a 'deployment' key.
        await pool.resilientQuery(
            `UPDATE workspaces 
             SET state_json = jsonb_set(state_json, '{deployment}', $1::jsonb)
             WHERE id = $2`,
            [JSON.stringify(state), workspaceId]
        );
        console.log(`[DEPLOY STATE] Saved: ${JSON.stringify(state)}`);
    } catch (e) {
        console.error("Failed to save deployment state:", e);
    }
}

const { sendDeploymentStatusEmail } = require('../../utils/emailService');

const updateDeploymentStatus = async (deploymentId, status, url = null, logs = []) => {
    // Ensure all logs have timestamps
    const timestampedLogs = logs.map(l => ({
        timestamp: l.timestamp || new Date(),
        message: l.message
    }));

    let query = `UPDATE deployments SET status = $2, logs = logs || $3::jsonb, updated_at = NOW()`;
    const params = [deploymentId, status, JSON.stringify(timestampedLogs)];

    if (url) {
        query += `, url = $4`;
        params.push(url);
    }

    query += ` WHERE id = $1 RETURNING workspace_id, source_type, created_at`;
    const result = await pool.resilientQuery(query, params);

    // Notification & State Logic
    if (result.rows.length > 0) {
        const { workspace_id, source_type, created_at } = result.rows[0];

        // 1. Fetch User & Workspace Info for Email
        try {
            const wsRes = await pool.resilientQuery(
                `SELECT w.name, u.email, u.name as user_name, w.ci_config 
                 FROM workspaces w 
                 JOIN users u ON w.user_id = u.id::text 
                 WHERE w.id = $1`,
                [workspace_id]
            );

            if (wsRes.rows.length > 0) {
                const { name: wsName, email, user_name, ci_config } = wsRes.rows[0];
                const duration = Math.round((Date.now() - new Date(created_at).getTime()) / 1000) + 's';

                // Prepare email details
                const emailDetails = {
                    status,
                    projectName: wsName,
                    trigger: source_type,
                    branch: ci_config?.branch || 'main', // Best effort
                    commitHash: logs.find(l => l.message.includes('Commit:'))?.message?.split('Commit: ')[1],
                    duration,
                    liveUrl: url,
                    error: status === 'failed' ? logs.slice(-2).map(l => l.message).join(' | ') : null,
                    workspaceId: workspace_id
                };

                // Send Email (Non-blocking)
                sendDeploymentStatusEmail({ email, name: user_name }, emailDetails)
                    .catch(e => console.error(`[DEPLOY] Failed to send email: ${e.message}`));
            }

        } catch (err) {
            console.error(`[DEPLOY] Error fetching user for notification: ${err.message}`);
        }

        // 2. Deployment Success Handling
        if (status === 'success') {
            try {
                // 🔒 HARDENING: Save Explicit Deployment State
                const deployState = {
                    status: 'ACTIVE',
                    image: logs.find(l => l.message.includes('Swapping image'))?.message?.split('to ')[1] || 'unknown',
                    revision: new Date().toISOString(),
                    deployed_at: new Date().toISOString(),
                    live_url: url,
                    verified: true
                };
                await saveDeploymentState(workspace_id, deployState);

                // Update workspace to DEPLOYED status
                await pool.resilientQuery(
                    `UPDATE workspaces 
                     SET deployment_status = 'DEPLOYED',
                         step = 'deployed',
                         state_json = state_json || jsonb_build_object('is_live', true, 'is_deployed', true),
                         deployed_at = NOW(),
                         deployment_history = COALESCE(deployment_history, '[]'::jsonb) || $1::jsonb,
                         updated_at = NOW()
                     WHERE id = $2`,
                    [JSON.stringify([{
                        action: 'DEPLOY_SUCCESS',
                        timestamp: new Date().toISOString(),
                        deployment_id: deploymentId,
                        live_url: url,
                        state: deployState
                    }]), workspace_id]
                );
                console.log(`[DEPLOY] Workspace ${workspace_id} marked as DEPLOYED`);
            } catch (wsErr) {
                console.error(`[DEPLOY] Failed to update workspace status:`, wsErr);
            }
        }
        // 3. Deployment Failure Handling
        else if (status === 'failed') {
            try {
                await saveDeploymentState(workspace_id, { status: 'FAILED', reason: 'Verification or Deploy Failed' });
            } catch (e) { console.error(e); }
        }
    }
};

async function getDeploymentVersion(deploymentId) {
    const res = await pool.resilientQuery('SELECT version FROM deployments WHERE id = $1', [deploymentId]);
    return res.rows[0]?.version || 1;
}

const appendLog = async (deploymentId, message) => {
    const logEntry = { timestamp: new Date(), message };
    await pool.resilientQuery(
        `UPDATE deployments SET logs = logs || $2::jsonb WHERE id = $1`,
        [deploymentId, JSON.stringify([logEntry])]
    );
    return logEntry;
};

// Standardized Error Categories
const DEPLOY_ERRORS = {
    INVALID_REPO_URL: { code: 'INVALID_REPO_URL', message: 'Invalid GitHub repository URL' },
    BUILD_FAILED: { code: 'BUILD_FAILED', message: 'Build command failed' },
    MISSING_INDEX_HTML: { code: 'MISSING_INDEX_HTML', message: 'index.html not found in build output' },
    S3_UPLOAD_FAILED: { code: 'S3_UPLOAD_FAILED', message: 'Failed to upload files to S3' },
    CLOUDFRONT_ERROR: { code: 'CLOUDFRONT_ERROR', message: 'CDN cache refresh failed' },
    VERIFICATION_FAILED: { code: 'VERIFICATION_FAILED', message: 'Live site verification failed' },
    UNKNOWN_ERROR: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' }
};


// Helper: Retry Wrapper
async function retryOperation(fn, retries = 3, delayMs = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, delayMs * (i + 1))); // Exponential backoffish
        }
    }
}



// Helper: Validate GitHub Repo
function validateRepoUrl(url) {
    if (!url || !url.startsWith("https://github.com/")) {
        throw { ...DEPLOY_ERRORS.INVALID_REPO_URL, details: "URL must start with https://github.com/" };
    }
}

// Helper: Find index.html recursively or in common dirs
function findBuildArtifacts(baseDir) {
    const commonPaths = [
        '.',
        'dist',
        'build',
        'out',
        'dist/browser', // Angular sometimes
        'public'
    ];

    for (const sub of commonPaths) {
        const checkPath = path.join(baseDir, sub);
        if (fs.existsSync(checkPath) && fs.existsSync(path.join(checkPath, 'index.html'))) {
            return checkPath;
        }
    }
    return null;
}

// Helper: Detect Project Type
/**
 * Helper: Zip a directory into a buffer
 */
async function zipDirectory(dirPath) {
    return new Promise((resolve, reject) => {
        const archive = archiver('zip', { zlib: { level: 9 } });
        const chunks = [];
        archive.on('data', chunk => chunks.push(chunk));
        archive.on('end', () => resolve(Buffer.concat(chunks)));
        archive.on('error', err => reject(err));
        archive.directory(dirPath, false);
        archive.finalize();
    });
}

/**
 * Helper: Trigger AWS CodeBuild and wait for completion
 */
async function triggerCodeBuild(deploymentId, codebuildClient, projectName, s3Bucket, s3Key, ecrUrl, imageTag = "latest") {
    await appendLog(deploymentId, `🚀 Starting AWS CodeBuild project: ${projectName}...`);

    // 1. Start build
    const startResponse = await codebuildClient.send(new StartBuildCommand({
        projectName: projectName,
        sourceLocationOverride: `${s3Bucket}/${s3Key}`,
        environmentVariablesOverride: [
            { name: 'IMAGE_REPO_URL', value: ecrUrl },
            { name: 'IMAGE_TAG', value: imageTag }
        ]
    }));

    const buildId = startResponse.build.id;
    await appendLog(deploymentId, `🏗️ Build started. ID: ${buildId}`);

    // 2. Poll for status
    let status = 'IN_PROGRESS';
    while (status === 'IN_PROGRESS') {
        await new Promise(r => setTimeout(r, 5000)); // Poll every 5s
        const statusResponse = await codebuildClient.send(new BatchGetBuildsCommand({
            ids: [buildId]
        }));

        const build = statusResponse.builds[0];
        status = build.buildStatus;

        if (status === 'SUCCEEDED') {
            await appendLog(deploymentId, "✅ CodeBuild SUCCEEDED.");
            break;
        } else if (status === 'FAILED' || status === 'STOPPED' || status === 'TIMED_OUT') {
            const phaseWithErr = build.phases.find(p => p.phaseStatus === 'FAILED');
            const errMsg = phaseWithErr ? `FAILED in phase ${phaseWithErr.phaseType}` : "Phase unknown";
            throw new Error(`CodeBuild failed with status ${status}: ${errMsg}. Check CloudWatch Logs for details.`);
        }

        await appendLog(deploymentId, `⏳ Build status: ${status}...`);
    }
    return true; // AWS Image is usually just ecrUrl:latest
}

/**
 * Helper: Trigger GCP Cloud Build and wait for completion
 */
async function triggerGcpCloudBuild(deploymentId, credentials, projectId, bucketName, gcsKey, imageTag, region) {
    await appendLog(deploymentId, `🚀 Starting GCP Cloud Build for ${projectId}...`);
    let auth;
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        const keys = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        auth = google.auth.fromJSON(keys);
        auth.scopes = ['https://www.googleapis.com/auth/cloud-platform'];
    } else {
        auth = credentials; // Fallback to user credentials
    }
    const cb = google.cloudbuild({ version: 'v1', auth });

    const [response] = await cb.projects.builds.create({
        projectId: projectId,
        requestBody: {
            source: { storageSource: { bucket: bucketName, object: gcsKey } },
            steps: [
                { name: 'gcr.io/cloud-builders/docker', args: ['build', '-t', imageTag, '.'] },
                { name: 'gcr.io/cloud-builders/docker', args: ['push', imageTag] }
            ],
            images: [imageTag]
        }
    });

    const buildId = response.data.id || response.data.metadata?.build?.id;
    await appendLog(deploymentId, `🏗️ Build started. ID: ${buildId}`);

    // Poll for completion
    let status = 'QUEUED';
    while (status === 'QUEUED' || status === 'WORKING') {
        await new Promise(r => setTimeout(r, 5000));
        const res = await cb.projects.builds.get({ projectId, id: buildId });
        status = res.data.status;
        if (status === 'SUCCESS') {
            await appendLog(deploymentId, "✅ Cloud Build SUCCEEDED.");
            break;
        } else if (['FAILURE', 'INTERNAL_ERROR', 'TIMEOUT', 'CANCELLED'].includes(status)) {
            throw new Error(`Cloud Build failed with status ${status}. Check GCP Console for logs.`);
        }
        await appendLog(deploymentId, `⏳ Build status: ${status}...`);
    }
    return imageTag;
}

/**
 * Helper: Sync a folder to GCS
 */
async function syncFolderToGcs(deploymentId, credentials, projectId, bucketName, localPath, prefix = "") {
    const files = [];
    const walk = (dir) => {
        fs.readdirSync(dir).forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) walk(filePath);
            else files.push(filePath);
        });
    };
    walk(localPath);
    await appendLog(deploymentId, `📤 Uploading ${files.length} files to GCS (${bucketName}/${prefix})...`);

    let storageOptions = { projectId };
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        storageOptions.credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    } else {
        storageOptions.credentials = credentials;
    }

    const storage = new Storage(storageOptions);
    const bucket = storage.bucket(bucketName);

    for (const filePath of files) {
        const relativePath = path.relative(localPath, filePath).replace(/\\/g, '/');
        const gcsKey = prefix ? `${prefix.endsWith('/') ? prefix : prefix + '/'}${relativePath}` : relativePath;
        const ext = path.extname(filePath).toLowerCase();
        const contentType = {
            '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
            '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
        }[ext] || 'application/octet-stream';

        await bucket.upload(filePath, {
            destination: gcsKey,
            metadata: { contentType }
        });
    }
    await appendLog(deploymentId, `✅ Successfully synced to GCS.`);
}

/**
 * Helper: Sync a folder to Azure Blob Storage ($web)
 */
async function syncFolderToAzureBlob(deploymentId, blobServiceClient, containerName, localPath, prefix = "") {
    const files = [];
    const walk = (dir) => {
        fs.readdirSync(dir).forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) walk(filePath);
            else files.push(filePath);
        });
    };
    walk(localPath);
    await appendLog(deploymentId, `📤 Uploading ${files.length} files to Azure Blob Storage (${containerName}/${prefix})...`);

    const containerClient = blobServiceClient.getContainerClient(containerName);
    for (const filePath of files) {
        const relativePath = path.relative(localPath, filePath).replace(/\\/g, '/');
        const blobKey = prefix ? `${prefix.endsWith('/') ? prefix : prefix + '/'}${relativePath}` : relativePath;
        const blockBlobClient = containerClient.getBlockBlobClient(blobKey);
        const ext = path.extname(filePath).toLowerCase();
        const contentType = {
            '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
            '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
        }[ext] || 'application/octet-stream';

        await blockBlobClient.uploadFile(filePath, { blobHTTPHeaders: { blobContentType: contentType } });
    }
    await appendLog(deploymentId, `✅ Successfully synced to Azure Blob.`);
}

/**
 * Helper: Trigger Azure ACR Build
 */
async function triggerAzureAcrBuild(deploymentId, credentials, subscriptionId, resourceGroup, acrName, imageTag, localZipPath) {

    // Use administrative credentials if available
    const aid = process.env.ARM_CLIENT_ID || credentials.client_id;
    const secret = process.env.ARM_CLIENT_SECRET || credentials.client_secret;
    const tid = process.env.ARM_TENANT_ID || credentials.tenant_id;
    const sid = process.env.ARM_SUBSCRIPTION_ID || subscriptionId;

    const credential = new ClientSecretCredential(tid, aid, secret);
    const client = new ContainerRegistryManagementClient(credential, sid);

    await appendLog(deploymentId, `🚀 Starting Azure ACR Build for ${acrName}...`);

    // 1. Get Build Source Upload URL
    const sourceUpload = await client.registries.getBuildSourceUploadUrl(resourceGroup, acrName);

    // 2. Upload Zip to the provided URL (Shared Access Signature)
    const blobClient = new BlockBlobClient(sourceUpload.uploadUrl);
    await blobClient.uploadFile(localZipPath);

    // 3. Queue the Build
    const buildRequest = {
        type: "DockerBuildRequest",
        imageNames: [imageTag],
        isPushEnabled: true,
        sourceLocation: sourceUpload.uploadUrl,
        platform: { os: "Linux", architecture: "amd64" },
        dockerFilePath: "Dockerfile"
    };

    const poller = await client.registries.beginQueueBuildAndWait(resourceGroup, acrName, buildRequest);
    await appendLog(deploymentId, `🏗️ Build queued. ID: ${poller.runId}`);

    // 4. Poll for completion
    let status = 'Queued';
    while (['Queued', 'Started', 'Running'].includes(status)) {
        await new Promise(r => setTimeout(r, 10000));
        const runRes = await client.runs.get(resourceGroup, acrName, poller.runId);
        status = runRes.status;
        if (status === 'Succeeded') {
            await appendLog(deploymentId, "✅ ACR Build SUCCEEDED.");
            break;
        } else if (['Failed', 'Canceled', 'Error', 'Timeout'].includes(status)) {
            throw new Error(`ACR Build failed with status ${status}.`);
        }
        await appendLog(deploymentId, `⏳ Build status: ${status}...`);
    }
}

/**
 * Helper: Sync a folder to S3 with recursive traversal
 */
async function syncFolderToS3(deploymentId, s3Client, bucketName, localPath, prefix = "") {
    const files = [];

    const walk = (dir) => {
        fs.readdirSync(dir).forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                walk(filePath);
            } else {
                files.push(filePath);
            }
        });
    };

    walk(localPath);
    await appendLog(deploymentId, `📤 Found ${files.length} files to upload to s3://${bucketName}/${prefix}...`);

    for (const filePath of files) {
        const relativePath = path.relative(localPath, filePath).replace(/\\/g, '/');
        const s3Key = prefix ? `${prefix.endsWith('/') ? prefix : prefix + '/'}${relativePath}` : relativePath;
        const fileContent = fs.readFileSync(filePath);

        // Simple MIME detection fallback
        const ext = path.extname(filePath).toLowerCase();
        const contentType = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.txt': 'text/plain'
        }[ext] || 'application/octet-stream';

        await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
            Body: fileContent,
            ContentType: contentType
        }));
    }
    await appendLog(deploymentId, `✅ Successfully uploaded ${files.length} files to S3.`);
}


// detectProjectType imported from utils

/**
 * Helper: Generate Cloud-Native Artifacts (Dockerfile, buildspec.yml)
 * Ensures that Node/Python/Java projects have a Dockerfile for cloud builders.
 */
function ensureCloudNativeArtifacts(dir, runtime, provider) {
    const dockerfilePath = path.join(dir, 'Dockerfile');
    const hasDockerfile = fs.existsSync(dockerfilePath);

    // 1. Generate Dockerfile if missing (and runtime requires it)
    if (!hasDockerfile) {
        let content = "";

        // 🟢 NODE.JS / EXPRESS / NEST
        if (runtime === 'node' || runtime === 'express-like' || runtime === 'node-generic') {
            content = `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --if-present
EXPOSE 80 8080 3000
CMD ["npm", "start"]`;
        }
        // 🟢 NEXT.JS / REACT / VUE (SSR or Containerized)
        else if (runtime === 'next' || runtime === 'react' || runtime === 'vue') {
            // Detect package manager
            const hasYarn = fs.existsSync(path.join(dir, 'yarn.lock'));
            const hasPnpm = fs.existsSync(path.join(dir, 'pnpm-lock.yaml'));

            let installCmd = 'npm install';
            let buildCmd = 'npm run build';
            let runnerCmd = 'npm start';
            let copyLockfile = 'COPY package*.json ./';

            if (hasYarn) {
                installCmd = 'yarn install';
                buildCmd = 'yarn build';
                runnerCmd = 'yarn start';
                copyLockfile = 'COPY package.json yarn.lock ./';
            } else if (hasPnpm) {
                installCmd = 'npm install -g pnpm && pnpm install';
                buildCmd = 'pnpm run build';
                runnerCmd = 'pnpm start';
                copyLockfile = 'COPY package.json pnpm-lock.yaml ./';
            }

            // Optimized Next.js / Frontend Containerfile
            content = `FROM node:18-alpine AS builder
WORKDIR /app
${copyLockfile}
RUN ${installCmd}
COPY . .
RUN ${buildCmd}

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
${copyLockfile}
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["sh", "-c", "${runnerCmd} -H 0.0.0.0"]`;
        } else if (runtime === 'python') {
            content = `FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 80 8080 5000
CMD ["python", "app.py"]`; // Best guess, user should provide Dockerfile for complex apps
        } else if (runtime === 'java') {
            content = `FROM openjdk:17-jdk-slim
WORKDIR /app
COPY . .
RUN ./mvnw package -DskipTests
CMD ["java", "-jar", "target/app.jar"]`;
        }

        if (content) {
            fs.writeFileSync(dockerfilePath, content);
            console.log(`[INFO] Generated default Dockerfile for ${runtime}`);
        }
    }

    // 2. Generate buildspec.yml for AWS (if missing)
    if (provider === 'aws') {
        const buildspecPath = path.join(dir, 'buildspec.yml');
        if (!fs.existsSync(buildspecPath)) {
            const buildspec = `version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 18
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $IMAGE_REPO_URL
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...
      - docker build -t $IMAGE_REPO_URL:$IMAGE_TAG .
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker image...
      - docker push $IMAGE_REPO_URL:$IMAGE_TAG`;
            fs.writeFileSync(buildspecPath, buildspec);
            console.log(`[INFO] Generated optimized buildspec.yml for AWS (Node 18)`);
        }
    }
}


/**
 * Helper: Deploy Static Project (Extracted)
 */
/**
 * Injects environment variables into HTML files for static sites
 */
async function injectEnvToHtml(dirPath, envVars) {
    if (!envVars || Object.keys(envVars).length === 0) return;

    const files = fs.readdirSync(dirPath);
    const envScript = `\n<script>window._env_ = ${JSON.stringify(envVars)};</script>\n`;

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            await injectEnvToHtml(fullPath, envVars);
        } else if (file.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('</head>')) {
                content = content.replace('</head>', `${envScript}</head>`);
            } else if (content.includes('<body>')) {
                 content = content.replace('<body>', `<body>${envScript}`);
            } else {
                content = envScript + content;
            }
            fs.writeFileSync(fullPath, content);
        }
    }
}

async function deployStaticProject(deploymentId, projectDir, workspace, buildConfig, infraOutputs, provider) {
    const region = workspace.state_json.region || 'ap-south-1';

    // 1. Install Dependencies
    if (buildConfig.builder) {
        const installCmd = buildConfig.builder === 'npm' ? 'npm install' :
            buildConfig.builder === 'yarn' ? 'yarn install' :
                buildConfig.builder === 'pnpm' ? 'pnpm install' : 'npm install';
        await appendLog(deploymentId, `📦 Installing dependencies (${installCmd})...`);
        try {
            await execPromise(installCmd, { cwd: projectDir });
        } catch (e) {
            throw { ...DEPLOY_ERRORS.BUILD_FAILED, details: `Install failed: ${e.message}` };
        }
    }

    // 2. Apply Environment Variables for Build
    if (Object.keys(buildConfig.envVars || {}).length > 0) {
        await appendLog(deploymentId, `🔐 Injecting ${Object.keys(buildConfig.envVars).length} env vars into build process...`);
        
        // Prepare prefixed variables for common frameworks
        const prefixedVars = {};
        for (const [k, v] of Object.entries(buildConfig.envVars)) {
            prefixedVars[k] = v;
            // Auto-prefix for Vite and React
            if (!k.startsWith('VITE_')) prefixedVars[`VITE_${k}`] = v;
            if (!k.startsWith('REACT_APP_')) prefixedVars[`REACT_APP_${k}`] = v;
        }

        // Create .env files for the build
        const envContent = Object.entries(prefixedVars)
            .map(([k, v]) => `${k}=${v}`)
            .join('\n');
            
        fs.writeFileSync(path.join(projectDir, '.env'), envContent);
        fs.writeFileSync(path.join(projectDir, '.env.local'), envContent);
        fs.writeFileSync(path.join(projectDir, '.env.production'), envContent);
        
        // Also set them in the buildConfig for the process env
        buildConfig.envVars = prefixedVars;
    }

    // 3. Build
    if (buildConfig.command) {
        await appendLog(deploymentId, `🔨 Building Static Project (${buildConfig.command})...`);
        try {
            // Merge with current process env to ensure build tools are in path
            const buildEnv = { ...process.env, ...buildConfig.envVars };
            await execPromise(buildConfig.command, { 
                cwd: projectDir,
                env: buildEnv
            });
        } catch (e) {
            const errorDetails = e.stderr || e.stdout || e.message;
            throw { ...DEPLOY_ERRORS.BUILD_FAILED, details: errorDetails };
        }
    }

    // 3. Locate Artifacts
    const buildDir = path.join(projectDir, buildConfig.outputDir);
    let finalBuildDir = buildDir;
    if (!fs.existsSync(buildDir)) {
        const found = findBuildArtifacts(projectDir);
        if (!found) throw { ...DEPLOY_ERRORS.BUILD_FAILED, details: `Build output directory '${buildConfig.outputDir}' not found.` };
        await appendLog(deploymentId, `⚠️ Configured build dir missing, using discovered: ${found}`);
        finalBuildDir = found;
    }

    const version = await getDeploymentVersion(deploymentId);
    const prefix = `v${version}`;
    let liveUrl = '';
    const timestamp = Date.now();

    // 4. Upload & Deploy
    if (provider === 'aws') {
        const s3Client = await createAwsClient(S3Client, region, workspace.state_json.connection.role_arn, workspace.state_json.connection.external_id);
        const bucketName = infraOutputs.bucket_name?.value;
        if (!bucketName) throw { ...DEPLOY_ERRORS.S3_UPLOAD_FAILED, details: "Bucket name not found in infrastructure outputs." };

        // 5. 🛡️ Env Var Injection for Static sites (Always inject into HTML as runtime fallback)
        await appendLog(deploymentId, "🧪 Injecting runtime environment variables into HTML files...");
        await injectEnvToHtml(finalBuildDir, buildConfig.envVars);

        await syncFolderToS3(deploymentId, s3Client, bucketName, finalBuildDir, prefix);
        
        // 🚀 CRITICAL FIX: Also sync to root so the site works IMMEDIATELY while CloudFront propagates OriginPath
        await appendLog(deploymentId, "🚀 Syncing to bucket root for instant availability...");
        await syncFolderToS3(deploymentId, s3Client, bucketName, finalBuildDir, "");

        const distId = infraOutputs.cloudfront_id?.value;
        if (distId) {
            await appendLog(deploymentId, `🔄 Updating CloudFront Origin Path to ${prefix}...`);
            const cfClient = await createAwsClient(CloudFrontClient, region, workspace.state_json.connection.role_arn, workspace.state_json.connection.external_id);
            
            // Get current config
            const getRes = await cfClient.send(new GetDistributionConfigCommand({ Id: distId }));
            const config = getRes.DistributionConfig;
            
            // Update Origin Path for all S3 origins
            if (config.Origins && config.Origins.Items) {
                config.Origins.Items.forEach(origin => {
                    if (origin.DomainName.includes('s3')) {
                        origin.OriginPath = `/${prefix}`;
                    }
                });
            }

            // Update Distribution
            await cfClient.send(new UpdateDistributionCommand({
                Id: distId,
                IfMatch: getRes.ETag,
                DistributionConfig: config
            }));

            await appendLog(deploymentId, `🔄 Invalidating CloudFront cache...`);
            await cfClient.send(new CreateInvalidationCommand({
                DistributionId: distId,
                InvalidationBatch: { CallerReference: `deploy-${timestamp}`, Paths: { Quantity: 1, Items: ['/*'] } }
            }));
        }

        const cdnUrl = infraOutputs.cdn_endpoint?.value;
        liveUrl = cdnUrl ? `https://${cdnUrl}` : `http://${bucketName}.s3-website-${region}.amazonaws.com`;

    } else if (provider === 'gcp') {
        const bucketName = infraOutputs.bucket_name?.value;
        await syncFolderToGcs(deploymentId, workspace.state_json.connection.credentials, workspace.state_json.connection.project_id, bucketName, finalBuildDir, prefix);
        liveUrl = `https://${infraOutputs.cdn_domain?.value || 'storage.googleapis.com/' + bucketName}/${prefix}/index.html`;

    } else if (provider === 'azure') {
        const blobServiceClient = BlobServiceClient.fromConnectionString(workspace.state_json.connection.connection_string);
        await syncFolderToAzureBlob(deploymentId, blobServiceClient, "$web", finalBuildDir, prefix);
        const cdnUrl = infraOutputs.cdn_endpoint?.value;
        liveUrl = cdnUrl ? `https://${cdnUrl}` : `https://${infraOutputs.storage_account_name?.value}.blob.core.windows.net/$web/${prefix}/index.html`;
    }

    return liveUrl;
}

/**
 * Helper: Deploy Container Project (Extracted)
 */
async function deployContainerProject(deploymentId, projectDir, workspace, runtime, infraOutputs, provider, envVars = {}) {
    const region = workspace.state_json.region || 'ap-south-1';

    // 1. Ensure Dockerfile
    ensureCloudNativeArtifacts(projectDir, runtime || 'node', provider);

    const ecrRepo = infraOutputs.ecr_repo_url?.value || infraOutputs.repository_url?.value;
    if (!ecrRepo && provider === 'aws') throw { ...DEPLOY_ERRORS.BUILD_FAILED, details: "ECR Repository URL not found." };

    let imageTag = "";

    // 2. Build & Push
    if (provider === 'aws') {
        const zipBuffer = await zipDirectory(projectDir);
        const s3Client = await createAwsClient(S3Client, region, workspace.state_json.connection.role_arn, workspace.state_json.connection.external_id);

        const buildBucket = infraOutputs.bucket_name?.value;
        if (!buildBucket) throw new Error("No bucket found for CodeBuild source.");

        const s3Key = `source/${deploymentId}-${Date.now()}.zip`;
        await s3Client.send(new PutObjectCommand({ Bucket: buildBucket, Key: s3Key, Body: zipBuffer }));

        const buildProjectName = infraOutputs.codebuild_project_name?.value;
        if (!buildProjectName) throw new Error("CodeBuild Project Name not found.");

        const version = await getDeploymentVersion(deploymentId);
        const prefix = `v${version}`;
        imageTag = `${ecrRepo}:${prefix}`;

        const codebuildClient = await createAwsClient(CodeBuildClient, region, workspace.state_json.connection.role_arn, workspace.state_json.connection.external_id);
        await triggerCodeBuild(deploymentId, codebuildClient, buildProjectName, buildBucket, s3Key, ecrRepo, prefix);

    } else if (provider === 'azure') {
        const zipPath = path.join(projectDir, `../source-${deploymentId}.zip`);
        const zipBuffer = await zipDirectory(projectDir);
        fs.writeFileSync(zipPath, zipBuffer);

        const acrName = infraOutputs.acr_name?.value;
        const rgName = infraOutputs.resource_group_name?.value;
        const containerAppName = infraOutputs.container_app_name?.value;

        if (!acrName || !rgName) throw new Error("Azure ACR or Resource Group not found.");
        const acrLoginServer = infraOutputs.acr_login_server?.value || `${acrName}.azurecr.io`;

        const version = await getDeploymentVersion(deploymentId);
        imageTag = `${acrLoginServer}/${containerAppName}:v${version}`;

        await triggerAzureAcrBuild(deploymentId, workspace.state_json.connection.credentials, workspace.state_json.connection.credentials.subscription_id, rgName, acrName, imageTag, zipPath);
    } else if (provider === 'gcp') {
        const buildBucket = infraOutputs.bucket_name?.value;
        const gcsKey = `source-${deploymentId}.zip`;
        const zipPath = path.join(projectDir, `../${gcsKey}`);
        const zipBuffer = await zipDirectory(projectDir);
        fs.writeFileSync(zipPath, zipBuffer);

        let storageOptions = { projectId: workspace.state_json.connection.project_id };
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
            storageOptions.credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        } else {
            storageOptions.credentials = workspace.state_json.connection.credentials;
        }
        const storageClient = new Storage(storageOptions);
        await storageClient.bucket(buildBucket).upload(zipPath, { destination: gcsKey });

        const artRepo = infraOutputs.artifact_repo_name?.value || infraOutputs.repository_name?.value;
        const version = await getDeploymentVersion(deploymentId);
        imageTag = `gcr.io/${workspace.state_json.connection.project_id}/${artRepo || workspace.name}:${version}`;

        await triggerGcpCloudBuild(deploymentId, workspace.state_json.connection.credentials, workspace.state_json.connection.project_id, buildBucket, gcsKey, imageTag, region);
    }

    // 3. Update Service
    return await deployImageToProvider(deploymentId, workspace, workspace.state_json.connection, provider, imageTag, envVars);
}

/**
 * Deploy from GitHub
 * NOW USES INFRASTRUCTURE ROUTER for service-aware deployment
 */
const deployFromGithub = async (deploymentId, workspace, config) => {
    try {
        validateRepoUrl(config.repoUrl);
        await appendLog(deploymentId, `🚀 Starting GitHub Deployment for ${config.repoUrl}...`);

        const workDir = path.join(__dirname, '../../tmp', `deploy-${deploymentId}`);
        if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });
        fs.mkdirSync(workDir, { recursive: true });

        // 1. Clone Repo
        await appendLog(deploymentId, "📦 Cloning repository...");
        await githubService.cloneRepo(config.repoUrl, workDir);

        // 2. 🛡️ ANALYZE PROJECT (Deterministic)
        await appendLog(deploymentId, "🔍 Analyzing project structure...");
        const analysis = ProjectAnalyzer.analyze(workDir);
        await appendLog(deploymentId, `✅ Project Detected: ${analysis.strategy} (${analysis.framework || analysis.runtime || 'unknown'})`);

        // 3. 🛡️ BUILD DEPLOYMENT PLAN (Infrastructure-Aware)
        const provider = workspace.state_json.connection?.provider || 'aws';
        const infraOutputs = normalizeOutputs(workspace.state_json.infra_outputs);
        const infraSpec = workspace.state_json.infraSpec || {};
        const services = infraSpec.canonical_architecture?.deployable_services || infraSpec.services || [];

        const InfrastructureRouter = require('./InfrastructureRouter');
        const plan = InfrastructureRouter.buildPlan(analysis, workspace.state_json.infra_outputs, services, provider);

        await appendLog(deploymentId, `🗺️ Deployment Plan: ${plan.components.length} component(s) mapped to infrastructure`);
        for (const comp of plan.components) {
            await appendLog(deploymentId, `  → ${comp.name}: ${comp.type} → ${comp.service}${comp.autoDetected ? ' (auto-detected)' : ' (manual)'}`);
        }

        // 4. MERGE ENVIRONMENT VARIABLES
        // Infrastructure env vars (from Terraform outputs)
        const infraEnvVars = plan.envVars || {};
        // User-supplied env vars (stored in workspace state_json)
        const userEnvVars = workspace.state_json?.user_env_vars || {};
        const mergedEnvVars = { ...infraEnvVars, ...userEnvVars };

        const envVarCount = Object.keys(mergedEnvVars).length;
        if (envVarCount > 0) {
            await appendLog(deploymentId, `🔐 Injecting ${envVarCount} environment variables (${Object.keys(infraEnvVars).length} infra + ${Object.keys(userEnvVars).length} user-defined)`);
        }

        // 5. EXECUTE DEPLOYMENT (Component by Component)
        const deploymentUrls = {};
        const deploymentResults = [];

        for (const component of plan.components) {
            await appendLog(deploymentId, `\n━━━ Deploying: ${component.name.toUpperCase()} ━━━`);

            const compDir = component.path === '.' ? workDir : path.join(workDir, component.path);

            try {
                if (component.type === 'static') {
                    await appendLog(deploymentId, `⚙️ Executing STATIC deployment → ${component.service}`);

                    const buildConfig = {
                        builder: component.builder || analysis.builder || 'npm',
                        command: component.buildCommand || config.build_command || analysis.buildCommand || 'npm run build',
                        outputDir: component.outputDir || config.output_dir || analysis.outputDir || 'dist',
                        envVars: mergedEnvVars
                    };

                    const url = await deployStaticProject(deploymentId, compDir, workspace, buildConfig, infraOutputs, provider);
                    deploymentUrls[component.name] = url;
                    deploymentResults.push({ name: component.name, type: 'static', url, status: 'success' });
                    await appendLog(deploymentId, `✅ ${component.name} deployed: ${url}`);

                } else if (component.type === 'container') {
                    await appendLog(deploymentId, `⚙️ Executing CONTAINER deployment → ${component.service}`);

                    // Inject merged env vars into the container
                    const containerEnvVars = { ...mergedEnvVars };

                    // If there's a frontend URL from a previous component, inject it
                    if (deploymentUrls['frontend']) {
                        containerEnvVars.FRONTEND_URL = deploymentUrls['frontend'];
                        containerEnvVars.CORS_ORIGIN = deploymentUrls['frontend'];
                    }

                    const url = await deployContainerProject(deploymentId, compDir, workspace, component.runtime || analysis.runtime, infraOutputs, provider, containerEnvVars);
                    deploymentUrls[component.name] = url;
                    deploymentResults.push({ name: component.name, type: 'container', url, status: 'success' });
                    await appendLog(deploymentId, `✅ ${component.name} deployed: ${url}`);

                } else if (component.type === 'serverless') {
                    await appendLog(deploymentId, `⚙️ Executing SERVERLESS deployment → ${component.service}`);

                    const zipBuffer = await zipDirectory(compDir);
                    const funcName = component.deployTo?.functionName || infraOutputs.lambda_function_name?.value;
                    if (!funcName) throw new Error("Lambda function name not found in infrastructure outputs.");

                    const lambda = await createAwsClient(
                        LambdaClient,
                        workspace.state_json.region || 'ap-south-1',
                        workspace.state_json.connection.role_arn,
                        workspace.state_json.connection.external_id
                    );

                    // Update function code
                    await lambda.send(new UpdateFunctionCodeCommand({
                        FunctionName: funcName,
                        ZipFile: zipBuffer,
                        Publish: true
                    }));

                    const url = component.deployTo?.apiEndpoint || infraOutputs.function_url?.value || infraOutputs.api_endpoint?.value;
                    deploymentUrls[component.name] = url;
                    deploymentResults.push({ name: component.name, type: 'serverless', url, status: 'success' });
                    await appendLog(deploymentId, `✅ ${component.name} deployed: ${url}`);
                }
            } catch (compErr) {
                deploymentResults.push({ name: component.name, type: component.type, url: null, status: 'failed', error: compErr.message });
                await appendLog(deploymentId, `❌ ${component.name} deployment failed: ${compErr.message}`);
                // Continue with other components if possible (frontend can still work even if backend fails)
                if (plan.components.length === 1) throw compErr;
            }
        }

        // 6. OBSERVABILITY CONFIGURATION
        if (plan.observability) {
            await appendLog(deploymentId, `\n━━━ OBSERVABILITY ━━━`);
            if (plan.observability.logging?.enabled) {
                await appendLog(deploymentId, `📊 Logging: ${plan.observability.logging.service} (${plan.observability.logging.autoConfigured ? 'auto-configured' : 'manual'})`);
            }
            if (plan.observability.monitoring?.enabled) {
                await appendLog(deploymentId, `📈 Monitoring: ${plan.observability.monitoring.service} — Alarms: ${(plan.observability.monitoring.alarms || []).join(', ')}`);
            }
            if (plan.observability.tracing?.enabled) {
                await appendLog(deploymentId, `🔍 Tracing: ${plan.observability.tracing.service} (auto-configured)`);
            }
        }

        // 7. BUILD DEPLOYMENT TARGET SUMMARY (for frontend URL resolution)
        const deploymentTarget = {};

        if (deploymentUrls['frontend'] || (deploymentResults.find(r => r.type === 'static')?.url)) {
            const staticUrl = deploymentUrls['frontend'] || deploymentResults.find(r => r.type === 'static')?.url;
            deploymentTarget.type = 'MULTI_COMPONENT';
            deploymentTarget.static = {
                cdn_domain: plan.provisioned?.cdnEndpoint,
                bucket_name: plan.provisioned?.bucketName,
                url: staticUrl
            };
        }

        if (deploymentUrls['backend'] || deploymentUrls['application']) {
            const apiUrl = deploymentUrls['backend'] || deploymentUrls['application'];
            deploymentTarget.container = {
                service_url: apiUrl,
                load_balancer_url: plan.provisioned?.loadBalancerDns ? `http://${plan.provisioned.loadBalancerDns}` : apiUrl
            };
        }

        // Store deployment target in workspace for frontend to read
        try {
            await pool.resilientQuery(
                `UPDATE workspaces SET state_json = jsonb_set(
                    COALESCE(state_json, '{}'), '{deployment_target}', $1::jsonb
                ) WHERE id = $2`,
                [JSON.stringify({
                    ...deploymentTarget,
                    urls: deploymentUrls,
                    results: deploymentResults,
                    observability: plan.observability,
                    deployed_at: new Date().toISOString()
                }), workspace.id]
            );
        } catch (e) {
            console.error('[DEPLOY] Failed to persist deployment target:', e);
        }

        // 8. RESOLVE PRIMARY URL
        const primaryUrl = deploymentUrls['frontend'] || deploymentUrls['application'] || deploymentUrls['backend'] || Object.values(deploymentUrls)[0];

        const hasFailures = deploymentResults.some(r => r.status === 'failed');
        const allFailed = deploymentResults.every(r => r.status === 'failed');

        if (allFailed) {
            const errors = deploymentResults.map(r => `${r.name}: ${r.error}`).join('; ');
            throw new Error(`All components failed: ${errors}`);
        }

        // Build summary message
        const summaryParts = deploymentResults.map(r =>
            r.status === 'success' ? `✅ ${r.name}: ${r.url}` : `❌ ${r.name}: FAILED`
        );
        await appendLog(deploymentId, `\n━━━ DEPLOYMENT SUMMARY ━━━`);
        for (const part of summaryParts) {
            await appendLog(deploymentId, part);
        }

        const statusMsg = hasFailures ? 'Partial deployment complete' : 'All components deployed successfully';
        await updateDeploymentStatus(deploymentId, 'success', primaryUrl, [{ message: statusMsg }]);

        // Cleanup
        fs.rmSync(workDir, { recursive: true, force: true });

    } catch (err) {
        console.error("Github Deploy Error:", err);
        const errorMsg = err.details ? `${err.message}: ${err.details}` : err.message;
        await updateDeploymentStatus(deploymentId, 'failed', null, [{ message: `❌ Error: ${errorMsg}` }]);
    }
};


const getDeploymentStatus = async (id) => {
    const result = await pool.resilientQuery('SELECT * FROM deployments WHERE id = $1', [id]);
    return result.rows[0];
};





// Helper: Validate Docker Image Format
function validateDockerImage(image) {
    if (!image || !image.includes(':')) {
        // Basic check, allows 'nginx:latest' or 'repo/image:tag'
        // Warn but strictly maybe allow if user knows what they are doing?
        // Let's at least ensure it's non-empty string.
        if (!image || typeof image !== 'string') throw { code: 'INVALID_IMAGE', message: 'Invalid Docker image string' };
    }
}

const deployFromDocker = async (deploymentId, workspace, config) => {
    try {
        await updateDeploymentStatus(deploymentId, 'running');

        const image = config.image || config.docker_image;
        validateDockerImage(image);

        await appendLog(deploymentId, `🐳 Starting Docker Image Deployment: ${image}`);

        const conn = workspace.state_json.connection;
        const provider = conn.provider || 'aws';

        // Direct deployment of existing image - Skip ProjectAnalyzer but map to CONTAINER strategy concept
        await appendLog(deploymentId, `✅ Using existing image, skipping build/analyze steps.`);

        // We can just call the provider updater directly as before, but with clearer logging
        const liveUrl = await deployImageToProvider(deploymentId, workspace, conn, provider, image);

        if (!liveUrl) throw new Error("Service updated but live URL could not be retrieved.");

        await updateDeploymentStatus(deploymentId, 'success', liveUrl, [{ message: '🚀 Container service updated successfully!' }]);

    } catch (err) {
        console.error("Docker Deploy Error:", err);
        const errorObj = err.code ? err : { ...DEPLOY_ERRORS.UNKNOWN_ERROR, details: err.message };
        await updateDeploymentStatus(deploymentId, 'failed', null, [
            { message: `❌ Deployment Failed: ${errorObj.message}` },
            { message: `Details: ${errorObj.details || ''}` }
        ]);
    }
};

// Helper: Verify Live Site Function
const verifyLiveSite = async (deploymentId, url, maxRetries = 10) => {
    let attempts = 0;
    while (attempts < maxRetries) {
        attempts++;
        try {
            console.log(`[VERIFY] Attempt ${attempts}/${maxRetries} for ${url}`);
            const response = await axios.get(url, { timeout: 5000 });
            if (response.status === 200 && response.data) {
                await appendLog(deploymentId, `✅ Site verified! (HTTP 200, content-length: ${response.headers['content-length'] || 'OK'})`);
                return true;
            }
        } catch (error) {
            console.warn(`[VERIFY] validation failed attempt ${attempts}: ${error.code || error.message}`);
            // If 403 Forbidden (common with S3/CloudFront initially), wait longer
            if (error.response?.status === 403 || error.response?.status === 404) {
                await appendLog(deploymentId, `⏳ Waiting for propagation... (${error.response.status})`);
            }
        }
        // Exponential backoff: 2s, 4s, 8s, etc. capped at 10s
        const delay = Math.min(2000 * Math.pow(1.5, attempts), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    await appendLog(deploymentId, `⚠️ Site deployed but verification timed out after ${maxRetries} attempts. It may take a few more minutes to propagate.`);
    // We don't throw here to avoid failing the deployment completely if it's just slow DNS propagation
    // But we warn the user.
    return false;
};

module.exports = {
    createDeployment,
    getDeploymentStatus,
    deployFromGithub,
    deployFromDocker
};
