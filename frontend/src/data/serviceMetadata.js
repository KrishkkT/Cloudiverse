/**
 * Service Metadata for UI Popups
 * Contains descriptions, "how it works", and official docs links.
 */

export const SERVICE_METADATA = {
    // Compute
    computeserverless: {
        desc: "Run code without provisioning or managing servers.",
        howItWorks: "Upload your code and the cloud provider handles the infrastructure. Autoscales from 0 to thousands of instances.",
        pros: ["No server management required", "Pay only for compute time used", "Automatic scaling"],
        cons: ["Cold start latency", "Execution time limits", "Limited runtime environment control"],
        bestFor: ["Event-driven applications", "Sporadic workloads", "Microservices"],
        links: {
            aws: "https://aws.amazon.com/lambda/",
            gcp: "https://cloud.google.com/functions",
            azure: "https://azure.microsoft.com/en-us/products/functions/"
        }
    },
    computecontainer: {
        desc: "Deploy and manage containerized applications easily.",
        howItWorks: "Orchestrates Docker containers, managing scale and health automatically.",
        pros: ["Consistent environment (Dev vs Prod)", "Portable across clouds", "Efficient resource utilization"],
        cons: ["Higher complexity than serverless", "Container orchestration overhead", "Security management responsibility"],
        bestFor: ["Microservices architectures", "Long-running processes", "Migrating legacy apps"],
        links: {
            aws: "https://aws.amazon.com/fargate/",
            gcp: "https://cloud.google.com/run",
            azure: "https://azure.microsoft.com/en-us/products/container-apps/"
        }
    },
    computevm: {
        desc: "Virtual Machines for full control over the OS.",
        howItWorks: "Provides a virtualized server instance where you manage the OS, software, and configuration.",
        pros: ["Full control over OS and software", "Legacy application support", "Flexible instance types"],
        cons: ["Manual OS patching and maintenance", "Slower scaling than containers/serverless", "Pay for idle time"],
        bestFor: ["Legacy monoliths", "Specific OS requirements", "High-performance computing"],
        links: {
            aws: "https://aws.amazon.com/ec2/",
            gcp: "https://cloud.google.com/compute",
            azure: "https://azure.microsoft.com/en-us/products/virtual-machines/"
        }
    },

    // Database
    relationaldatabase: {
        desc: "Managed relational database engine (SQL).",
        howItWorks: "Provides a traditional SQL interface with automated backups, patching, and scaling.",
        pros: ["ACID compliance (Data integrity)", "Complex query support (Joins)", "Mature ecosystem"],
        cons: ["Vertical scaling limits", "Higher cost at scale", "Rigid schema"],
        bestFor: ["Financial systems", "E-commerce transactional data", "Structured data requiring integrity"],
        links: {
            aws: "https://aws.amazon.com/rds/",
            gcp: "https://cloud.google.com/sql",
            azure: "https://azure.microsoft.com/en-us/products/azure-sql/database/"
        }
    },
    nosqldatabase: {
        desc: "High-performance non-relational database.",
        howItWorks: "Stores data in documents or key-value pairs for flexible schemas and high speed.",
        pros: ["Horizontal scalability", "Flexible schema", "High performance for simple queries"],
        cons: ["Eventual consistency (usually)", "Limited query capabilities (User app side joins)", "Data duplication"],
        bestFor: ["Real-time big data", "Content management", "Gaming leaderboards"],
        links: {
            aws: "https://aws.amazon.com/dynamodb/",
            gcp: "https://cloud.google.com/firestore",
            azure: "https://azure.microsoft.com/en-us/products/cosmos-db/"
        }
    },
    cache: {
        desc: "In-memory data store for sub-millisecond latency.",
        howItWorks: "Caches frequently accessed data in RAM to reduce database load.",
        pros: ["Extremely fast read/write", "Reduces database load", "Simple key-value structure"],
        cons: ["Volatile data (loss on restart without persistence)", "More expensive per GB than disk", "Limited query capabilities"],
        bestFor: ["Session management", "Leaderboards", "Caching API responses"],
        links: {
            aws: "https://aws.amazon.com/elasticache/",
            gcp: "https://cloud.google.com/memorystore",
            azure: "https://azure.microsoft.com/en-us/products/cache/"
        }
    },

    // Storage
    objectstorage: {
        desc: "Scalable storage for files and blobs.",
        howItWorks: "Stores unstructured data like images and videos in buckets with high durability.",
        pros: ["Infinite scalability", "High durability (99.999999999%)", "Low cost for static assets"],
        cons: ["Not suitable for databases", "Latency higher than block storage", "Eventual consistency models"],
        bestFor: ["Media storage", "Backups and archives", "Static website hosting"],
        links: {
            aws: "https://aws.amazon.com/s3/",
            gcp: "https://cloud.google.com/storage",
            azure: "https://azure.microsoft.com/en-us/products/storage/blobs/"
        }
    },
    blockstorage: {
        desc: "High-performance storage volumes for VMs/Containers.",
        howItWorks: "Attaches to instances like a hard drive for persistent data storage.",
        pros: ["Low latency", "Consistent performance", "Bootable volumes"],
        cons: ["Attached to single instance (usually)", "More expensive than object storage", "Manual sizing required"],
        bestFor: ["Database storage", "OS boot drives", "High-performance file systems"],
        links: {
            aws: "https://aws.amazon.com/ebs/",
            gcp: "https://cloud.google.com/persistent-disk",
            azure: "https://azure.microsoft.com/en-us/products/storage/disk/"
        }
    },

    // Networking
    loadbalancer: {
        desc: "Distributes network traffic across multiple servers.",
        howItWorks: "Routes incoming requests to healthy instances to ensure availability and performance.",
        pros: ["High availability", "Health checking", "SSL termination"],
        cons: ["Additional cost", "Potential single point of failure (if misconfigured)", "Complexity"],
        bestFor: ["Distributing web traffic", "High availability apps", "Microservices communication"],
        links: {
            aws: "https://aws.amazon.com/elasticloadbalancing/",
            gcp: "https://cloud.google.com/load-balancing",
            azure: "https://azure.microsoft.com/en-us/products/load-balancer/"
        }
    },
    cdn: {
        desc: "Content Delivery Network for fast global access.",
        howItWorks: "Caches content at edge locations close to users to reduce latency.",
        pros: ["Reduced latency for global users", "Reduced origin server load", "DDoS protection"],
        cons: ["Cache invalidation complexity", "Cost for high bandwidth", "Stale content potential"],
        bestFor: ["Serving static assets (images, CSS, JS)", "Video streaming", "Global websites"],
        links: {
            aws: "https://aws.amazon.com/cloudfront/",
            gcp: "https://cloud.google.com/cdn",
            azure: "https://azure.microsoft.com/en-us/products/cdn/"
        }
    },
    apigateway: {
        desc: "Manage and secure API endpoints.",
        howItWorks: "Acts as a front door for applications to access data, business logic, or functionality.",
        pros: ["Centralized authentication", "Rate limiting and throttling", "API versioning"],
        cons: ["Added latency", "Vendor lock-in", "Cost at high scale"],
        bestFor: ["Microservices entry point", "Public API exposure", "Backend for Frontend"],
        links: {
            aws: "https://aws.amazon.com/api-gateway/",
            gcp: "https://cloud.google.com/api-gateway",
            azure: "https://azure.microsoft.com/en-us/products/api-management/"
        }
    },
    networking: {
        desc: "Virtual Network infrastructure.",
        howItWorks: "Logically isolated section of the cloud where you can launch resources in a virtual network.",
        pros: ["Network isolation", "Security control", "Custom topology"],
        cons: ["Complexity to manage", "CIDR block planning", "Connectivity costs"],
        bestFor: ["Isolating resources", "Hybrid cloud connectivity", "Secure internal communication"],
        links: {
            aws: "https://aws.amazon.com/vpc/",
            gcp: "https://cloud.google.com/vpc",
            azure: "https://azure.microsoft.com/en-us/products/virtual-network/"
        }
    },

    // Auth
    auth: {
        desc: "User sign-up, sign-in, and access control.",
        howItWorks: "Manages user identities and federated login flows securely.",
        pros: ["Offloads security maintenance", "Social login integration", "MFA support"],
        cons: ["Limited UI customization", "Vendor lock-in", "Per-user pricing"],
        bestFor: ["User authentication", "B2C applications", "Single Sign-On (SSO)"],
        links: {
            aws: "https://aws.amazon.com/cognito/",
            gcp: "https://firebase.google.com/docs/auth",
            azure: "https://azure.microsoft.com/en-us/products/active-directory-b2c/"
        }
    },
    identityauth: {
        desc: "User sign-up, sign-in, and access control.",
        howItWorks: "Manages user identities and federated login flows securely.",
        pros: ["Offloads security maintenance", "Social login integration", "MFA support"],
        cons: ["Limited UI customization", "Vendor lock-in", "Per-user pricing"],
        bestFor: ["User authentication", "B2C applications", "Single Sign-On (SSO)"],
        links: {
            aws: "https://aws.amazon.com/cognito/",
            gcp: "https://firebase.google.com/docs/auth",
            azure: "https://azure.microsoft.com/en-us/products/active-directory-b2c/"
        }
    },

    // Messaging
    messagequeue: {
        desc: "Decouple microservices and distributed systems.",
        howItWorks: "Stores messages until the consuming application can process them.",
        pros: ["Decouples components", "Buffering/Load leveling", "Reliable delivery"],
        cons: ["Eventual consistency", "Complexity in message ordering", "Operational overhead"],
        bestFor: ["Asynchronous processing", "Task queues", "Microservices communication"],
        links: {
            aws: "https://aws.amazon.com/sqs/",
            gcp: "https://cloud.google.com/pubsub",
            azure: "https://azure.microsoft.com/en-us/products/service-bus/"
        }
    },
    eventstreaming: {
        desc: "Real-time data streaming and processing.",
        howItWorks: "Ingests and processes large streams of data records in real-time.",
        pros: ["Real-time analytics", "High throughput", "Replayability"],
        cons: ["High complexity", "Costly at scale", "Retention limits"],
        bestFor: ["Log aggregation", "Real-time analytics", "Event sourcing"],
        links: {
            aws: "https://aws.amazon.com/kinesis/",
            gcp: "https://cloud.google.com/pubsub",
            azure: "https://azure.microsoft.com/en-us/products/event-hubs/"
        }
    },

    // Observability
    monitoring: {
        desc: "Collect and visualize metrics and logs.",
        howItWorks: "Aggregates data from your applications and infrastructure to provide insights.",
        pros: ["Visibility into health", "Automated alerting", "Performance tuning"],
        cons: ["Data ingestion costs", "Configuration complexity", "Noise/False alarms"],
        bestFor: ["Application health tracking", "Infrastructure monitoring", "Debugging"],
        links: {
            aws: "https://aws.amazon.com/cloudwatch/",
            gcp: "https://cloud.google.com/monitoring",
            azure: "https://azure.microsoft.com/en-us/products/monitor/"
        }
    },
    // Specific Service Mappings (AWS)
    "aws lambda": { ref: "computeserverless" },
    "lambda": { ref: "computeserverless" },
    "aws fargate": { ref: "computecontainer" },
    "fargate": { ref: "computecontainer" },
    "amazon ec2": { ref: "computevm" },
    "ec2": { ref: "computevm" },
    "amazon rds": { ref: "relationaldatabase" },
    "rds": { ref: "relationaldatabase" },
    "amazon dynamodb": { ref: "nosqldatabase" },
    "dynamodb": { ref: "nosqldatabase" },
    "amazon s3": { ref: "objectstorage" },
    "s3": { ref: "objectstorage" },
    "amazon ebs": { ref: "blockstorage" },
    "ebs": { ref: "blockstorage" },
    "elastic load balancing": { ref: "loadbalancer" },
    "elb": { ref: "loadbalancer" },
    "amazon cloudfront": { ref: "cdn" },
    "cloudfront": { ref: "cdn" },
    "amazon api gateway": { ref: "apigateway" },
    "api gateway": { ref: "apigateway" },
    "amazon vpc": { ref: "networking" },
    "vpc": { ref: "networking" },
    "amazon cognito": { ref: "auth" },
    "cognito": { ref: "auth" },
    "amazon sqs": { ref: "messagequeue" },
    "sqs": { ref: "messagequeue" },
    "amazon kinesis": { ref: "eventstreaming" },
    "kinesis": { ref: "eventstreaming" },
    "amazon cloudwatch": { ref: "monitoring" },
    "cloudwatch": { ref: "monitoring" },

    // Specific Service Mappings (GCP)
    "google cloud functions": { ref: "computeserverless" },
    "cloud functions": { ref: "computeserverless" },
    "cloud run": { ref: "computecontainer" },
    "compute engine": { ref: "computevm" },
    "cloud sql": { ref: "relationaldatabase" },
    "firestore": { ref: "nosqldatabase" },
    "cloud storage": { ref: "objectstorage" },
    "persistent disk": { ref: "blockstorage" },
    "cloud load balancing": { ref: "loadbalancer" },
    "cloud cdn": { ref: "cdn" },
    "api gateway": { ref: "apigateway" },
    "vpc network": { ref: "networking" },
    "firebase auth": { ref: "auth" },
    "cloud pub/sub": { ref: "messagequeue" },
    "pub/sub": { ref: "messagequeue" },
    "cloud monitoring": { ref: "monitoring" },
    "stackdriver": { ref: "monitoring" },

    // Specific Service Mappings (Azure)
    "azure functions": { ref: "computeserverless" },
    "azure container apps": { ref: "computecontainer" },
    "virtual machines": { ref: "computevm" },
    "azure sql database": { ref: "relationaldatabase" },
    "cosmos db": { ref: "nosqldatabase" },
    "blob storage": { ref: "objectstorage" },
    "disk storage": { ref: "blockstorage" },
    "load balancer": { ref: "loadbalancer" },
    "azure cdn": { ref: "cdn" },
    "api management": { ref: "apigateway" },
    "virtual network": { ref: "networking" },
    "azure ad b2c": { ref: "auth" },
    "service bus": { ref: "messagequeue" },
    "event hubs": { ref: "eventstreaming" },
    "azure monitor": { ref: "monitoring" },

    // DevOps & CI/CD
    cicd: {
        desc: "SaaS for building, testing, and deploying code.",
        howItWorks: "Pipelines that automatically build, test, and deploy your application on commit.",
        pros: ["Automated workflows", "Faster feedback loops", "Consistent deployments"],
        cons: ["Complex configuration", "Build minute costs", "Security management of secrets"],
        bestFor: ["Automating deployments", "Running unit/integration tests", "Software delivery"],
        links: {
            aws: "https://aws.amazon.com/codebuild/",
            gcp: "https://cloud.google.com/build",
            azure: "https://azure.microsoft.com/en-us/products/devops/pipelines/"
        }
    },
    sourcecontrol: { ref: "cicd" },
    buildservice: { ref: "cicd" },

    // Infrastructure as Code (IaC)
    iac: {
        desc: "Manage infrastructure using configuration files.",
        howItWorks: "Stores the state of your infrastructure to track availability and prevent drift.",
        pros: ["Version controlled infrastructure", "Reproducible environments", "Drift detection"],
        cons: ["State locking complexity", "Secret management", "Learning curve"],
        bestFor: ["Managing cloud resources", "Team collaboration", "Auditing changes"],
        links: {
            aws: "https://aws.amazon.com/s3/",
            gcp: "https://cloud.google.com/storage",
            azure: "https://azure.microsoft.com/en-us/products/storage/blobs/"
        }
    },
    iacstate: { ref: "iac" },
    statelocking: { ref: "iac" },

    // Configuration & Secrets
    configuration: {
        desc: "Centralized configuration and secret management.",
        howItWorks: "Stores application config and secrets securely, decoupling them from code.",
        pros: ["Centralized management", "Dynamic updates without redeploy", "Secure secret storage"],
        cons: ["Single point of failure", "Latency for retrieval", "Caching complexity"],
        bestFor: ["Feature flags", "Database credentials", "Environment variables"],
        links: {
            aws: "https://aws.amazon.com/systems-manager/parameters/",
            gcp: "https://cloud.google.com/secret-manager",
            azure: "https://azure.microsoft.com/en-us/products/app-configuration/"
        }
    },
    configmanagement: { ref: "configuration" },
    parameterstore: { ref: "configuration" },

    // Security & Networking Advanced
    firewall: {
        desc: "Network security/firewall service.",
        howItWorks: "Filters tracking based on IP, port, and protocol rules to secure resources.",
        pros: ["Granular traffic control", "Defense in depth", "Compliance support"],
        cons: ["Complexity to manage rules", "Potential connectivity blocks", "Cost for advanced features"],
        bestFor: ["Protecting VPCs", "Filtering malicious traffic", "Compliance boundaries"],
        links: {
            aws: "https://aws.amazon.com/network-firewall/",
            gcp: "https://cloud.google.com/firewall",
            azure: "https://azure.microsoft.com/en-us/products/firewall/"
        }
    },
    networkfirewall: { ref: "firewall" },
    securitygroup: { ref: "firewall" },
    egressproxy: { ref: "firewall" },
    vpngateway: { ref: "networking" },
    internetgateway: { ref: "networking" },
    transitgateway: { ref: "networking" },
    subnet: { ref: "networking" },

    // Observability Extensions
    apm: { ref: "monitoring" },
    metrics: { ref: "monitoring" },
    alerting: { ref: "monitoring" },
    incidentmanagement: { ref: "monitoring" },
    auditlogging: { ref: "monitoring" },
    logaggregation: { ref: "monitoring" },
    dashboard: { ref: "monitoring" },

    // Integration Extensions
    deadletterqueue: { ref: "messagequeue" },
    pubsub: { ref: "messagequeue" },
    kinesisstream: { ref: "eventstreaming" },
    smsnotification: { ref: "notification" },
    webhookintegration: { ref: "notification" },
    batchjob: { ref: "computebatch" }
};

export const getServiceMetadata = (serviceId, provider) => {
    if (!serviceId) return { desc: "Unknown Service", howItWorks: "No description available.", links: {} };

    const normalizedId = serviceId.toLowerCase().trim();

    // Check direct match
    let meta = SERVICE_METADATA[normalizedId];

    // Check generic category match (e.g. if serviceId is "compute_serverless")
    if (!meta) {
        const cleanId = normalizedId.replace(/[^a-z0-9]/g, ''); // compute_serverless -> computeserverless
        meta = SERVICE_METADATA[cleanId];
    }

    // Resolve reference if applicable
    if (meta && meta.ref) {
        meta = SERVICE_METADATA[meta.ref];
    }

    // Fallback logic
    if (!meta) {
        // partial match heuristics
        if (normalizedId.includes('function') || normalizedId.includes('lambda')) meta = SERVICE_METADATA['computeserverless'];
        else if (normalizedId.includes('container') || normalizedId.includes('fargate') || normalizedId.includes('kubernetes') || normalizedId.includes('eks') || normalizedId.includes('gke') || normalizedId.includes('aks')) meta = SERVICE_METADATA['computecontainer'];
        else if (normalizedId.includes('vm') || normalizedId.includes('ec2') || normalizedId.includes('compute engine')) meta = SERVICE_METADATA['computevm'];
        else if (normalizedId.includes('sql') || normalizedId.includes('rds')) meta = SERVICE_METADATA['relationaldatabase'];
        else if (normalizedId.includes('dynamo') || normalizedId.includes('cosmos') || normalizedId.includes('mongo') || normalizedId.includes('firestore')) meta = SERVICE_METADATA['nosqldatabase'];
        else if (normalizedId.includes('cache') || normalizedId.includes('redis')) meta = SERVICE_METADATA['cache'];
        else if (normalizedId.includes('bucket') || normalizedId.includes('s3') || normalizedId.includes('blob') || normalizedId.includes('storage')) meta = SERVICE_METADATA['objectstorage'];
        else if (normalizedId.includes('load balanc') || normalizedId.includes('elb')) meta = SERVICE_METADATA['loadbalancer'];
        else if (normalizedId.includes('cdn') || normalizedId.includes('cloudfront')) meta = SERVICE_METADATA['cdn'];
        else if (normalizedId.includes('api') || normalizedId.includes('gateway')) meta = SERVICE_METADATA['apigateway'];
        else if (normalizedId.includes('vpc') || normalizedId.includes('network') || normalizedId.includes('subnet')) meta = SERVICE_METADATA['networking'];
        else if (normalizedId.includes('auth') || normalizedId.includes('cognito') || normalizedId.includes('security')) meta = SERVICE_METADATA['auth'];
        else if (normalizedId.includes('queue') || normalizedId.includes('sqs') || normalizedId.includes('pub sub') || normalizedId.includes('message')) meta = SERVICE_METADATA['messagequeue'];
        else if (normalizedId.includes('monitor') || normalizedId.includes('watch') || normalizedId.includes('insight') || normalizedId.includes('observability')) meta = SERVICE_METADATA['monitoring'];
    }

    // Final Fallback
    const finalMeta = meta || {
        desc: `${serviceId} Service`,
        howItWorks: "Essential cloud infrastructure component.",
        links: {}
    };

    const link = finalMeta.links?.[provider?.toLowerCase()] || `https://www.google.com/search?q=${provider}+${serviceId}+documentation`;

    return { ...finalMeta, link, name: serviceId }; // Return original name if found
};
