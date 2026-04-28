import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const DeployStep = ({
    workspace,
    selectedProvider,
    onBack,
    onUpdateWorkspace
}) => {
    const provider = selectedProvider || 'aws';
    const { costEstimation, infraSpec } = workspace?.state_json || {};

    // Connection State
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [connectionData, setConnectionData] = useState(null);
    const [awsSetup, setAwsSetup] = useState({ url: '', externalId: '', accountId: '' });
    const [azureTenantId, setAzureTenantId] = useState('');
    const [showAzureAdvanced, setShowAzureAdvanced] = useState(false);

    // Deployment State
    const [deployConfig, setDeployConfig] = useState({ repoUrl: '', dockerImage: '' });
    const [deployJobId, setDeployJobId] = useState(null);
    const [deployStatus, setDeployStatus] = useState('idle'); // idle, running, success, failed
    const [deployStage, setDeployStage] = useState('init'); // init, plan, apply
    const [logs, setLogs] = useState([]);
    const [outputs, setOutputs] = useState(null);
    const [isLogExpanded, setIsLogExpanded] = useState(true);

    const logEndRef = useRef(null);
    const pollInterval = useRef(null);

    // ─── CONNECTION LOGIC ─────────────────────────────────────────────────────────

    useEffect(() => {
        checkConnectionStatus();
        return () => stopPolling();
    }, [workspace.id]);

    const checkConnectionStatus = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/workspaces/${workspace.id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const conn = res.data.state_json?.connection;
            if (conn && conn.provider?.toLowerCase() === provider.toLowerCase() && conn.status === 'connected') {
                setConnectionStatus('connected');
                setConnectionData(conn);
            }
        } catch (err) {
            console.error("Status check failed", err);
        }
    };

    const handleConnect = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE}/api/cloud/${provider.toLowerCase()}/connect`,
                {
                    workspace_id: workspace.id,
                    tenant_id: provider?.toLowerCase() === 'azure' ? azureTenantId : undefined
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (provider === 'aws') {
                setAwsSetup({
                    url: res.data.url,
                    externalId: res.data.extra.externalId,
                    accountId: res.data.extra.accountId
                });
            } else if (res.data.url) {
                window.open(res.data.url, 'CloudAuth', 'width=600,height=700');
                startPollingConnection();
            }
        } catch (err) {
            toast.error("Failed to initiate connection");
        }
    };

    const startPollingConnection = () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
        pollInterval.current = setInterval(checkConnectionStatus, 3000);
    };

    const stopPolling = () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
    };

    // ─── DEPLOYMENT LOGIC ─────────────────────────────────────────────────────────

    const handleDeploy = async () => {
        if (connectionStatus !== 'connected') {
            toast.error("Please connect your cloud account first.");
            return;
        }

        if (!deployConfig.selectedRepo && !deployConfig.repoUrl && !deployConfig.dockerImage) {
            toast.error("Please select a repository or provide a Docker image.");
            return;
        }

        try {
            setDeployStatus('running');
            setDeployStage('init');
            setLogs([]);

            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE}/api/workflow/deploy/resources`, {
                workspace_id: workspace.id,
                provider: provider,
                source_type: deployConfig.selectedRepo ? 'github' : (deployConfig.dockerImage ? 'docker' : 'github'),
                repo_url: deployConfig.selectedRepo?.html_url || deployConfig.repoUrl,
                branch: deployConfig.branch,
                docker_image: deployConfig.dockerImage
            }, { headers: { Authorization: `Bearer ${token}` } });

            const jobId = res.data.jobId;
            setDeployJobId(jobId);
            toast.success("Deployment started!");

            // Start polling for deployment status
            startPollingDeployment(jobId);

        } catch (err) {
            console.error(err);
            setDeployStatus('failed');
            toast.error(err.response?.data?.error || "Deployment failed to start");
        }
    };

    const startPollingDeployment = (jobId) => {
        const interval = setInterval(async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_BASE}/api/workflow/deploy/${jobId}/status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const job = res.data;
                setDeployStage(job.stage);
                setLogs(job.logs || []);

                if (job.status === 'completed') {
                    setDeployStatus('success');
                    setOutputs(job.outputs);
                    clearInterval(interval);
                    toast.success("Infrastructure Deployed Successfully!");
                } else if (job.status === 'failed') {
                    setDeployStatus('failed');
                    clearInterval(interval);
                    toast.error("Deployment Failed: " + job.error);
                }

            } catch (err) {
                console.error("Poll Error:", err);
            }
        }, 2000);
        return () => clearInterval(interval);
    };

    // Auto-scroll logs
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);


    // ─── RENDER HELPERS ───────────────────────────────────────────────────────────

    const getStageStatus = (stage) => {
        const stages = ['init', 'plan', 'apply', 'outputs'];
        const currentIndex = stages.indexOf(deployStage);
        const stageIndex = stages.indexOf(stage);

        if (deployStatus === 'failed' && currentIndex === stageIndex) return 'error';
        if (deployStatus === 'success') return 'completed';
        if (currentIndex > stageIndex) return 'completed';
        if (currentIndex === stageIndex) return 'active';
        return 'pending';
    };

    const renderTimelineItem = (stage, label, icon) => {
        const status = getStageStatus(stage);
        const colors = {
            completed: 'bg-green-500 text-white',
            active: 'bg-blue-500 text-white animate-pulse',
            error: 'bg-red-500 text-white',
            pending: 'bg-white/10 text-gray-500'
        };
        const iconColors = {
            completed: 'text-green-400',
            active: 'text-blue-400',
            error: 'text-red-400',
            pending: 'text-gray-600'
        };

        return (
            <div className="flex flex-col items-center flex-1 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 z-10 ${colors[status]} transition-all duration-300`}>
                    <span className="material-icons text-sm">{status === 'completed' ? 'check' : status === 'error' ? 'close' : icon}</span>
                </div>
                <div className={`text-xs font-bold uppercase tracking-wider ${iconColors[status]}`}>{label}</div>

                {/* Connector Line */}
                {stage !== 'outputs' && (
                    <div className={`absolute top-5 left-1/2 w-full h-0.5 -z-0 ${status === 'completed' ? 'bg-green-500/50' : 'bg-white/10'}`}></div>
                )}
            </div>
        );
    };

    return (
        <div className="animate-fade-in w-full pb-20">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        {deployStatus === 'idle' ? 'Final Deployment' : 'Deployment Console'}
                    </h1>
                    <p className="text-gray-400 mt-2">
                        {deployStatus === 'idle'
                            ? `Review configuration and launch your ${provider.toUpperCase()} infrastructure.`
                            : `Provisioning resources on ${provider.toUpperCase()}...`}
                    </p>
                </div>
                {deployStatus === 'idle' && (
                    <button onClick={onBack} className="px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition flex items-center gap-2">
                        <span className="material-icons text-sm">arrow_back</span>
                        <span>Back</span>
                    </button>
                )}
            </div>

            <div className="max-w-5xl mx-auto space-y-6">

                {/* 1. CONFIGURATION PHASE (IDLE) */}
                {deployStatus === 'idle' && (
                    <>
                        {/* Connection Card */}
                        <div className={`rounded-2xl p-6 border ${connectionStatus === 'connected' ? 'bg-green-500/5 border-green-500/20' : 'bg-surface-light border-white/10'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${connectionStatus === 'connected' ? 'bg-green-500/10' : 'bg-white/5'}`}>
                                        <span className={`material-icons ${connectionStatus === 'connected' ? 'text-green-400' : 'text-gray-400'}`}>
                                            {connectionStatus === 'connected' ? 'verified_user' : 'cloud_off'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">
                                            {connectionStatus === 'connected' ? `${provider.toUpperCase()} Connected` : `Connect to ${provider.toUpperCase()}`}
                                        </h3>
                                        <p className="text-sm text-gray-400">
                                            {connectionStatus === 'connected' ? `Account ID: ${connectionData?.account_id}` : 'Authorization required to proceed.'}
                                        </p>
                                    </div>
                                </div>
                                {connectionStatus !== 'connected' && (
                                    <button
                                        onClick={handleConnect}
                                        className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition"
                                    >
                                        Connect Now
                                    </button>
                                )}
                            </div>

                            {/* AWS Setup Helper */}
                            {awsSetup.url && connectionStatus !== 'connected' && (
                                <div className="mt-4 p-4 bg-black/30 rounded-lg flex items-center justify-between">
                                    <span className="text-sm text-gray-300">AWS Quick Setup Link Generated</span>
                                    <a href={awsSetup.url} target="_blank" rel="noreferrer" className="text-blue-400 text-sm font-bold hover:underline">
                                        Open AWS Console &rarr;
                                    </a>
                                </div>
                            )}

                            {/* Azure Tenant ID Override (Hidden initially) */}
                            {provider?.toLowerCase() === 'azure' && connectionStatus !== 'connected' && (
                                <div className="mt-4">
                                    <button
                                        onClick={() => setShowAzureAdvanced(!showAzureAdvanced)}
                                        className="text-xs text-gray-400 hover:text-white transition flex items-center gap-1"
                                    >
                                        <span className="material-icons text-[14px]">{showAzureAdvanced ? 'expand_less' : 'settings'}</span>
                                        {showAzureAdvanced ? 'Hide Advanced Settings' : 'Using a Personal Account? Click here'}
                                    </button>

                                    {showAzureAdvanced && (
                                        <div className="mt-3 p-4 bg-black/20 rounded-xl border border-white/5 animate-slide-down">
                                            <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Azure Tenant ID (GUID)</label>
                                            <input
                                                type="text"
                                                value={azureTenantId}
                                                onChange={(e) => setAzureTenantId(e.target.value)}
                                                placeholder="e.g. 12345678-abcd-1234-abcd-1234567890ab"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-blue-500/50 outline-none"
                                            />
                                            <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                                                Personal accounts often require a specific Tenant ID for Management API access.
                                                Find it in your <a href="https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Azure Portal Overview</a><br />
                                                After entering the Tenant ID, click on "Connect" button to proceed.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Input Configuration */}
                        <div className="bg-surface-light border border-white/5 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Application Source</h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Select GitHub Repository</label>
                                    <GitHubRepoSelector
                                        selectedRepo={deployConfig.selectedRepo}
                                        onSelect={(repo) => setDeployConfig({ ...deployConfig, selectedRepo: repo, repoUrl: '' })}
                                    />
                                </div>

                                {deployConfig.selectedRepo && (
                                    <div className="animate-slide-down">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Branch</label>
                                        <select
                                            value={deployConfig.branch}
                                            onChange={(e) => setDeployConfig({ ...deployConfig, branch: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500/50 outline-none"
                                        >
                                            {branches.map(b => (
                                                <option key={b.name} value={b.name}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Or Manual Repo URL</label>
                                        <input
                                            type="text"
                                            value={deployConfig.repoUrl}
                                            disabled={!!deployConfig.selectedRepo}
                                            onChange={(e) => setDeployConfig({ ...deployConfig, repoUrl: e.target.value })}
                                            placeholder="https://github.com/username/repo"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500/50 outline-none disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Docker Image (Optional)</label>
                                        <input
                                            type="text"
                                            value={deployConfig.dockerImage}
                                            onChange={(e) => setDeployConfig({ ...deployConfig, dockerImage: e.target.value })}
                                            placeholder="e.g. nginx:latest"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500/50 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DEPLOY ACTION */}
                        <button
                            onClick={handleDeploy}
                            disabled={connectionStatus !== 'connected'}
                            className={`w-full py-6 rounded-2xl font-black text-lg tracking-widest shadow-2xl transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 ${connectionStatus === 'connected'
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-blue-500/25'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            <span className="material-icons">rocket_launch</span>
                            START DEPLOYMENT
                        </button>
                    </>
                )}

                {/* 2. EXECUTION CONSOLE (ACTIVE) */}
                {deployStatus !== 'idle' && (
                    <div className="animate-slide-up space-y-6">

                        {/* Timeline */}
                        <div className="bg-surface-light border border-white/10 rounded-2xl p-8">
                            <div className="flex justify-between items-start">
                                {renderTimelineItem('init', 'Initializing', 'construction')}
                                {renderTimelineItem('plan', 'Planning', 'map')}
                                {renderTimelineItem('apply', 'Applying', 'layers')}
                                {renderTimelineItem('outputs', 'Ready', 'flag')}
                            </div>
                        </div>

                        {/* Logs Terminal */}
                        <div className="bg-[#0f1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                            <div
                                className="bg-[#1a1d26] p-4 flex items-center justify-between cursor-pointer hover:bg-[#202430] transition"
                                onClick={() => setIsLogExpanded(!isLogExpanded)}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="material-icons text-gray-400 text-sm">terminal</span>
                                    <span className="font-mono text-sm font-bold text-gray-300">Deployment Logs</span>
                                    {deployStatus === 'running' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2"></span>}
                                </div>
                                <span className="material-icons text-gray-500 transform transition-transform duration-300" style={{ transform: isLogExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                            </div>

                            {isLogExpanded && (
                                <div className="p-4 h-[400px] overflow-y-auto font-mono text-xs space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                                    {logs.length === 0 && <div className="text-gray-600 italic">Waiting for logs...</div>}
                                    {logs.map((log, idx) => (
                                        <div key={idx} className={`flex gap-3 ${log.type === 'ERROR' ? 'text-red-400' : log.type === 'WARN' ? 'text-amber-400' : 'text-gray-300'}`}>
                                            <span className="text-gray-600 shrink-0 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                            <span className={`font-bold shrink-0 w-16 select-none ${log.type === 'CMD' ? 'text-blue-400' :
                                                log.type === 'SYSTEM' ? 'text-purple-400' : 'text-gray-500'
                                                }`}>{log.type}</span>
                                            <span className="whitespace-pre-wrap">{log.message}</span>
                                        </div>
                                    ))}
                                    <div ref={logEndRef} />
                                </div>
                            )}
                        </div>

                        {/* SUCCESS STATE */}
                        {deployStatus === 'success' && outputs && (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 animate-fade-in text-center">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-icons text-3xl text-green-400">celebration</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Infrastructure Ready!</h3>
                                <p className="text-gray-400 mb-6">Your resources have been successfully provisioned.</p>

                                <div className="bg-black/40 rounded-xl p-4 mb-6 text-left max-w-2xl mx-auto border border-white/5">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Output Values</h4>
                                    <pre className="text-green-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                                        {JSON.stringify(outputs, null, 2)}
                                    </pre>
                                </div>

                                <button
                                    className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:from-green-500 hover:to-emerald-500 transition-all transform hover:scale-105"
                                    onClick={() => {
                                        toast.success("Deployment finalized!");
                                        if (onDeploySuccess) onDeploySuccess();
                                    }}
                                >
                                    Finish & View Deployment
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeployStep;
