const patternResolver = require('../services/core/patternResolver');
const diagramExportService = require('../services/core/diagramExportService');
const assetService = require('../services/shared/assetService');
const Workspace = require('../models/Workspace');
const aiService = require('../services/ai/aiService');

class ArchitectureController {

    /**
     * Validate if a service removal is legal
     * POST /api/architecture/validate-removal
     * Body: { service_id: string, current_infra: object }
     */
    async validateRemoval(req, res) {
        try {
            const { service_id, current_infra } = req.body;

            if (!service_id || !current_infra) {
                return res.status(400).json({ error: 'Missing service_id or current_infra' });
            }

            const result = patternResolver.validateServiceRemoval(service_id, current_infra);

            return res.json(result);

        } catch (error) {
            console.error('[ArchController] Error validating removal:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Reconcile architecture after a change (Add/Remove)
     * POST /api/architecture/reconcile
     * Body: { current_infra: object, capabilities: object }
     */
    async reconcile(req, res) {
        try {
            const { current_infra, action } = req.body;

            if (!current_infra || !action) {
                return res.status(400).json({ error: 'Missing current_infra or action' });
            }

            // 1. If Remove, run validation first (optional safety net)
            if (action.type === 'REMOVE_SERVICE') {
                const validation = patternResolver.validateServiceRemoval(action.serviceId, current_infra);
                if (!validation.valid) {
                    return res.status(409).json({ error: validation.error });
                }
            }

            // 2. Run Reconciliation Engine
            const reconciled = patternResolver.reconcileArchitecture(current_infra, action);

            return res.json(reconciled);

        } catch (error) {
            console.error('[ArchController] Error reconciling:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Export and share diagram
     * POST /api/architecture/export-diagram
     */
    async exportDiagram(req, res) {
        try {
            const { workspaceId, architectureData, provider } = req.body;

            console.log(`[ArchController] Export request: workspaceId=${workspaceId}, provider=${provider}`);
            console.log(`[ArchController] Architecture Data keys:`, architectureData ? Object.keys(architectureData) : 'null');

            if (!workspaceId || !architectureData || !provider) {
                console.error('[ArchController] Missing fields:', { workspaceId: !!workspaceId, architectureData: !!architectureData, provider: !!provider });
                return res.status(400).json({ error: 'Missing required fields: workspaceId, architectureData, or provider' });
            }

            // 1. Generate Artifacts (SVG/PNG)
            const artifacts = await diagramExportService.generateArtifacts(workspaceId, architectureData, provider);

            // 2. Upload to Cloud Storage
            const timestamp = Date.now();
            const svgKey = `diagrams/${workspaceId}/arch-${artifacts.hash}.svg`;
            const pngKey = `diagrams/${workspaceId}/arch-${artifacts.hash}.png`;

            const svgUrl = await assetService.uploadAsset(svgKey, artifacts.svg, 'image/svg+xml');
            
            let pngUrl = null;
            if (artifacts.png) {
                pngUrl = await assetService.uploadAsset(pngKey, artifacts.png, 'image/png');
            }

            // 3. Return URLs
            return res.json({
                success: true,
                urls: {
                    svg: svgUrl,
                    png: pngUrl
                },
                hash: artifacts.hash
            });

        } catch (error) {
            console.error('[ArchController] Export diagram error:', error);
            return res.status(500).json({ error: 'Failed to export diagram' });
        }
    }

    /**
     * Get metadata for public share page
     * GET /api/architecture/share-metadata/:workspaceId
     */
    async getShareMetadata(req, res) {
        try {
            const { workspaceId } = req.params;

            // Fetch workspace (public info only)
            const workspace = await Workspace.findById(workspaceId);
            if (!workspace) {
                return res.status(404).json({ error: 'Workspace not found' });
            }

            // Extract relevant metadata
            const state = workspace.state_json || {};
            const summary = {
                name: workspace.name,
                provider: state.selected_provider || 'Cloud',
                pattern: state.infraSpec?.architecture_pattern || 'Custom Architecture',
                serviceCount: state.infraSpec?.canonical_architecture?.services?.length || 0,
                description: state.description
            };

            // Get existing diagram if available (via hash or most recent)
            // For now, we assume the frontend provides the URL or we look up by a pattern
            // A more robust way would be storing the active diagram URL in the workspace model
            
            return res.json({
                summary,
                // We'll let the frontend provide the URL from the workspace state if stored
                // Or we can construct it if we use a standard naming convention
            });

        } catch (error) {
            console.error('[ArchController] Share metadata error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * AI-Driven Validation of Completeness
     */
    async validateCompleteness(req, res) {
        try {
            const { description, current_services, catalog } = req.body;
            if (!description || !current_services) {
                return res.status(400).json({ error: 'Missing description or current_services' });
            }

            const validation = await aiService.validateServiceCompleteness(description, current_services, catalog || {});
            return res.json(validation);

        } catch (error) {
            console.error('[ArchController] Validation error:', error);
            // Fallback to empty suggestions on AI failure
            return res.json({ suggestions: [] });
        }
    }
}

module.exports = new ArchitectureController();
