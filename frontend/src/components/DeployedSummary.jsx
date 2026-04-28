import React from 'react';
import { 
    ExternalLink, Cloud, MapPin, Clock, Trash2, Server, Globe, Box, Info, 
    Database, Shield, Zap, Rocket, Activity 
} from 'lucide-react';

/**
 * DeployedSummary - Shows deployed project summary with live URL and delete option
 * Displayed when workspace.deployment_status === 'DEPLOYED'
 */
const DeployedSummary = ({
    workspace,
    infraOutputs,
    onDeleteClick
}) => {
    const deploymentTarget = infraOutputs?.deployment_target;
    const deploymentHistory = workspace?.deployment_history || [];

    const { costEstimation, infraSpec } = workspace?.state_json || {};
    const connection = workspace?.state_json?.connection || infraSpec?.connection || costEstimation?.connection || {};

    // Resolve live URL - PRIORITY: deployment history > deployment_target config
    const getLiveUrl = () => {
        // 1. First check deployment_history for actual live_url (set by backend after successful deploy)
        const lastDeploySuccess = deploymentHistory.filter(h => h.action === 'DEPLOY_SUCCESS').pop();
        if (lastDeploySuccess?.live_url) {
            return lastDeploySuccess.live_url;
        }

        // 2. Fallback to deployment_target configuration
        if (!deploymentTarget) return null;

        switch (deploymentTarget.type) {
            case 'STATIC_STORAGE':
                const cdnDomain = deploymentTarget.static?.cdn_domain;
                const bucketName = deploymentTarget.static?.bucket_name;
                return cdnDomain ? `https://${cdnDomain}` : (bucketName ? `http://${bucketName}.s3-website.${deploymentTarget.static?.bucket_region || 'us-east-1'}.amazonaws.com` : null);
            case 'CONTAINER_SERVICE':
                return deploymentTarget.container?.service_url || deploymentTarget.container?.load_balancer_url;
            case 'SERVERLESS_API':
                return deploymentTarget.api?.endpoint;
            default:
                return null;
        }
    };

    // ─── SERVICE MAPPING ──────────────────────────────────────────────────────────
    const SERVICE_ICONS = {
        'compute': <Server size={18} />,
        'storage': <Database size={18} />,
        'networking': <Globe size={18} />,
        'security': <Shield size={18} />,
        'cdn': <Zap size={18} />,
        'database': <Database size={18} />,
    };

    const liveUrl = getLiveUrl();
    const provider = (deploymentTarget?.provider || connection?.provider || costEstimation?.provider || 'AWS').toUpperCase();
    const region = deploymentTarget?.region || workspace?.state_json?.region || costEstimation?.region || 'us-east-1';

    // Determine deployment type friendly name
    const getDeploymentTypeLabel = () => {
        const method = workspace?.state_json?.deploymentMethod || 'self';
        const type = deploymentTarget?.type || workspace?.state_json?.architecture_pattern || 'Custom';
        
        let label = '';
        if (type === 'STATIC_STORAGE') label = 'Static Website';
        else if (type === 'CONTAINER_SERVICE') label = 'Container App';
        else if (type === 'SERVERLESS_API') label = 'Serverless API';
        else label = type.replace(/_/g, ' ');

        return `${label} (${method === 'oneclick' ? 'Automated' : 'Manual'})`;
    };

    const deploymentType = getDeploymentTypeLabel();

    // Get deployed timestamp
    const deployedAt = workspace?.deployed_at ? new Date(workspace.deployed_at) : (
        workspace.updated_at ? new Date(workspace.updated_at) : null
    );

    // Get deployed services list from infraSpec
    const modules = workspace?.state_json?.infraSpec?.modules || [];

    const deploymentMethod = workspace?.state_json?.deploymentMethod || 'self';
    const isLive = workspace?.state_json?.is_live || workspace?.step === 'deployed';

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header / Status Banner */}
            <div className={`glass-premium rounded-[2.5rem] p-10 border-white/5 relative overflow-hidden ${deploymentMethod === 'oneclick' ? 'border-brand-500/20' : 'border-blue-500/20'}`}>
                <div className={`absolute top-0 right-0 w-64 h-64 ${deploymentMethod === 'oneclick' ? 'bg-brand-500/10' : 'bg-blue-500/10'} rounded-full blur-[80px] -mr-32 -mt-32`} />
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className={`w-20 h-20 rounded-3xl ${deploymentMethod === 'oneclick' ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'} flex items-center justify-center shadow-2xl`}>
                            {deploymentMethod === 'oneclick' ? <Rocket size={40} /> : <Zap size={40} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-3xl font-display font-black text-white italic">
                                    Project <span className={deploymentMethod === 'oneclick' ? 'text-brand-400' : 'text-blue-400'}>{isLive ? 'Live' : 'Deployed'}</span>
                                </h2>
                                <div className={`px-3 py-1 rounded-full ${isLive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-white/5'} text-[10px] font-black uppercase tracking-widest border flex items-center gap-2`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} /> 
                                    {isLive ? 'Production Active' : 'Infrastructure Standby'}
                                </div>
                            </div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] leading-relaxed">
                                {deploymentMethod === 'oneclick' 
                                    ? 'Fully managed automated deployment pipeline powered by Cloudiverse AI.' 
                                    : 'Validated manual infrastructure provisioning. Local CLI deployment ownership active.'}
                            </p>
                        </div>
                    </div>

                    {liveUrl && (
                        <div className="flex flex-col items-end gap-3">
                            <a
                                href={liveUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={`px-10 h-16 rounded-2xl font-black text-lg flex items-center gap-4 transition-all shadow-2xl ${deploymentMethod === 'oneclick' ? 'bg-brand-500 text-white shadow-brand-500/20' : 'bg-white text-black hover:bg-blue-500 hover:text-white'}`}
                            >
                                <span>Launch App</span>
                                <ExternalLink size={22} />
                            </a>
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <Globe size={12} /> {liveUrl}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Technical Specs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Cloud Provider', value: provider, icon: Cloud, color: 'text-blue-400' },
                    { label: 'Target Region', value: region, icon: MapPin, color: 'text-accent-purple' },
                    { label: 'Deployment Strategy', value: deploymentType, icon: Zap, color: 'text-accent-cyan' },
                    { label: 'Uptime (Est)', value: '99.99%', icon: Activity, color: 'text-green-400' },
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-6 rounded-3xl border-white/5 hover:border-white/10 transition-all group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <div className="text-xl font-bold text-white truncate">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Resources Section - Hide for Self-Managed */}
            {deploymentMethod !== 'self' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Provisioned Inventory</h3>
                            <span className="text-[10px] font-bold text-slate-600 italic">Snapshot as of {deployedAt?.toLocaleTimeString()}</span>
                        </div>

                        <div className="space-y-4">
                            {modules.map((mod, idx) => (
                                <div key={idx} className="glass-card p-6 rounded-3xl border-white/5 hover:border-brand-500/20 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-brand-400 group-hover:border-brand-500/20 transition-all">
                                                {SERVICE_ICONS[mod.category] || <Box size={24} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-lg font-bold text-white italic">{mod.service_name || mod.type}</h4>
                                                    <span className="px-2 py-0.5 rounded bg-white/5 text-[8px] font-black text-slate-500 uppercase tracking-tighter border border-white/5">{mod.category}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed max-w-md">{mod.description || 'Provisioned resource for application workload.'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Status</div>
                                            <div className="text-[10px] font-bold text-green-400 flex items-center gap-1.5 justify-end">
                                                <div className="w-1 h-1 rounded-full bg-green-400" /> Active
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 text-right">Infrastructure Outputs</h3>
                        
                        <div className="glass-panel p-6 rounded-[2rem] border-white/5 space-y-6 bg-slate-900/40">
                            {Object.entries(infraOutputs || {}).length > 0 ? (
                                Object.entries(infraOutputs).map(([key, val], idx) => {
                                    if (key === 'deployment_target' || key === 'infra_provisioned') return null;
                                    const displayValue = val?.value || val;
                                    if (typeof displayValue !== 'string') return null;

                                    return (
                                        <div key={idx} className="space-y-2 group/out">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest group-hover/out:text-brand-400 transition-colors">{key.replace(/_/g, ' ')}</span>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(displayValue);
                                                        toast.success(`${key} copied!`);
                                                    }}
                                                    className="opacity-0 group-hover/out:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded"
                                                >
                                                    <ExternalLink size={10} className="text-slate-500" />
                                                </button>
                                            </div>
                                            <div className="bg-black/40 rounded-xl p-3 border border-white/5 font-mono text-[10px] text-slate-400 break-all leading-relaxed">
                                                {displayValue}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-20 text-center space-y-4">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-700">
                                        <Info size={24} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Awaiting Registry Sync...</p>
                                </div>
                            )}
                        </div>

                        {/* Danger Zone */}
                        <div className="glass-panel p-6 rounded-[2rem] border-red-500/10 bg-red-500/[0.02] space-y-4">
                            <div className="flex items-center gap-3">
                                <Trash2 size={18} className="text-red-500" />
                                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest">Resource Decommission</h4>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">Permanently destroy all provisioned cloud assets. This action is irreversible.</p>
                            <button
                                onClick={onDeleteClick}
                                className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                            >
                                Decommission Infrastructure
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeployedSummary;
