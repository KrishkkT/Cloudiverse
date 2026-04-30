/**
 * Infrastructure Router
 * Maps project analysis results to ACTUAL provisioned infrastructure.
 * 
 * Unlike the DeploymentStrategyResolver which only looks at project type,
 * this reads infra_outputs (what Terraform created) and routes each
 * component to the exact correct cloud service.
 */

class InfrastructureRouter {

    /**
     * Build a deployment plan by matching project analysis with provisioned infrastructure
     * @param {Object} analysis - Output from ProjectAnalyzer.analyze()
     * @param {Object} infraOutputs - Terraform outputs (from workspace.state_json.infra_outputs)
     * @param {Object} services - Canonical services from infraSpec
     * @param {string} provider - aws | gcp | azure
     * @returns {Object} Deployment plan with component-to-service mappings
     */
    static buildPlan(analysis, infraOutputs, services = [], provider = 'aws') {
        const outputs = this.normalizeOutputs(infraOutputs || {});
        const provisioned = this.detectProvisionedCapabilities(outputs, services, provider);
        const components = this.mapComponentsToInfra(analysis, provisioned, provider);

        return {
            components,
            provisioned,
            provider,
            envVars: this.buildEnvVarMap(outputs, provider),
            observability: this.buildObservabilityConfig(outputs, provisioned, provider),
            summary: this.buildSummary(components)
        };
    }

    /**
     * Normalize infra_outputs to consistent { key: value } format
     */
    static normalizeOutputs(outputs) {
        if (!outputs) return {};
        const normalized = {};
        for (const [key, val] of Object.entries(outputs)) {
            if (val && typeof val === 'object' && 'value' in val) {
                normalized[key] = val.value;
            } else {
                normalized[key] = val;
            }
        }
        return normalized;
    }

    /**
     * Detect what infrastructure capabilities are actually provisioned
     */
    static detectProvisionedCapabilities(outputs, services, provider) {
        const capabilities = {
            // Storage & CDN (for static frontend)
            hasStaticHosting: false,
            bucketName: null,
            cdnEndpoint: null,
            cdnDistributionId: null,

            // Container Compute (for backend APIs, SSR apps)
            hasContainerCompute: false,
            ecsClusterName: null,
            ecsServiceName: null,
            ecrRepoUrl: null,
            containerServiceUrl: null,
            loadBalancerDns: null,

            // Serverless (for functions)
            hasServerless: false,
            lambdaFunctionName: null,
            apiGatewayEndpoint: null,

            // Database
            hasDatabase: false,
            dbEndpoint: null,
            dbPort: null,
            dbName: null,

            // Cache
            hasCache: false,
            cacheEndpoint: null,
            cachePort: null,

            // Auth
            hasAuth: false,
            authClientId: null,
            authIssuerUrl: null,

            // Storage (Object)
            hasObjectStorage: false,
            storageBucketName: null,

            // Observability
            hasMonitoring: false,
            hasLogging: false,
            logGroupName: null,
            monitoringDashboard: null,

            // Build Pipeline
            hasCodeBuild: false,
            codeBuildProjectName: null,

            // Secrets
            hasSecretsManager: false,
        };

        // --- Detect from outputs ---

        // Static Hosting (S3/GCS/Azure Blob + CDN)
        if (outputs.bucket_name || outputs.website_bucket_name) {
            capabilities.hasStaticHosting = true;
            capabilities.bucketName = outputs.bucket_name || outputs.website_bucket_name;
            capabilities.cdnEndpoint = outputs.cdn_endpoint || outputs.cloudfront_domain || outputs.cdn_domain;
            capabilities.cdnDistributionId = outputs.cloudfront_id || outputs.cdn_distribution_id;
        }

        // Container Compute (ECS / Cloud Run / Container Apps)
        if (outputs.ecs_cluster_name || outputs.cluster_name || outputs.container_service_name) {
            capabilities.hasContainerCompute = true;
            capabilities.ecsClusterName = outputs.ecs_cluster_name || outputs.cluster_name;
            capabilities.ecsServiceName = outputs.container_service_name || outputs.ecs_service_name || outputs.service_name;
            capabilities.ecrRepoUrl = outputs.ecr_repo_url || outputs.repository_url;
            capabilities.loadBalancerDns = outputs.lb_dns_name || outputs.load_balancer_dns || outputs.alb_dns_name;
            capabilities.containerServiceUrl = outputs.service_endpoint || outputs.service_url;
        }

        // Also check nested compute_container / computecontainer objects
        const cc = outputs.computecontainer || outputs.compute_container;
        if (cc && typeof cc === 'object') {
            capabilities.hasContainerCompute = true;
            capabilities.ecsClusterName = capabilities.ecsClusterName || cc.cluster_name || cc.ecs_cluster_name;
            capabilities.ecsServiceName = capabilities.ecsServiceName || cc.service_name || cc.container_service_name;
            capabilities.ecrRepoUrl = capabilities.ecrRepoUrl || cc.ecr_repo_url || cc.repository_url;
            capabilities.loadBalancerDns = capabilities.loadBalancerDns || cc.load_balancer_dns;
        }

        // Serverless (Lambda / Cloud Functions)
        if (outputs.lambda_function_name || outputs.function_name) {
            capabilities.hasServerless = true;
            capabilities.lambdaFunctionName = outputs.lambda_function_name || outputs.function_name;
            capabilities.apiGatewayEndpoint = outputs.api_endpoint || outputs.function_url;
        }

        // Database
        if (outputs.database_endpoint || outputs.db_endpoint || outputs.rds_endpoint) {
            capabilities.hasDatabase = true;
            capabilities.dbEndpoint = outputs.database_endpoint || outputs.db_endpoint || outputs.rds_endpoint;
            capabilities.dbPort = outputs.db_port || outputs.database_port || '5432';
            capabilities.dbName = outputs.db_name || outputs.database_name || 'app_db';
        }
        // Nested relational_db / relationaldatabase
        const rdb = outputs.relationaldatabase || outputs.relational_db;
        if (rdb && typeof rdb === 'object') {
            capabilities.hasDatabase = true;
            capabilities.dbEndpoint = capabilities.dbEndpoint || rdb.endpoint || rdb.address;
            capabilities.dbPort = capabilities.dbPort || rdb.port || '5432';
            capabilities.dbName = capabilities.dbName || rdb.name || 'app_db';
        }

        // Cache
        if (outputs.cache_endpoint || outputs.redis_endpoint) {
            capabilities.hasCache = true;
            capabilities.cacheEndpoint = outputs.cache_endpoint || outputs.redis_endpoint;
            capabilities.cachePort = outputs.cache_port || '6379';
        }

        // Auth
        if (outputs.auth_client_id || outputs.cognito_client_id || outputs.user_pool_client_id) {
            capabilities.hasAuth = true;
            capabilities.authClientId = outputs.auth_client_id || outputs.cognito_client_id || outputs.user_pool_client_id;
            capabilities.authIssuerUrl = outputs.auth_issuer_url || outputs.cognito_issuer_url;
        }

        // Object Storage (separate from static hosting bucket)
        if (outputs.storage_bucket_name || outputs.assets_bucket_name) {
            capabilities.hasObjectStorage = true;
            capabilities.storageBucketName = outputs.storage_bucket_name || outputs.assets_bucket_name || capabilities.bucketName;
        }

        // Observability
        if (outputs.log_group_name || outputs.log_group) {
            capabilities.hasLogging = true;
            capabilities.logGroupName = outputs.log_group_name || outputs.log_group;
        }
        if (outputs.monitoring_dashboard || outputs.dashboard_url) {
            capabilities.hasMonitoring = true;
            capabilities.monitoringDashboard = outputs.monitoring_dashboard || outputs.dashboard_url;
        }

        // Build Pipeline
        if (outputs.codebuild_project_name || outputs.build_project) {
            capabilities.hasCodeBuild = true;
            capabilities.codeBuildProjectName = outputs.codebuild_project_name || outputs.build_project;
        }

        // Secrets Manager
        if (outputs.secrets_manager_arn || outputs.secret_arn) {
            capabilities.hasSecretsManager = true;
        }

        // Also check service list for capabilities not in outputs
        const serviceIds = services.map(s => (s.canonical_type || s.service_id || s).toLowerCase());
        if (!capabilities.hasMonitoring && serviceIds.includes('monitoring')) capabilities.hasMonitoring = true;
        if (!capabilities.hasLogging && serviceIds.includes('logging')) capabilities.hasLogging = true;

        return capabilities;
    }

    /**
     * Map project components to infrastructure targets
     */
    static mapComponentsToInfra(analysis, provisioned, provider) {
        if (!analysis) {
            return [{
                name: 'application',
                type: 'unknown',
                target: provisioned.hasContainerCompute ? 'container' : 'static',
                service: provisioned.hasContainerCompute ? 'ECS Fargate' : 'S3 + CloudFront',
                autoDetected: false,
                path: '.'
            }];
        }

        const components = [];

        // FULLSTACK_SPLIT: separate frontend + backend
        if (analysis.strategy === 'FULLSTACK_SPLIT' && analysis.structure) {
            // Frontend component
            if (provisioned.hasStaticHosting) {
                components.push({
                    name: 'frontend',
                    type: 'static',
                    target: 'static',
                    service: this.getServiceLabel('static', provider),
                    path: analysis.structure.frontend || 'client',
                    buildCommand: 'npm run build',
                    outputDir: 'dist',
                    deployTo: {
                        bucket: provisioned.bucketName,
                        cdn: provisioned.cdnEndpoint,
                        cdnId: provisioned.cdnDistributionId
                    },
                    autoDetected: true
                });
            }

            // Backend component
            if (provisioned.hasContainerCompute) {
                components.push({
                    name: 'backend',
                    type: 'container',
                    target: 'container',
                    service: this.getServiceLabel('container', provider),
                    path: analysis.structure.backend || 'server',
                    runtime: 'node',
                    deployTo: {
                        cluster: provisioned.ecsClusterName,
                        service: provisioned.ecsServiceName,
                        registry: provisioned.ecrRepoUrl,
                        loadBalancer: provisioned.loadBalancerDns
                    },
                    autoDetected: true
                });
            } else if (provisioned.hasServerless) {
                components.push({
                    name: 'backend',
                    type: 'serverless',
                    target: 'serverless',
                    service: this.getServiceLabel('serverless', provider),
                    path: analysis.structure.backend || 'server',
                    deployTo: {
                        functionName: provisioned.lambdaFunctionName,
                        apiEndpoint: provisioned.apiGatewayEndpoint
                    },
                    autoDetected: true
                });
            }
        }
        // STATIC project
        else if (analysis.strategy === 'STATIC') {
            if (provisioned.hasStaticHosting) {
                components.push({
                    name: 'application',
                    type: 'static',
                    target: 'static',
                    service: this.getServiceLabel('static', provider),
                    path: '.',
                    buildCommand: analysis.buildCommand || 'npm run build',
                    outputDir: analysis.outputDir || 'dist',
                    builder: analysis.builder || 'npm',
                    deployTo: {
                        bucket: provisioned.bucketName,
                        cdn: provisioned.cdnEndpoint,
                        cdnId: provisioned.cdnDistributionId
                    },
                    autoDetected: true
                });
            } else if (provisioned.hasContainerCompute) {
                // Fallback: no static hosting provisioned, serve via container
                components.push({
                    name: 'application',
                    type: 'container',
                    target: 'container',
                    service: this.getServiceLabel('container', provider),
                    path: '.',
                    runtime: analysis.runtime || 'node',
                    autoDetected: true,
                    note: 'No static hosting provisioned — deploying as container with nginx',
                    deployTo: {
                        cluster: provisioned.ecsClusterName,
                        service: provisioned.ecsServiceName,
                        registry: provisioned.ecrRepoUrl
                    }
                });
            }
        }
        // CONTAINER project (Node API, Java, Python, etc.)
        else if (analysis.strategy === 'CONTAINER') {
            // Mixed Monolith Split Support: If we have BOTH and it's a mixed-monolith with structure
            if (analysis.framework === 'mixed-monolith' && analysis.structure && provisioned.hasStaticHosting && provisioned.hasContainerCompute) {
                components.push({
                    name: 'frontend',
                    type: 'static',
                    target: 'static',
                    service: this.getServiceLabel('static', provider),
                    path: analysis.structure.frontend || '.',
                    buildCommand: 'npm run build',
                    outputDir: 'dist',
                    deployTo: {
                        bucket: provisioned.bucketName,
                        cdn: provisioned.cdnEndpoint,
                        cdnId: provisioned.cdnDistributionId
                    },
                    autoDetected: true,
                    note: 'Split mixed-monolith frontend to static hosting'
                });

                components.push({
                    name: 'backend',
                    type: 'container',
                    target: 'container',
                    service: this.getServiceLabel('container', provider),
                    path: analysis.structure.backend || '.',
                    runtime: analysis.runtime || 'node',
                    deployTo: {
                        cluster: provisioned.ecsClusterName,
                        service: provisioned.ecsServiceName,
                        registry: provisioned.ecrRepoUrl,
                        loadBalancer: provisioned.loadBalancerDns
                    },
                    autoDetected: true,
                    note: 'Split mixed-monolith backend to container'
                });
            } else if (provisioned.hasContainerCompute) {
                components.push({
                    name: 'application',
                    type: 'container',
                    target: 'container',
                    service: this.getServiceLabel('container', provider),
                    path: '.',
                    runtime: analysis.runtime || 'node',
                    framework: analysis.framework,
                    deployTo: {
                        cluster: provisioned.ecsClusterName,
                        service: provisioned.ecsServiceName,
                        registry: provisioned.ecrRepoUrl,
                        loadBalancer: provisioned.loadBalancerDns
                    },
                    autoDetected: true
                });
            } else if (provisioned.hasServerless) {
                components.push({
                    name: 'application',
                    type: 'serverless',
                    target: 'serverless',
                    service: this.getServiceLabel('serverless', provider),
                    path: '.',
                    runtime: analysis.runtime,
                    deployTo: {
                        functionName: provisioned.lambdaFunctionName,
                        apiEndpoint: provisioned.apiGatewayEndpoint
                    },
                    autoDetected: true
                });
            } else if (provisioned.hasStaticHosting) {
                // Fallback: no container compute, serve as static site (if framework allows)
                components.push({
                    name: 'application',
                    type: 'static',
                    target: 'static',
                    service: this.getServiceLabel('static', provider),
                    path: (analysis.structure && analysis.structure.frontend) || '.',
                    autoDetected: false,
                    note: 'No container compute provisioned — trying static hosting fallback',
                    deployTo: {
                        bucket: provisioned.bucketName,
                        cdn: provisioned.cdnEndpoint
                    }
                });
            }
        }
        // SERVERLESS
        else if (analysis.strategy === 'SERVERLESS') {
            if (provisioned.hasServerless) {
                components.push({
                    name: 'application',
                    type: 'serverless',
                    target: 'serverless',
                    service: this.getServiceLabel('serverless', provider),
                    path: '.',
                    deployTo: {
                        functionName: provisioned.lambdaFunctionName,
                        apiEndpoint: provisioned.apiGatewayEndpoint
                    },
                    autoDetected: true
                });
            }
        }

        // If no components matched, create a default
        if (components.length === 0) {
            const defaultTarget = provisioned.hasContainerCompute ? 'container' :
                provisioned.hasStaticHosting ? 'static' : 'container';
            components.push({
                name: 'application',
                type: defaultTarget,
                target: defaultTarget,
                service: this.getServiceLabel(defaultTarget, provider),
                path: '.',
                runtime: analysis?.runtime || 'node',
                autoDetected: false,
                note: 'Could not auto-detect ideal target. Please verify.'
            });
        }

        return components;
    }

    /**
     * Build environment variable map from infrastructure outputs
     */
    static buildEnvVarMap(outputs, provider) {
        const envVars = {};

        // Database
        const dbEndpoint = outputs.database_endpoint || outputs.db_endpoint || outputs.rds_endpoint;
        const rdb = outputs.relationaldatabase || outputs.relational_db;
        if (dbEndpoint) {
            envVars.DB_HOST = dbEndpoint;
            envVars.DB_PORT = outputs.db_port || '5432';
            envVars.DB_NAME = outputs.db_name || 'app_db';
            envVars.DB_USER = outputs.db_username || 'dbadmin';
            envVars.DATABASE_URL = `postgres://${envVars.DB_USER}:{{DB_PASSWORD}}@${dbEndpoint}:${envVars.DB_PORT}/${envVars.DB_NAME}`;
        } else if (rdb && typeof rdb === 'object') {
            envVars.DB_HOST = rdb.endpoint || rdb.address;
            envVars.DB_PORT = rdb.port || '5432';
            envVars.DB_NAME = rdb.name || 'app_db';
            envVars.DATABASE_URL = `postgres://dbadmin:{{DB_PASSWORD}}@${envVars.DB_HOST}:${envVars.DB_PORT}/${envVars.DB_NAME}`;
        }

        // Cache / Redis
        const cacheEndpoint = outputs.cache_endpoint || outputs.redis_endpoint;
        if (cacheEndpoint) {
            envVars.REDIS_HOST = cacheEndpoint;
            envVars.REDIS_PORT = outputs.cache_port || '6379';
            envVars.REDIS_URL = `redis://${cacheEndpoint}:${envVars.REDIS_PORT}`;
        }

        // Object Storage
        const bucket = outputs.bucket_name || outputs.storage_bucket_name;
        if (bucket) {
            envVars.STORAGE_BUCKET = bucket;
            envVars.STORAGE_REGION = outputs.region || outputs.bucket_region;
        }

        // CDN
        const cdn = outputs.cdn_endpoint || outputs.cloudfront_domain;
        if (cdn) {
            envVars.CDN_URL = `https://${cdn}`;
        }

        // Auth
        const authId = outputs.auth_client_id || outputs.cognito_client_id;
        if (authId) {
            envVars.AUTH_CLIENT_ID = authId;
            envVars.AUTH_ISSUER = outputs.auth_issuer_url || outputs.cognito_issuer_url || '';
        }

        // API Gateway / Load Balancer / Container Service URL
        const apiEndpoint = outputs.api_endpoint || outputs.function_url || outputs.load_balancer_dns || outputs.service_url || outputs.service_endpoint;
        if (apiEndpoint) {
            envVars.API_URL = apiEndpoint.startsWith('http') ? apiEndpoint : `http://${apiEndpoint}`;
        }

        // Message Queue
        if (outputs.queue_url || outputs.sqs_url) {
            envVars.QUEUE_URL = outputs.queue_url || outputs.sqs_url;
        }

        // Region
        if (outputs.region) {
            envVars.AWS_REGION = outputs.region;
        }
        
        // Observability
        if (outputs.log_group_name || outputs.log_group) {
            envVars.LOG_GROUP_NAME = outputs.log_group_name || outputs.log_group;
        }
        if (outputs.monitoring_dashboard) {
            envVars.MONITORING_DASHBOARD = outputs.monitoring_dashboard;
        }

        // Node Environment
        envVars.NODE_ENV = 'production';

        return envVars;
    }

    /**
     * Build observability configuration
     */
    static buildObservabilityConfig(outputs, provisioned, provider) {
        const config = {
            logging: { enabled: false },
            monitoring: { enabled: false },
            tracing: { enabled: false }
        };

        if (provider === 'aws') {
            // CloudWatch Logs
            config.logging = {
                enabled: true,
                service: 'CloudWatch Logs',
                logGroup: provisioned.logGroupName || `/ecs/cloudiverse-app`,
                autoConfigured: true
            };

            // CloudWatch Metrics & Alarms
            if (provisioned.hasMonitoring) {
                config.monitoring = {
                    enabled: true,
                    service: 'CloudWatch Metrics',
                    dashboard: provisioned.monitoringDashboard,
                    alarms: ['CPUUtilization > 80%', 'MemoryUtilization > 85%', '5xxErrors > 10'],
                    autoConfigured: true
                };
            }

            // X-Ray Tracing (if ECS)
            if (provisioned.hasContainerCompute) {
                config.tracing = {
                    enabled: true,
                    service: 'AWS X-Ray',
                    autoConfigured: true
                };
            }
        } else if (provider === 'gcp') {
            config.logging = { enabled: true, service: 'Cloud Logging', autoConfigured: true };
            config.monitoring = { enabled: provisioned.hasMonitoring, service: 'Cloud Monitoring', autoConfigured: true };
            config.tracing = { enabled: true, service: 'Cloud Trace', autoConfigured: true };
        } else if (provider === 'azure') {
            config.logging = { enabled: true, service: 'Azure Monitor Logs', autoConfigured: true };
            config.monitoring = { enabled: provisioned.hasMonitoring, service: 'Azure Monitor', autoConfigured: true };
            config.tracing = { enabled: true, service: 'Application Insights', autoConfigured: true };
        }

        return config;
    }

    /**
     * Build human-readable summary
     */
    static buildSummary(components) {
        return components.map(c => ({
            name: c.name,
            type: c.type,
            service: c.service,
            autoDetected: c.autoDetected,
            note: c.note || null
        }));
    }

    /**
     * Get provider-specific service label
     */
    static getServiceLabel(target, provider) {
        const labels = {
            aws: { static: 'S3 + CloudFront', container: 'ECS Fargate + ALB', serverless: 'Lambda + API Gateway' },
            gcp: { static: 'Cloud Storage + CDN', container: 'Cloud Run', serverless: 'Cloud Functions' },
            azure: { static: 'Azure Blob + CDN', container: 'Container Apps', serverless: 'Azure Functions' }
        };
        return (labels[provider] || labels.aws)[target] || target;
    }
}

module.exports = InfrastructureRouter;
