import React, { useState, useEffect } from 'react';
import SecondaryBackground from '../components/SecondaryBackground';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Cloud, ArrowLeft, Book, Terminal, Server,
  ChevronRight, Copy, Check,
  Zap, Shield, DollarSign, FileCode, Workflow, Lock
} from 'lucide-react';
import { toast } from 'react-toastify';

const PROVIDERS = ['aws', 'gcp', 'azure'];

const SERVICES_DB = {
  "aws": [
    { "id": "computecontainer", "name": "AWS ECS Fargate", "icon": "📦", "description": "Managed service for running Docker containers." },
    { "id": "computeserverless", "name": "AWS Lambda", "icon": "⚡", "description": "Run code without thinking about servers or clusters. Pay only for the compute time you consume." },
    { "id": "computevm", "name": "AWS Instance", "icon": "🖥️", "description": "Secure and resizable compute capacity in the cloud." },
    { "id": "computebatch", "name": "AWS Batch", "icon": "📊", "description": "Managed computebatch service for AWS." },
    { "id": "computeedge", "name": "AWS Cloudfront Functions", "icon": "☁️", "description": "Managed computeedge service for AWS." },
    { "id": "relationaldatabase", "name": "AWS RDS Postgresql", "icon": "🗄️", "description": "Managed relational database service that provides you with six familiar database engines." },
    { "id": "nosqldatabase", "name": "AWS Dynamodb", "icon": "📉", "description": "Fast and flexible NoSQL database service for any scale." },
    { "id": "cache", "name": "AWS Elasticache Redis", "icon": "⚡", "description": "Fully managed in-memory caching service supporting flexible, real-time use cases." },
    { "id": "searchengine", "name": "AWS Opensearch", "icon": "☁️", "description": "Managed searchengine service for AWS." },
    { "id": "objectstorage", "name": "AWS S3", "icon": "📁", "description": "Object storage service that offers industry-leading scalability and performance." },
    { "id": "blockstorage", "name": "AWS Ebs", "icon": "💾", "description": "Managed blockstorage service for AWS." },
    { "id": "filestorage", "name": "AWS Efs", "icon": "📂", "description": "Managed filestorage service for AWS." },
    { "id": "backup", "name": "AWS Backup", "icon": "♻️", "description": "Managed backup service for AWS." },
    { "id": "loadbalancer", "name": "AWS Alb", "icon": "⚖️", "description": "Distributes incoming application traffic across multiple targets." },
    { "id": "apigateway", "name": "AWS APIgateway V2", "icon": "🚪", "description": "Fully managed service for creating and securing APIs." },
    { "id": "cdn", "name": "AWS Cloudfront", "icon": "🌐", "description": "Fast, highly secure content delivery network." },
    { "id": "dns", "name": "AWS Route53", "icon": "☁️", "description": "Managed dns service for AWS." },
    { "id": "vpcnetworking", "name": "AWS VPC", "icon": "🕸️", "description": "Global virtual network connecting your cloud resources." },
    { "id": "natgateway", "name": "AWS NAT Gateway", "icon": "🌐", "description": "Managed natgateway service for AWS." },
    { "id": "vpn", "name": "AWS VPN", "icon": "🔒", "description": "Managed vpn service for AWS." },
    { "id": "privatelink", "name": "AWS Privatelink", "icon": "🔗", "description": "Managed privatelink service for AWS." },
    { "id": "servicediscovery", "name": "AWS Cloud Map", "icon": "🔎", "description": "Managed servicediscovery service for AWS." },
    { "id": "servicemesh", "name": "AWS App Mesh", "icon": "🕸️", "description": "Managed servicemesh service for AWS." },
    { "id": "messagingqueue", "name": "AWS Sqs", "icon": "📬", "description": "Managed messagingqueue service for AWS." },
    { "id": "eventbus", "name": "AWS Eventbridge", "icon": "🚌", "description": "Serverless event bus for event-driven applications." },
    { "id": "workfloworchestration", "name": "AWS Step Functions", "icon": "🔄", "description": "Managed workfloworchestration service for AWS." },
    { "id": "notification", "name": "AWS Sns", "icon": "🔔", "description": "Managed notification service for AWS." },
    { "id": "identityauth", "name": "AWS Cognito", "icon": "🔐", "description": "Identity platform for web and mobile apps." },
    { "id": "secretsmanagement", "name": "AWS Secrets Manager", "icon": "🔑", "description": "Service to help you protect access to your applications." },
    { "id": "keymanagement", "name": "AWS KMS", "icon": "🔑", "description": "Managed keymanagement service for AWS." },
    { "id": "certificatemanagement", "name": "AWS Acm", "icon": "📜", "description": "Managed certificatemanagement service for AWS." },
    { "id": "waf", "name": "AWS WAF", "icon": "🛡️", "description": "Web Application Firewall against common web exploits." },
    { "id": "ddosprotection", "name": "AWS Shield", "icon": "🛡️", "description": "Managed ddosprotection service for AWS." },
    { "id": "policygovernance", "name": "AWS Organizations", "icon": "⚖️", "description": "Managed policygovernance service for AWS." },
    { "id": "monitoring", "name": "AWS Cloudwatch", "icon": "📊", "description": "Observability of your AWS resources and applications." },
    { "id": "logging", "name": "AWS Cloudwatch Logs", "icon": "📜", "description": "Monitor and store your log files from various sources." },
    { "id": "tracing", "name": "AWS Xray", "icon": "🔍", "description": "Managed tracing service for AWS." },
    { "id": "siem", "name": "AWS Security Hub", "icon": "🛡️", "description": "Managed siem service for AWS." },
    { "id": "containerregistry", "name": "AWS Ecr", "icon": "🐳", "description": "Managed containerregistry service for AWS." },
    { "id": "cicd", "name": "AWS Codepipeline", "icon": "🚀", "description": "Managed cicd service for AWS." },
    { "id": "artifactrepository", "name": "AWS Codeartifact", "icon": "📦", "description": "Managed artifactrepository service for AWS." },
    { "id": "iotcore", "name": "AWS IoT Core", "icon": "📱", "description": "Managed iotcore service for AWS." },
    { "id": "timeseriesdatabase", "name": "AWS Timestream", "icon": "⏱️", "description": "Managed timeseriesdatabase service for AWS." },
    { "id": "eventstream", "name": "AWS Kinesis Streams", "icon": "📡", "description": "Managed eventstream service for AWS." },
    { "id": "datawarehouse", "name": "AWS Redshift", "icon": "🏛️", "description": "Managed datawarehouse service for AWS." },
    { "id": "streamprocessor", "name": "AWS Kinesis Analytics", "icon": "🌊", "description": "Managed streamprocessor service for AWS." },
    { "id": "mltraining", "name": "AWS Sagemaker Training", "icon": "🧠", "description": "Managed mltraining service for AWS." },
    { "id": "mlinference", "name": "AWS Sagemaker Endpoint", "icon": "🤖", "description": "Managed mlinference service for AWS." },
    { "id": "featurestore", "name": "AWS Sagemaker Feature Store", "icon": "🗃️", "description": "Managed featurestore service for AWS." }
  ],
  "gcp": [
    { "id": "computecontainer", "name": "GCP Cloud Run", "icon": "📦", "description": "Managed service for running Docker containers." },
    { "id": "computeserverless", "name": "GCP Cloud Functions", "icon": "⚡", "description": "Run code without thinking about servers. Pay only for compute time." },
    { "id": "computevm", "name": "GCP Compute Engine", "icon": "🖥️", "description": "Secure and resizable compute capacity in the cloud." },
    { "id": "computebatch", "name": "GCP Batch", "icon": "📊", "description": "Managed computebatch service for GCP." },
    { "id": "computeedge", "name": "GCP Cloud CDN Edge", "icon": "☁️", "description": "Managed computeedge service for GCP." },
    { "id": "relationaldatabase", "name": "GCP Cloud SQL Postgres", "icon": "🗄️", "description": "Managed relational database service for PostgreSQL." },
    { "id": "nosqldatabase", "name": "GCP Firestore", "icon": "📉", "description": "Fast and flexible NoSQL database service." },
    { "id": "cache", "name": "GCP Memorystore Redis", "icon": "⚡", "description": "Fully managed in-memory caching service." },
    { "id": "searchengine", "name": "GCP Elastic Cloud", "icon": "☁️", "description": "Managed searchengine service for GCP." },
    { "id": "objectstorage", "name": "GCP Cloud Storage", "icon": "📁", "description": "Object storage service with industry-leading scalability." },
    { "id": "blockstorage", "name": "GCP Persistent Disk", "icon": "💾", "description": "Managed blockstorage service for GCP." },
    { "id": "filestorage", "name": "GCP Filestore", "icon": "📂", "description": "Managed filestorage service for GCP." },
    { "id": "backup", "name": "GCP Backup And Dr", "icon": "♻️", "description": "Managed backup service for GCP." },
    { "id": "loadbalancer", "name": "GCP Cloud Load Balancing", "icon": "⚖️", "description": "Distributes incoming traffic across multiple targets." },
    { "id": "apigateway", "name": "GCP API Gateway", "icon": "🚪", "description": "Fully managed service for creating and securing APIs." },
    { "id": "cdn", "name": "GCP Cloud CDN", "icon": "🌐", "description": "Fast, secure content delivery network." },
    { "id": "dns", "name": "GCP Cloud DNS", "icon": "☁️", "description": "Managed dns service for GCP." },
    { "id": "vpcnetworking", "name": "GCP VPC", "icon": "🕸️", "description": "Global virtual network connecting your cloud resources." },
    { "id": "natgateway", "name": "GCP Cloud NAT", "icon": "🌐", "description": "Managed natgateway service for GCP." },
    { "id": "vpn", "name": "GCP Cloud VPN", "icon": "🔒", "description": "Managed vpn service for GCP." },
    { "id": "privatelink", "name": "GCP Private Service Connect", "icon": "🔗", "description": "Managed privatelink service for GCP." },
    { "id": "servicediscovery", "name": "GCP Service Directory", "icon": "🔎", "description": "Managed servicediscovery service for GCP." },
    { "id": "servicemesh", "name": "GCP Anthos Service Mesh", "icon": "🕸️", "description": "Managed servicemesh service for GCP." },
    { "id": "messagingqueue", "name": "GCP Pubsub", "icon": "📬", "description": "Managed messagingqueue service for GCP." },
    { "id": "eventbus", "name": "GCP Eventarc", "icon": "🚌", "description": "Serverless event bus for event-driven applications." },
    { "id": "workfloworchestration", "name": "GCP Workflows", "icon": "🔄", "description": "Managed workfloworchestration service for GCP." },
    { "id": "notification", "name": "GCP Pubsub Notifications", "icon": "🔔", "description": "Managed notification service for GCP." },
    { "id": "identityauth", "name": "GCP Identity Platform", "icon": "🔐", "description": "Identity platform for web and mobile apps." },
    { "id": "secretsmanagement", "name": "GCP Secret Manager", "icon": "🔑", "description": "Service to help you protect access to your applications." },
    { "id": "keymanagement", "name": "GCP Cloud KMS", "icon": "🔑", "description": "Managed keymanagement service for GCP." },
    { "id": "certificatemanagement", "name": "GCP Certificate Manager", "icon": "📜", "description": "Managed certificatemanagement service for GCP." },
    { "id": "waf", "name": "GCP Cloud Armor", "icon": "🛡️", "description": "WAF against common web exploits and bots." },
    { "id": "ddosprotection", "name": "GCP Cloud Armor DDoS", "icon": "🛡️", "description": "Managed ddosprotection service for GCP." },
    { "id": "policygovernance", "name": "GCP Org Policy", "icon": "⚖️", "description": "Managed policygovernance service for GCP." },
    { "id": "monitoring", "name": "GCP Cloud Monitoring", "icon": "📊", "description": "Observability of your GCP resources and applications." },
    { "id": "logging", "name": "GCP Cloud Logging", "icon": "📜", "description": "Monitor and store your log files from various sources." },
    { "id": "tracing", "name": "GCP Cloud Trace", "icon": "🔍", "description": "Managed tracing service for GCP." },
    { "id": "siem", "name": "GCP Security Command Center", "icon": "🛡️", "description": "Managed siem service for GCP." },
    { "id": "containerregistry", "name": "GCP Artifact Registry", "icon": "🐳", "description": "Managed containerregistry service for GCP." },
    { "id": "cicd", "name": "GCP Cloud Build", "icon": "🚀", "description": "Managed cicd service for GCP." },
    { "id": "artifactrepository", "name": "GCP Artifact Registry", "icon": "📦", "description": "Managed artifactrepository service for GCP." },
    { "id": "iotcore", "name": "GCP IoT Registry Legacy", "icon": "📱", "description": "Managed iotcore service for GCP." },
    { "id": "timeseriesdatabase", "name": "GCP Bigquery Timeseries", "icon": "⏱️", "description": "Managed timeseriesdatabase service for GCP." },
    { "id": "eventstream", "name": "GCP Pubsub", "icon": "📡", "description": "Managed eventstream service for GCP." },
    { "id": "datawarehouse", "name": "GCP Bigquery", "icon": "🏛️", "description": "Managed datawarehouse service for GCP." },
    { "id": "streamprocessor", "name": "GCP Dataflow", "icon": "🌊", "description": "Managed streamprocessor service for GCP." },
    { "id": "mltraining", "name": "GCP Vertex Ai Training", "icon": "🧠", "description": "Managed mltraining service for GCP." },
    { "id": "mlinference", "name": "GCP Vertex Ai Endpoint", "icon": "🤖", "description": "Managed mlinference service for GCP." },
    { "id": "featurestore", "name": "GCP Vertex Feature Store", "icon": "🗃️", "description": "Managed featurestore service for GCP." }
  ],
  "azure": [
    { "id": "computecontainer", "name": "Azure Container Apps", "icon": "📦", "description": "Managed service for running Docker containers." },
    { "id": "computeserverless", "name": "Azure Functions", "icon": "⚡", "description": "Run code without thinking about servers. Pay only for compute time." },
    { "id": "computevm", "name": "Azure Virtual Machines", "icon": "🖥️", "description": "Secure and resizable compute capacity in the cloud." },
    { "id": "computebatch", "name": "Azure Batch", "icon": "📊", "description": "Managed computebatch service for AZURE." },
    { "id": "computeedge", "name": "Azure Front Door Edge", "icon": "☁️", "description": "Managed computeedge service for AZURE." },
    { "id": "relationaldatabase", "name": "Azure Postgresql Flexible", "icon": "🗄️", "description": "Managed relational database service for PostgreSQL." },
    { "id": "nosqldatabase", "name": "Azure Cosmosdb", "icon": "📉", "description": "Fast and flexible NoSQL database service." },
    { "id": "cache", "name": "Azure Redis", "icon": "⚡", "description": "Fully managed in-memory caching service." },
    { "id": "searchengine", "name": "Azure Ai Search", "icon": "☁️", "description": "Managed searchengine service for AZURE." },
    { "id": "objectstorage", "name": "Azure Blob Storage", "icon": "📁", "description": "Object storage service with industry-leading scalability." },
    { "id": "blockstorage", "name": "Azure Managed Disks", "icon": "💾", "description": "Managed blockstorage service for AZURE." },
    { "id": "filestorage", "name": "Azure Files", "icon": "📂", "description": "Managed filestorage service for AZURE." },
    { "id": "backup", "name": "Azure Recovery Services", "icon": "♻️", "description": "Managed backup service for AZURE." },
    { "id": "loadbalancer", "name": "Azure Application Gateway", "icon": "⚖️", "description": "Distributes incoming traffic across multiple targets." },
    { "id": "apigateway", "name": "Azure API Management", "icon": "🚪", "description": "Fully managed service for creating and securing APIs." },
    { "id": "cdn", "name": "Azure CDN", "icon": "🌐", "description": "Fast, secure content delivery network." },
    { "id": "dns", "name": "Azure DNS", "icon": "☁️", "description": "Managed dns service for AZURE." },
    { "id": "vpcnetworking", "name": "Azure Virtual Network", "icon": "🕸️", "description": "Global virtual network connecting your cloud resources." },
    { "id": "natgateway", "name": "Azure NAT Gateway", "icon": "🌐", "description": "Managed natgateway service for AZURE." },
    { "id": "vpn", "name": "Azure VPN Gateway", "icon": "🔒", "description": "Managed vpn service for AZURE." },
    { "id": "privatelink", "name": "Azure Private Endpoint", "icon": "🔗", "description": "Managed privatelink service for AZURE." },
    { "id": "servicediscovery", "name": "Azure Private DNS", "icon": "🔎", "description": "Managed servicediscovery service for AZURE." },
    { "id": "servicemesh", "name": "Azure Service Mesh Aks", "icon": "🕸️", "description": "Managed servicemesh service for AZURE." },
    { "id": "messagingqueue", "name": "Azure Service Bus", "icon": "📬", "description": "Managed messagingqueue service for AZURE." },
    { "id": "eventbus", "name": "Azure Event Grid", "icon": "🚌", "description": "Serverless event bus for event-driven applications." },
    { "id": "workfloworchestration", "name": "Azure Logic Apps", "icon": "🔄", "description": "Managed workfloworchestration service for AZURE." },
    { "id": "notification", "name": "Azure Notification Hubs", "icon": "🔔", "description": "Managed notification service for AZURE." },
    { "id": "identityauth", "name": "Azure Ad B2c", "icon": "🔐", "description": "Identity platform for web and mobile apps." },
    { "id": "secretsmanagement", "name": "Azure Key Vault Secrets", "icon": "🔑", "description": "Service to help you protect access to your applications." },
    { "id": "keymanagement", "name": "Azure Key Vault Keys", "icon": "🔑", "description": "Managed keymanagement service for AZURE." },
    { "id": "certificatemanagement", "name": "Azure Key Vault Certs", "icon": "📜", "description": "Managed certificatemanagement service for AZURE." },
    { "id": "waf", "name": "Azure WAF", "icon": "🛡️", "description": "WAF against common web exploits and bots." },
    { "id": "ddosprotection", "name": "Azure DDoS Protection", "icon": "🛡️", "description": "Managed ddosprotection service for AZURE." },
    { "id": "policygovernance", "name": "Azure Azure Policy", "icon": "⚖️", "description": "Managed policygovernance service for AZURE." },
    { "id": "monitoring", "name": "Azure Monitor", "icon": "📊", "description": "Observability of your Azure resources and applications." },
    { "id": "logging", "name": "Azure Log Analytics", "icon": "📜", "description": "Monitor and store your log files from various sources." },
    { "id": "tracing", "name": "Azure App Insights", "icon": "🔍", "description": "Managed tracing service for AZURE." },
    { "id": "siem", "name": "Azure Sentinel", "icon": "🛡️", "description": "Managed siem service for AZURE." },
    { "id": "containerregistry", "name": "Azure Acr", "icon": "🐳", "description": "Managed containerregistry service for AZURE." },
    { "id": "cicd", "name": "Azure Devops", "icon": "🚀", "description": "Managed cicd service for AZURE." },
    { "id": "artifactrepository", "name": "Azure Artifacts", "icon": "📦", "description": "Managed artifactrepository service for AZURE." },
    { "id": "iotcore", "name": "Azure IoT Hub", "icon": "📱", "description": "Managed iotcore service for AZURE." },
    { "id": "timeseriesdatabase", "name": "Azure Data Explorer", "icon": "⏱️", "description": "Managed timeseriesdatabase service for AZURE." },
    { "id": "eventstream", "name": "Azure Event Hubs", "icon": "📡", "description": "Managed eventstream service for AZURE." },
    { "id": "datawarehouse", "name": "Azure Synapse", "icon": "🏛️", "description": "Managed datawarehouse service for AZURE." },
    { "id": "streamprocessor", "name": "Azure Stream Analytics", "icon": "🌊", "description": "Managed streamprocessor service for AZURE." },
    { "id": "mltraining", "name": "Azure ML Training", "icon": "🧠", "description": "Managed mltraining service for AZURE." },
    { "id": "mlinference", "name": "Azure ML Endpoint", "icon": "🤖", "description": "Managed mlinference service for AZURE." },
    { "id": "featurestore", "name": "Azure ML Feature Store", "icon": "🗃️", "description": "Managed featurestore service for AZURE." }
  ]
};

const Docs = () => {
  const navigate = useNavigate();
  const { section: paramSection } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Default to getting-started if no section param
  const activeSection = paramSection || searchParams.get('section') || 'getting-started';

  const [copiedCode, setCopiedCode] = useState(null);

  // For Cloud Services Tabs
  const initialProvider = searchParams.get('provider') || 'aws';
  const initialService = searchParams.get('service');
  const [activeProvider, setActiveProvider] = useState(initialProvider);
  const [highlightedService, setHighlightedService] = useState(initialService);

  // Sync state with URL params when they change
  useEffect(() => {
    if (searchParams.get('provider')) {
      setActiveProvider(searchParams.get('provider'));
    }
    if (searchParams.get('service')) {
      setHighlightedService(searchParams.get('service'));
    }
  }, [searchParams]);

  const updateProvider = (provider) => {
    setActiveProvider(provider);
    setSearchParams({ provider, ...(highlightedService ? { service: highlightedService } : {}) });
  };

  useEffect(() => {
    // Scroll to highlighted service if present (only when on cloud-services section)
    if (activeSection === 'cloud-services' && highlightedService) {
      // Small delay to ensure render
      setTimeout(() => {
        const el = document.getElementById(highlightedService);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-brand-500', 'bg-white/10');
          setTimeout(() => el.classList.remove('ring-2', 'ring-brand-500', 'bg-white/10'), 2000);
        }
      }, 100);
    }
  }, [highlightedService, activeProvider, activeSection]);

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const navigateToSection = (sectionId) => {
    navigate(`/docs/${sectionId}`);
  };

  const CodeBlock = ({ code, language = 'bash', id }) => (
    <div className="relative glass-card rounded-xl border border-white/5 overflow-hidden my-6">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{language}</span>
        <button
          onClick={() => copyToClipboard(code, id)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          {copiedCode === id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed">
        <code className="text-slate-300">{code}</code>
      </pre>
    </div>
  );

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: <Zap size={16} /> },
    { id: 'terraform-basics', title: 'Terraform Basics', icon: <FileCode size={16} /> },
    { id: 'architecture-diagrams', title: 'Architecture Diagrams', icon: <Workflow size={16} /> },
    { id: 'cloud-services', title: 'Cloud Services', icon: <Cloud size={16} /> },
    { id: 'cost-estimation', title: 'Cost Estimation', icon: <DollarSign size={16} /> },
    { id: 'security', title: 'Security', icon: <Shield size={16} /> },
    { id: 'deployment', title: 'Deployment Guides', icon: <Server size={16} /> }
  ];

  return (
    <div className="relative min-h-screen text-slate-200 selection:bg-brand-500/30 selection:text-white bg-slate-950 font-sans flex flex-col">
      <SecondaryBackground />

      {/* Global Header */}
      <header className="sticky top-0 z-50 bg-slate-950/50 backdrop-blur-xl border-b border-white/5 h-16 shrink-0">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <img src="/cloudiverse.png" alt="Cloudiverse" className="h-8 w-auto mr-2" />
            </div>
            <div className="hidden md:flex h-6 w-px bg-white/10 mx-2" />
          </div>

          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 h-[calc(100vh-4rem)] border-r border-white/5 bg-slate-950/20 backdrop-blur-sm overflow-y-auto shrink-0 p-6">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => navigateToSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === section.id
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
              >
                {section.icon}
                {section.title}
              </button>
            ))}
          </nav>

          <div className="mt-12 p-6 rounded-2xl glass-premium border border-white/5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-400 mb-2">Need Help?</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">Our engineering team is ready to assist with enterprise setups.</p>
            <a href="/contact" className="text-xs font-bold text-white hover:text-brand-400 transition-colors flex items-center gap-2">
              Contact Support <ChevronRight size={12} />
            </a>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-12 lg:px-16">

            {/* Getting Started Section */}
            {activeSection === 'getting-started' && (
              <div className="space-y-12 animate-blur-reveal">
                <header>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-widest mb-6">
                    <Zap size={12} />
                    <span>Quick Start Guide</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">Getting Started with <span className="text-brand-400">Cloudiverse</span></h1>
                  <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">
                    Experience the fastest way to design and deploy enterprise-grade cloud architectures using AI and Infrastructure as Code.
                  </p>
                </header>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass-premium p-8 rounded-[2rem] border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 mb-6 font-black">1</div>
                    <h3 className="text-lg font-bold text-white mb-2">Describe Your Vision</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">Enter your requirements in natural language. Our AI understands complex network topologies and security needs.</p>
                  </div>
                  <div className="glass-premium p-8 rounded-[2rem] border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 font-black">2</div>
                    <h3 className="text-lg font-bold text-white mb-2">Visualize & Refine</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">Review the generated high-fidelity diagram. Add, remove, or modify services with a single click.</p>
                  </div>
                </div>

                <section className="space-y-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Terminal size={24} className="text-brand-400" />
                    Technical Prerequisites
                  </h2>
                  <p className="text-slate-400">To deploy the generated architectures, ensure you have the following installed on your machine:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: "Terraform", version: ">= 1.5.0", color: "text-purple-400" },
                      { title: "Node.js", version: ">= 18.x", color: "text-emerald-400" },
                      { title: "Cloud CLI", version: "AWS/GCP/Azure", color: "text-blue-400" }
                    ].map((item, i) => (
                      <div key={i} className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{item.title}</h4>
                        <p className={`text-sm font-bold ${item.color}`}>{item.version}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Architecture Diagrams */}
            {activeSection === 'architecture-diagrams' && (
              <div className="space-y-12 animate-blur-reveal">
                <header>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-widest mb-6">
                    <Workflow size={12} />
                    <span>Visual Intelligence</span>
                  </div>
                  <h1 className="text-4xl font-black text-white tracking-tight mb-6">Architecture Visualization</h1>
                  <p className="text-xl text-slate-400 leading-relaxed">
                    Our visualization engine turns abstract configurations into clear, interactive diagrams that serve as your source of truth.
                  </p>
                </header>

                <div className="glass-premium p-8 rounded-[2rem] border border-white/5 space-y-6">
                  <h3 className="text-xl font-bold text-white">How it works</h3>
                  <div className="space-y-4">
                    {[
                      { title: "AI Generation", desc: "Our engine maps your requirements to canonical cloud patterns." },
                      { title: "Service Grouping", desc: "Resources are automatically grouped by subnet, VPC, or logical tier." },
                      { title: "Relationship Mapping", desc: "Internal flows (HTTP, Database, Messaging) are visualized with directional paths." }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0" />
                        <div>
                          <h4 className="text-white font-bold text-sm mb-1">{item.title}</h4>
                          <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Terraform Basics Section */}
            {activeSection === 'terraform-basics' && (
              <div className="space-y-8 animate-blur-reveal">
                <div>
                  <h1 className="text-4xl font-black text-white tracking-tight mb-4">Terraform Basics</h1>
                  <p className="text-xl text-slate-400">
                    Learn the fundamental commands needed to manage your infrastructure as code.
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="glass-premium p-8 rounded-[2rem] border border-white/5">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-brand-500 rounded-full" />
                      Common Commands
                    </h2>
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-white font-bold mb-2">1. Initialization</h3>
                        <p className="text-sm text-slate-400 mb-4">Downloads the required cloud provider plugins.</p>
                        <CodeBlock id="tf-init" code="terraform init" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold mb-2">2. Execution Plan</h3>
                        <p className="text-sm text-slate-400 mb-4">Shows what actions Terraform will take to reach your desired state.</p>
                        <CodeBlock id="tf-plan" code="terraform plan" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold mb-2">3. Apply Changes</h3>
                        <p className="text-sm text-slate-400 mb-4">Deploys the infrastructure to your cloud provider.</p>
                        <CodeBlock id="tf-apply" code="terraform apply" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cloud Services Section */}
            {activeSection === 'cloud-services' && (
              <div className="space-y-8 animate-blur-reveal">
                <div>
                  <h1 className="text-4xl font-black text-white tracking-tight mb-4">Supported Cloud Services</h1>
                  <p className="text-xl text-slate-400">
                    A comprehensive list of services Cloudiverse can currently architect and deploy.
                  </p>
                </div>

                {/* Provider Selector Tabs */}
                <div className="flex p-1.5 rounded-2xl bg-white/5 border border-white/5 max-w-sm">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p}
                      onClick={() => updateProvider(p)}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeProvider === p
                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                        : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SERVICES_DB[activeProvider].map((service) => (
                    <div
                      key={service.id}
                      id={service.id}
                      className="glass-card p-6 rounded-2xl border border-white/5 group hover:border-brand-500/30 transition-all duration-500"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                          {service.icon}
                        </div>
                        <div>
                          <h3 className="text-white font-bold mb-1">{service.name}</h3>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{service.id}</div>
                          <p className="text-xs text-slate-400 leading-relaxed">{service.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost Estimation */}
            {activeSection === 'cost-estimation' && (
              <div className="space-y-12 animate-blur-reveal">
                <header>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-6">
                    <DollarSign size={12} />
                    <span>Financial Transparency</span>
                  </div>
                  <h1 className="text-4xl font-black text-white tracking-tight mb-6">Cloud Cost Analysis</h1>
                  <p className="text-xl text-slate-400 leading-relaxed">
                    Understand the financial impact of your architecture before you deploy a single resource.
                  </p>
                </header>

                <div className="glass-premium p-8 rounded-[2rem] border border-white/5 space-y-8">
                  <div>
                    <h3 className="text-white font-bold mb-2">Precision of Estimates</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Estimates are calculated using the latest Pricing APIs from AWS, GCP, and Azure. We factor in
                      regional variations and common baseline configurations.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                      <h4 className="text-white font-bold text-sm mb-2">What is included?</h4>
                      <ul className="text-xs text-slate-400 space-y-2">
                        <li>• Baseline instance / compute costs</li>
                        <li>• Managed database licensing</li>
                        <li>• Fixed networking fees</li>
                        <li>• Storage provisioning costs</li>
                      </ul>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                      <h4 className="text-white font-bold text-sm mb-2">What is excluded?</h4>
                      <ul className="text-xs text-slate-400 space-y-2">
                        <li>• Dynamic data transfer (egress)</li>
                        <li>• Variable I/O operations</li>
                        <li>• Spot instance fluctuations</li>
                        <li>• Tax and local surcharges</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="space-y-12 animate-blur-reveal">
                <header>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">
                    <Shield size={12} />
                    <span>Enterprise Guardrails</span>
                  </div>
                  <h1 className="text-4xl font-black text-white tracking-tight mb-6">Security Standards</h1>
                  <p className="text-xl text-slate-400 leading-relaxed">
                    Cloudiverse generates configurations based on the Principle of Least Privilege and industry best practices.
                  </p>
                </header>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass-premium p-8 rounded-[2rem] border border-white/5">
                    <h3 className="font-bold text-lg mb-4 flex items-center text-blue-400"><Lock size={20} className="mr-3" /> Data Security</h3>
                    <ul className="space-y-4 text-sm text-slate-400">
                      <li className="flex items-start gap-3">
                        <Check size={16} className="text-emerald-400 mt-1 shrink-0" />
                        <span><strong>Encryption:</strong> Data at rest is encrypted using provider-managed keys (KMS) for all storage and databases.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check size={16} className="text-emerald-400 mt-1 shrink-0" />
                        <span><strong>TLS/SSL:</strong> Load balancers are configured to redirect HTTP to HTTPS by default.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="glass-premium p-8 rounded-[2rem] border border-white/5">
                    <h3 className="font-bold text-lg mb-4 flex items-center text-brand-400"><Zap size={20} className="mr-3" /> Secrets Management</h3>
                    <ul className="space-y-4 text-sm text-slate-400">
                      <li className="flex items-start gap-3">
                        <Check size={16} className="text-emerald-400 mt-1 shrink-0" />
                        <span><strong>Zero Exposure:</strong> Sensitive values like DB passwords are injected via Secrets Manager placeholders.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check size={16} className="text-emerald-400 mt-1 shrink-0" />
                        <span><strong>IAM Roles:</strong> Compute resources are assigned fine-grained IAM roles rather than long-lived keys.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Deployment Guides */}
            {activeSection === 'deployment' && (
              <div className="space-y-12 animate-blur-reveal">
                <header>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-widest mb-6">
                    <Server size={12} />
                    <span>Ship to Production</span>
                  </div>
                  <h1 className="text-4xl font-black text-white tracking-tight mb-6">Deployment Guides</h1>
                  <p className="text-xl text-slate-400 leading-relaxed">
                    Follow these step-by-step instructions to deploy your generated stack to the cloud.
                  </p>
                </header>

                <div className="space-y-12">
                  {/* AWS */}
                  <div className="glass-premium rounded-[2.5rem] border border-white/5 overflow-hidden">
                    <div className="px-10 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                      <h2 className="text-xl font-bold flex items-center text-white">
                        <span className="mr-3 text-2xl">☁️</span> Deploy to AWS
                      </h2>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Requires AWS CLI</span>
                    </div>
                    <div className="px-10 py-10 space-y-6">
                      <p className="text-sm text-slate-400">Configure your credentials and run the following commands in the generated directory.</p>
                      <CodeBlock
                        id="aws-deploy"
                        language="bash"
                        code={`# 1. Configure Credentials
aws configure

# 2. Prepare Directory
terraform init

# 3. Review Plan
terraform plan -out=tfplan

# 4. Apply
terraform apply tfplan`}
                      />
                    </div>
                  </div>

                  {/* GCP */}
                  <div className="glass-premium rounded-[2.5rem] border border-white/5 overflow-hidden">
                    <div className="px-10 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                      <h2 className="text-xl font-bold flex items-center text-white">
                        <span className="mr-3 text-2xl">🔷</span> Deploy to GCP
                      </h2>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Requires GCloud SDK</span>
                    </div>
                    <div className="px-10 py-10 space-y-6">
                      <p className="text-sm text-slate-400">Enable required APIs and authenticate with your project ID.</p>
                      <CodeBlock
                        id="gcp-deploy"
                        language="bash"
                        code={`# 1. Login & Set Project
gcloud auth login
gcloud config set project [YOUR_PROJECT_ID]

# 2. Enable APIs
gcloud services enable compute.googleapis.com sqladmin.googleapis.com

# 3. Init & Apply
terraform init
terraform apply`}
                      />
                    </div>
                  </div>

                  {/* Azure */}
                  <div className="glass-premium rounded-[2.5rem] border border-white/5 overflow-hidden">
                    <div className="px-10 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                      <h2 className="text-xl font-bold flex items-center text-white">
                        <span className="mr-3 text-2xl">💠</span> Deploy to Azure
                      </h2>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Requires Azure CLI</span>
                    </div>
                    <div className="px-10 py-10 space-y-6">
                      <p className="text-sm text-slate-400">Login and register resource providers before running Terraform.</p>
                      <CodeBlock
                        id="azure-deploy"
                        language="bash"
                        code={`# 1. Login
az login

# 2. Register Resource Providers
az provider register --namespace Microsoft.Compute
az provider register --namespace Microsoft.Network

# 3. Init & Apply
terraform init
terraform apply`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default Docs;