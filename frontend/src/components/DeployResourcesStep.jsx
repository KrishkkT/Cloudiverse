import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    RefreshCw,
    ArrowLeft,
    Server,
    Terminal,
    CheckCircle2,
    ExternalLink,
    Info,
    EyeOff,
    Code2,
    Layers,
    ChevronDown,
    Rocket,
    Globe,
    Box,
    Zap,
    ArrowRight,
    Check,
    AlertTriangle,
    Shield,
    Activity,
    Search
} from 'lucide-react';
import GitHubRepoSelector from './GitHubRepoSelector';
import DeployedSummary from './DeployedSummary';
import DestroyConfirmationModal from './DestroyConfirmationModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const DeployResourcesStep = ({
    workspace,
    selectedProvider,
    onBack,
    onUpdateWorkspace,
    onDeploySuccess  // 🔥 NEW: Callback to mark project as deployed
}) => {
    const navigate = useNavigate();
    const { costEstimation, infraSpec, infra_outputs } = workspace?.state_json || {};
    const connection = workspace?.state_json?.connection || infraSpec?.connection || costEstimation?.connection || {};
    const provider = selectedProvider || connection?.provider || costEstimation?.provider || infraSpec?.provider || 'aws';
    const region = workspace?.state_json?.region
        || infraSpec?.region?.resolved_region
        || costEstimation?.region
        || connection?.region
        || infraSpec?.region?.user_preference
        || 'Auto-detected';

    // Connection State
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    // Source Configuration
    const [sourceType, setSourceType] = useState('github'); // 'github' | 'docker'

    // GitHub Form
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [repoUrl, setRepoUrl] = useState('');
    const [branch, setBranch] = useState('main');
    const [branches, setBranches] = useState([{ name: 'main' }]);
    const [isFetchingBranches, setIsFetchingBranches] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [buildType, setBuildType] = useState('static'); // static, node, react
    const [buildCommand, setBuildCommand] = useState('npm run build');
    const [outputDir, setOutputDir] = useState('dist');

    // Docker Form
    const [dockerImage, setDockerImage] = useState('');
    const [containerPort, setContainerPort] = useState('80');
    const [envVars, setEnvVars] = useState('');

    // Deployment State
    const [deployJobId, setDeployJobId] = useState(null);
    const [deployStatus, setDeployStatus] = useState(workspace?.deployment_status === 'DEPLOYED' ? 'success' : 'idle');
    const isDeployed = deployStatus === 'success';
    const [deployStage, setDeployStage] = useState('init');
    const [logs, setLogs] = useState([]);

    // Deployment Plan (Infrastructure-Aware)
    const [deployPlan, setDeployPlan] = useState(null);
    const [isLoadingPlan, setIsLoadingPlan] = useState(false);
    const [userEnvVars, setUserEnvVars] = useState(workspace?.state_json?.user_env_vars || {});
    const [showEnvVarEditor, setShowEnvVarEditor] = useState(false);
    const [newEnvKey, setNewEnvKey] = useState('');
    const [newEnvValue, setNewEnvValue] = useState('');

    // Destroy Modal State
    const [showDestroyModal, setShowDestroyModal] = useState(false);

    const logEndRef = useRef(null);
    const pollInterval = useRef(null);
    const isProcessingSuccess = useRef(false);

    // Summary Toggle
    const [showSummary, setShowSummary] = useState(false);

    // ─── VALIDATION LOGIC ─────────────────────────────────────────────────────────
    const isFormValid = () => {
        if (sourceType === 'github') {
            const hasUrl = selectedRepo?.html_url || (repoUrl?.startsWith('https://github.com/'));
            return hasUrl && branch?.length > 0;
        } else if (sourceType === 'docker') {
            return dockerImage?.length > 0 && !dockerImage.includes(' ');
        }
        return false;
    };

    // ─── CONNECTION LOGIC ─────────────────────────────────────────────────────────

    useEffect(() => {
        checkConnectionStatus();

        // Hydrate logs if already deployed
        if (workspace?.deployment_status === 'DEPLOYED') {
            // 🔥 SYNC STATE: Ensure local state matches prop if loaded late
            setDeployStatus('success');
            hydrateLatestLogs();
        }

        return () => stopPolling();
    }, [workspace.id, workspace?.deployment_status]);

    const hydrateLatestLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE}/api/deploy/workspace/${workspace.id}/latest`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data?.logs) {
                setLogs(res.data.logs);
            }
        } catch (err) {
            console.error("Failed to hydrate latest logs:", err);
        }
    };

    const checkConnectionStatus = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/workspaces/${workspace.id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const conn = res.data.state_json?.connection;
            if (conn && conn.provider?.toLowerCase() === provider?.toLowerCase() && conn.status === 'connected') {
                setConnectionStatus('connected');
            }
        } catch (err) {
            console.error("Status check failed", err);
        }
    };

    // Fetch branches when repo is selected
    useEffect(() => {
        if (selectedRepo) {
            fetchBranches(selectedRepo);
        }
    }, [selectedRepo]);

    const fetchBranches = async (repo) => {
        if (!repo) return;
        try {
            setIsFetchingBranches(true);
            const token = localStorage.getItem('token');
            // Support both nested owner.login (API) and potential flat structure or full_name
            const owner = repo.owner?.login || repo.owner || repo.full_name?.split('/')[0];
            const name = repo.name || repo.full_name?.split('/')[1];

            if (!owner || !name) {
                console.error("Incomplete repo data:", repo);
                return;
            }

            const res = await axios.get(`${API_BASE}/api/github/branches/${owner}/${name}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranches(res.data);
            if (res.data.length > 0) {
                // Default to main or master if available
                const defaultBranch = res.data.find(b => b.name === 'main' || b.name === 'master') || res.data[0];
                setBranch(defaultBranch.name);
                detectConfig(repo, defaultBranch.name);
            }
        } catch (err) {
            console.error("Failed to fetch branches", err);
            toast.error("Failed to fetch repository branches");
        } finally {
            setIsFetchingBranches(false);
        }
    };

    const detectConfig = async (repo, branchName) => {
        if (!repo || !branchName) return;
        try {
            setIsDetecting(true);
            const token = localStorage.getItem('token');
            const owner = repo.owner?.login || repo.owner || repo.full_name?.split('/')[0];
            const name = repo.name || repo.full_name?.split('/')[1];

            if (!owner || !name) return;

            const res = await axios.get(`${API_BASE}/api/github/detect/${owner}/${name}?branch=${branchName}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const config = res.data;
            if (config.buildCommand) setBuildCommand(config.buildCommand);
            if (config.type) setBuildType(config.type);
            if (config.outputDir) setOutputDir(config.outputDir);
            if (config.dockerfilePath) setDockerImage(config.dockerfilePath); // Actually for Docker sourceType
            if (config.port) setContainerPort(config.port.toString());

            toast.success("Build configuration detected!");
        } catch (err) {
            console.error("Detection failed:", err);
            // Non-critical: User can still type manually
        } finally {
            setIsDetecting(false);
        }
    };

    // ─── DEPLOYMENT PLAN (Infrastructure-Aware) ──────────────────────────────
    const fetchDeploymentPlan = async () => {
        const repoFullUrl = selectedRepo?.html_url || repoUrl;
        if (!repoFullUrl) return;

        setIsLoadingPlan(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE}/api/deploy/plan`, {
                workspace_id: workspace.id,
                repoUrl: repoFullUrl,
                branch
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data?.plan) {
                setDeployPlan(res.data.plan);
                toast.success("Deployment plan generated!");
            }
        } catch (err) {
            console.error("Plan fetch failed:", err);
            toast.error("Failed to generate deployment plan");
        } finally {
            setIsLoadingPlan(false);
        }
    };

    const saveUserEnvVars = async (vars) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE}/api/deploy/env-vars`, {
                workspace_id: workspace.id,
                envVars: vars
            }, { headers: { Authorization: `Bearer ${token}` } });
            setUserEnvVars(vars);
            toast.success(`${Object.keys(vars).length} environment variables saved`);
        } catch (err) {
            toast.error("Failed to save environment variables");
        }
    };

    const addEnvVar = () => {
        if (!newEnvKey.trim()) return;
        const updated = { ...userEnvVars, [newEnvKey.trim()]: newEnvValue };
        setUserEnvVars(updated);
        setNewEnvKey('');
        setNewEnvValue('');
        saveUserEnvVars(updated);
    };

    const removeEnvVar = (key) => {
        const updated = { ...userEnvVars };
        delete updated[key];
        setUserEnvVars(updated);
        saveUserEnvVars(updated);
    };

    const stopPolling = () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
    };

    // ─── DEPLOYMENT ACTION ───────────────────────────────────────────────────────

    const handleDeploySubmit = async () => {
        if (!isFormValid()) return;

        try {
            setDeployStatus('running');
            setDeployStage('init');
            setLogs([]);

            const token = localStorage.getItem('token');
            const repoFullUrl = selectedRepo?.html_url || repoUrl;

            // 1. 🔥 Setup CI/CD Webhooks (Best effort)
            try {
                await axios.post(`${API_BASE}/api/ci/setup/${workspace.id}`, {
                    repoUrl: repoFullUrl,
                    branch
                }, { headers: { Authorization: `Bearer ${token}` } });
                console.log("[CI] Webhooks configured successfully");
            } catch (ciErr) {
                console.warn("[CI] Webhook setup failed (non-critical):", ciErr.message);
            }

            // 2. Start Deployment
            const config = sourceType === 'github' ? {
                repoUrl: repoFullUrl,
                branch,
                build_type: buildType,
                build_command: buildCommand,
                output_dir: outputDir
            } : {
                image: dockerImage,
                port: containerPort,
                env: envVars
            };

            const res = await axios.post(`${API_BASE}/api/deploy`, {
                workspace_id: workspace.id,
                source: sourceType,
                config
            }, { headers: { Authorization: `Bearer ${token}` } });

            const jobId = res.data.deploymentId;
            setDeployJobId(jobId);
            toast.success("Application deployment started!");

            startPollingDeployment(jobId);

        } catch (err) {
            console.error(err);
            setDeployStatus('failed');
            toast.error(err.response?.data?.error || "Deployment failed to start");
        }
    };

    const startPollingDeployment = (jobId) => {
        if (pollInterval.current) clearTimeout(pollInterval.current);
        isProcessingSuccess.current = false; // Reset on start

        const poll = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_BASE}/api/deploy/${jobId}/status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const job = res.data;
                setDeployStage(job.status);
                setLogs(job.logs || []);

                if (job.status === 'success') {
                    // 🔥 GUARD: Prevent duplicate success processing
                    if (isProcessingSuccess.current) return;
                    isProcessingSuccess.current = true;

                    setDeployStatus('success');
                    if (pollInterval.current) clearTimeout(pollInterval.current);
                    toast.success("Application Deployed Successfully!");

                    // 🔥 INSTANT UI TRANSITION: Call parent success callback immediately
                    if (onDeploySuccess) {
                        onDeploySuccess();
                    }

                    // 🔥 CRITICAL: Persist Deployment State to Backend
                    try {
                        const token = localStorage.getItem('token');

                        // 1. Get current state to ensure we don't overwrite
                        const currentWsRes = await axios.get(`${API_BASE}/api/workspaces/${workspace.id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        const updatedState = {
                            ...currentWsRes.data.state_json,
                            is_deployed: true,
                            is_live: true,
                            deployed_at: new Date().toISOString()
                        };

                        // 2. Save updated state and step
                        const saveRes = await axios.post(`${API_BASE}/api/workspaces/save`, {
                            workspaceId: workspace.id,
                            step: 'deployment_summary', // Advance step to deployment_summary
                            state: updatedState,
                            name: workspace.name,
                            projectId: workspace.project_id
                        }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        // 3. Update local parent state
                        if (saveRes.data && onUpdateWorkspace) {
                            onUpdateWorkspace(saveRes.data);
                        }
                    } catch (err) {
                        console.error("Failed to persist deployment state:", err);
                        toast.error("Deployment succeeded but failed to update project status.");
                    }
                } else if (job.status === 'failed') {
                    setDeployStatus('failed');
                    if (pollInterval.current) clearTimeout(pollInterval.current);
                    toast.error("Deployment Failed");
                } else {
                    // Continue polling if still running
                    pollInterval.current = setTimeout(poll, 2000);
                }

            } catch (err) {
                console.error("Poll Error:", err);
                // Retry polling on transient errors
                pollInterval.current = setTimeout(poll, 5000);
            }
        };

        poll();
    };

    // Auto-scroll logs
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);


    // ─── RENDER ──────────────────────────────────────────────────────────────────

    return (
        <div className="animate-fade-in w-full pb-20 relative">
            {/* Header (Title removed) */}
            <div className="max-w-5xl mx-auto mb-8 flex items-center justify-end">
                <button onClick={onBack} className="px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition flex items-center gap-2">
                    <ArrowLeft size={16} />
                    <span>Back</span>
                </button>
            </div>

            <div className="max-w-5xl mx-auto space-y-6">

                {/* ═══════════════════════════════════════════════════════════════════════════
                    DEPLOYED STATE - Show Summary Instead of Deploy Form
                    ═══════════════════════════════════════════════════════════════════════════ */}
                {/* ═══════════════════════════════════════════════════════════════════════════
                    PROJECT HEADER & CONSOLE (SHARED)
                    ═══════════════════════════════════════════════════════════════════════════ */}
                <div className="bg-surface border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Server size={96} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                        <div>
                            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Provider</div>
                            <div className="text-white font-bold text-lg">{provider.toUpperCase()}</div>
                        </div>
                        <div>
                            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Region</div>
                            <div className="text-white font-bold text-lg">{region}</div>
                        </div>
                        <div>
                            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Cluster / App</div>
                            <div className="text-white font-bold text-lg truncate" title={infra_outputs?.computecontainer?.cluster_name || 'N/A'}>
                                {infra_outputs?.computecontainer?.cluster_name || infra_outputs?.computecontainer?.service_name || 'Provisioned'}
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Status</div>
                            <div className={`font-bold flex items-center gap-2 ${workspace?.deployment_status === 'DEPLOYED' ? 'text-green-400' : 'text-blue-400'}`}>
                                <span className={`w-2 h-2 rounded-full animate-pulse ${workspace?.deployment_status === 'DEPLOYED' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                {workspace?.deployment_status === 'DEPLOYED' ? 'Live & Running' : 'Ready to Deploy'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🚀 DEPLOYED SUMMARY (Conditional Overlay/Section) */}
                {workspace?.deployment_status === 'DEPLOYED' && showSummary && (
                    <div className="animate-slide-down">
                        <DeployedSummary
                            workspace={workspace}
                            infraOutputs={infra_outputs}
                            onDeleteClick={() => setShowDestroyModal(true)}
                        />
                    </div>
                )}

                <DestroyConfirmationModal
                    isOpen={showDestroyModal}
                    onClose={() => setShowDestroyModal(false)}
                    workspaceId={workspace.id}
                    workspaceName={workspace.name || 'This Project'}
                    onDestroyComplete={async () => {
                        setShowDestroyModal(false);
                        toast.success("Infrastructure destroyed successfully");

                        // 🔥 CRITICAL: Reset Deployment State in Backend
                        try {
                            const token = localStorage.getItem('token');

                            // 1. Get current state
                            const currentWsRes = await axios.get(`${API_BASE}/api/workspaces/${workspace.id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });

                            const updatedState = {
                                ...currentWsRes.data.state_json,
                                is_deployed: false,
                                is_live: false,
                                deployed_at: null
                            };

                            // 2. Save reset state and revert step to 'design' (or 'cost-estimation')
                            const saveRes = await axios.post(`${API_BASE}/api/workspaces/save`, {
                                workspaceId: workspace.id,
                                step: 'design', // Revert to design step
                                state: updatedState,
                                name: workspace.name,
                                projectId: workspace.project_id
                            }, {
                                headers: { Authorization: `Bearer ${token}` }
                            });

                            // 3. Update local parent state
                            if (saveRes.data && onUpdateWorkspace) {
                                onUpdateWorkspace(saveRes.data);
                            }
                        } catch (err) {
                            console.error("Failed to reset project status:", err);
                            toast.error("Destroyed resources but failed to update project status.");
                        }
                    }}
                />

                {/* 🚀 EXECUTION CONSOLE (Replaces Form when running or deployed) */}
                {deployStatus !== 'idle' && (
                    <div className="bg-[#0f1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
                        <div className="bg-[#1a1d26] p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Terminal className="text-gray-400" size={18} />
                                <span className="font-mono font-bold text-gray-300">Deployment Logs</span>
                                {deployStatus === 'running' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2"></span>}
                            </div>
                            {deployStatus === 'failed' && (
                                <button onClick={() => setDeployStatus('idle')} className="text-red-400 text-xs hover:underline flex items-center gap-1">
                                    <RefreshCw size={14} /> Try Again
                                </button>
                            )}
                        </div>
                        <div className="p-6 h-[400px] overflow-y-auto font-mono text-xs space-y-2 bg-black/40">
                            {logs.length > 0 ? logs.map((log, idx) => (
                                <div key={idx} className="text-gray-300 border-l-2 border-transparent pl-3 hover:bg-white/5 py-1">
                                    <span className="text-gray-600 mr-3 inline-block w-[80px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    <span dangerouslySetInnerHTML={{ __html: log.message.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-blue-400 underline">$1</a>') }}></span>
                                </div>
                            )) : (
                                <div className="text-gray-500 italic py-4">Deployed versions do not have log stream...</div>
                            )}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                )}

                {/* 🔴 FAILED STATE UI */}
                {deployStatus === 'failed' && (() => {
                    const lastLog = logs[logs.length - 1]?.message || '';
                    const errorDetails = ((logMsg) => {
                        if (logMsg.includes('INVALID_REPO_URL')) return {
                            reason: 'Invalid GitHub repository URL or inaccessible repository.',
                            fixes: ['Check if the repository is private and requires a token', 'Verify the URL starts with https://github.com/', 'Ensure the branch exists']
                        };
                        return {
                            reason: lastLog.replace('❌ Deployment Failed:', '').trim() || 'An unexpected error occurred.',
                            fixes: ['Check the deployment logs for more details', 'Retry the deployment']
                        };
                    })(logs.find(l => l.message.includes('❌'))?.message || lastLog);

                    return (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center animate-fade-in mt-6">
                            <h3 className="text-2xl font-bold text-red-500 mb-2">❌ Deployment Failed</h3>
                            <p className="text-gray-400 mb-4">{errorDetails.reason}</p>
                            <div className="flex gap-4 justify-center">
                                <button onClick={() => setDeployStatus('idle')} className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2 rounded-lg transition-colors flex items-center gap-2">
                                    <RefreshCw size={18} /> Retry
                                </button>
                            </div>
                        </div>
                    );
                })()}

                {/* 🟢 SUCCESS STATE UI */}
                {deployStatus === 'success' && (() => {
                    // Read from new deployment_target (set by enhanced deployFromGithub)
                    const dt = workspace?.state_json?.deployment_target || infra_outputs?.deployment_target;
                    const deployUrls = dt?.urls || {};
                    const deployResults = dt?.results || [];

                    // Resolve primary URL (fallback chain)
                    let liveUrl = deployUrls.frontend || deployUrls.application || deployUrls.backend;

                    // Legacy fallback
                    if (!liveUrl && dt?.static?.url) liveUrl = dt.static.url;
                    if (!liveUrl && dt?.static?.cdn_domain) liveUrl = `https://${dt.static.cdn_domain}`;
                    if (!liveUrl && dt?.container?.service_url) liveUrl = dt.container.service_url;

                    // Log-based fallback (backward compat)
                    if (!liveUrl) {
                        const urlLog = logs.find(l => l.message?.includes('https://') && !l.message?.includes('github.com'));
                        if (urlLog) {
                            const match = urlLog.message.match(/(https?:\/\/[^\s]+)/);
                            if (match) liveUrl = match[1];
                        }
                    }

                    const hasMultipleUrls = Object.keys(deployUrls).length > 1;

                    return (
                        <>
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center animate-fade-in mt-6">
                                <div className="inline-block p-4 bg-green-500/20 rounded-full mb-4">
                                    <CheckCircle2 className="text-green-400" size={48} />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-2">Deployed Successfully!</h3>
                                <p className="text-gray-400 mb-6 max-w-lg mx-auto">Your application is live. DNS propagation may take a few minutes.</p>

                                {/* Multi-URL Endpoints Table */}
                                {hasMultipleUrls ? (
                                    <div className="max-w-lg mx-auto mb-6 space-y-3 text-left">
                                        {Object.entries(deployUrls).map(([name, url]) => (
                                            <div key={name} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                                                <div className={`w-8 h-8 rounded-md flex items-center justify-center text-sm ${name === 'frontend' ? 'bg-blue-500/20 text-blue-400' : name === 'backend' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                    {name === 'frontend' ? '🌐' : name === 'backend' ? '🐳' : '⚡'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-white font-semibold capitalize text-sm">{name}</div>
                                                    <div className="text-gray-400 text-xs truncate">{url || 'Internal (VPC)'}</div>
                                                </div>
                                                {url && (
                                                    <a href={url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                                                        <ExternalLink size={16} />
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : null}

                                {liveUrl ? (
                                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                                        <a href={liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold px-6 py-3 md:px-8 md:py-4 rounded-xl shadow-lg shadow-green-500/20 hover:scale-105 transition-all text-base md:text-lg">
                                            Visit Live App <ExternalLink size={20} />
                                        </a>
                                        <button onClick={() => setShowSummary(!showSummary)} className={`inline-flex items-center gap-3 font-bold px-6 py-3 md:px-8 md:py-4 rounded-xl transition-all text-base md:text-lg border ${showSummary ? 'bg-white text-gray-900 border-white' : 'bg-transparent text-white border-white/20 hover:bg-white/5'}`}>
                                            {showSummary ? <EyeOff size={20} /> : <Info size={20} />}
                                            {showSummary ? 'Hide Summary' : 'Summary'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-gray-500">Live URL not available yet. Please contact support team.</div>
                                )}

                                {/* Observability badges */}
                                {dt?.observability && (
                                    <div className="flex gap-2 justify-center flex-wrap mt-6 pt-4 border-t border-white/10">
                                        {dt.observability.logging?.enabled && <span className="px-3 py-1 bg-indigo-500/10 rounded-full text-xs text-indigo-400">📊 {dt.observability.logging.service}</span>}
                                        {dt.observability.monitoring?.enabled && <span className="px-3 py-1 bg-cyan-500/10 rounded-full text-xs text-cyan-400">📈 {dt.observability.monitoring.service}</span>}
                                        {dt.observability.tracing?.enabled && <span className="px-3 py-1 bg-amber-500/10 rounded-full text-xs text-amber-400">🔍 {dt.observability.tracing.service}</span>}
                                    </div>
                                )}
                            </div>

                            {/* Go to Dashboard Button */}
                            <div className="mt-6 text-center">
                                <button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">
                                    <ArrowLeft size={16} /> Go to Dashboard
                                </button>
                            </div>
                        </>
                    );
                })()}

                {/* 📝 DEPLOYMENT FORM (INLINE) - ONLY IF NOT DEPLOYED or failed */}
                {(workspace?.deployment_status !== 'DEPLOYED' && deployStatus === 'idle') && (
                    <div className="bg-[#1e212b] border border-white/10 rounded-2xl p-8 shadow-xl">
                        {/* Source Tabs */}
                        <div className="flex flex-col md:flex-row gap-4 mb-8">
                            <button
                                onClick={() => setSourceType('github')}
                                className={`flex-1 py-3 md:py-4 rounded-xl border transition-all flex items-center justify-center gap-3 text-base md:text-lg font-bold ${sourceType === 'github' ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10' : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5'}`}
                            >
                                <Code2 size={20} /> GitHub Repository
                            </button>
                            <button
                                onClick={() => setSourceType('docker')}
                                className={`flex-1 py-3 md:py-4 rounded-xl border transition-all flex items-center justify-center gap-3 text-base md:text-lg font-bold ${sourceType === 'docker' ? 'bg-purple-500/10 border-purple-500 text-purple-400 shadow-lg shadow-purple-500/10' : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5'}`}
                            >
                                <Layers size={20} /> Docker Image
                            </button>
                        </div>

                        {/* GitHub Inputs */}
                        {sourceType === 'github' && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold mb-3 block">GitHub Repository</label>
                                    <GitHubRepoSelector
                                        selectedRepo={selectedRepo}
                                        onSelect={(repo) => {
                                            setSelectedRepo(repo);
                                            setRepoUrl('');
                                            setDeployPlan(null);
                                        }}
                                    />
                                </div>

                                {/* ═══ ENVIRONMENT VARIABLES EDITOR ═══ */}
                                <div className="border border-white/10 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setShowEnvVarEditor(!showEnvVarEditor)}
                                        className="w-full p-4 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <span className="text-white font-semibold flex items-center gap-2">
                                            🔐 Environment Variables
                                            {Object.keys(userEnvVars).length > 0 && (
                                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{Object.keys(userEnvVars).length}</span>
                                            )}
                                        </span>
                                        <ChevronDown size={18} className={`text-gray-400 transition-transform ${showEnvVarEditor ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showEnvVarEditor && (
                                        <div className="p-4 space-y-3 animate-slide-down">
                                            <p className="text-xs text-gray-500">Add your app's environment variables (API keys, secrets, etc). These are stored securely and injected at deploy time.</p>

                                            {/* Existing vars */}
                                            {Object.entries(userEnvVars).map(([key, val]) => (
                                                <div key={key} className="flex items-center gap-2">
                                                    <input type="text" value={key} readOnly className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-blue-300 font-mono text-sm" />
                                                    <input type="password" value={val} readOnly className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-gray-400 font-mono text-sm" />
                                                    <button onClick={() => removeEnvVar(key)} className="text-red-400 hover:text-red-300 p-1 transition-colors" title="Remove">✕</button>
                                                </div>
                                            ))}

                                            {/* Add new */}
                                            <div className="flex items-center gap-2">
                                                <input type="text" value={newEnvKey} onChange={e => setNewEnvKey(e.target.value)} placeholder="KEY" className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm placeholder-gray-600" />
                                                <input type="text" value={newEnvValue} onChange={e => setNewEnvValue(e.target.value)} placeholder="value" className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm placeholder-gray-600" onKeyDown={e => e.key === 'Enter' && addEnvVar()} />
                                                <button onClick={addEnvVar} disabled={!newEnvKey.trim()} className="bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-500/30 transition-colors disabled:opacity-30">+</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {selectedRepo && (
                                    <div className="space-y-6 animate-slide-down">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Select Branch</label>
                                                <div className="relative">
                                                    <select
                                                        value={branch}
                                                        onChange={(e) => {
                                                            const b = e.target.value;
                                                            setBranch(b);
                                                            detectConfig(selectedRepo, b);
                                                            setDeployPlan(null);
                                                        }}
                                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none transition-colors appearance-none cursor-pointer pr-10"
                                                        disabled={isFetchingBranches || isDetecting}
                                                    >
                                                        {isFetchingBranches ? (
                                                            <option>Loading branches...</option>
                                                        ) : (
                                                            branches.map(b => (
                                                                <option key={b.name} value={b.name} className="bg-gray-900">{b.name}</option>
                                                            ))
                                                        )}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 flex items-center gap-2">
                                                        {(isFetchingBranches || isDetecting) && <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
                                                        <ChevronDown size={20} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-end">
                                                <button
                                                    onClick={fetchDeploymentPlan}
                                                    disabled={isLoadingPlan}
                                                    className="w-full py-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                                                >
                                                    {isLoadingPlan ? <RefreshCw size={18} className="animate-spin" /> : <Rocket size={18} />}
                                                    {isLoadingPlan ? 'Analyzing...' : 'Analyze & Plan'}
                                                </button>
                                            </div>
                                        </div>


                                        {/* ═══ DEPLOYMENT PLAN PREVIEW ═══ */}
                                        {deployPlan && (
                                            <div className="glass-premium rounded-[2.5rem] border border-emerald-500/20 p-8 space-y-8 animate-fade-in shadow-2xl shadow-emerald-500/5 relative overflow-hidden group/plan">
                                                <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none group-hover/plan:bg-emerald-500/20 transition-all duration-1000" />

                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                                                        <Rocket size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-white italic">Deployment Blueprint</h3>
                                                        <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">AI Optimized Mapping → Live Cluster</p>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-500 ml-auto uppercase tracking-tighter">Verified Readiness 100%</span>
                                                </div>

                                                {/* Component → Service Mapping */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                                    {deployPlan.components?.map((comp, idx) => (
                                                        <div key={idx} className="flex items-center gap-5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all group/card shadow-xl backdrop-blur-sm relative overflow-hidden">
                                                            {/* Subtle hover glow */}
                                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />

                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner relative z-10 ${comp.type === 'static' ? 'bg-blue-500/10 border border-blue-500/20' : comp.type === 'container' ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                                                                {comp.type === 'static' ? <Globe className="text-blue-400" size={24} /> : comp.type === 'container' ? <Box className="text-purple-400" size={24} /> : <Zap className="text-amber-400" size={24} />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{comp.type} Component</div>
                                                                <div className="text-white font-bold text-lg leading-none mb-1 capitalize">{comp.name}</div>
                                                                <div className="text-emerald-400 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                                    <ArrowRight size={10} /> {comp.service}
                                                                </div>
                                                            </div>
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${comp.autoDetected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                                                {comp.autoDetected ? <Check size={14} /> : <AlertTriangle size={14} />}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Infra Env Vars Preview */}
                                                {deployPlan.envVars && Object.keys(deployPlan.envVars).length > 0 && (
                                                    <div className="border-t border-white/5 pt-8 mt-4 relative z-10">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <Shield size={14} className="text-slate-500" />
                                                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Secure Infrastructure Tunnels (Auto-Injected)</div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {Object.entries(deployPlan.envVars).filter(([k]) => !k.includes('PASSWORD')).map(([key, val]) => (
                                                                <div key={key} className="bg-black/40 border border-white/5 rounded-xl px-5 py-3 text-xs flex justify-between items-center group/var hover:border-brand-500/20 transition-all shadow-inner">
                                                                    <span className="text-brand-400 font-mono font-bold tracking-tight">{key}</span>
                                                                    <span className="text-slate-600 font-mono truncate max-w-[150px] group-hover/var:text-slate-400" title={val}>{typeof val === 'string' && val.length > 25 ? val.slice(0, 25) + '...' : val}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Observability Preview */}
                                                {deployPlan.observability && (
                                                    <div className="border-t border-white/5 pt-8 relative z-10">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <Activity size={14} className="text-slate-500" />
                                                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Production Telemetry (Auto-Configured)</div>
                                                        </div>
                                                        <div className="flex gap-4 flex-wrap">
                                                            {deployPlan.observability.logging?.enabled && (
                                                                <div className="flex items-center gap-3 px-5 py-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl hover:bg-blue-500/10 transition-all group/tele">
                                                                    <Terminal size={14} className="text-blue-400 group-hover/tele:scale-110 transition-transform" />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[9px] text-blue-500/60 font-black uppercase tracking-tighter leading-none mb-1">Logging</span>
                                                                        <span className="text-xs text-blue-200 font-bold leading-none">{deployPlan.observability.logging.service}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {deployPlan.observability.monitoring?.enabled && (
                                                                <div className="flex items-center gap-3 px-5 py-3 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl hover:bg-cyan-500/10 transition-all group/tele">
                                                                    <Activity size={14} className="text-cyan-400 group-hover/tele:scale-110 transition-transform" />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[9px] text-cyan-500/60 font-black uppercase tracking-tighter leading-none mb-1">Monitoring</span>
                                                                        <span className="text-xs text-cyan-200 font-bold leading-none">{deployPlan.observability.monitoring.service}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {deployPlan.observability.tracing?.enabled && (
                                                                <div className="flex items-center gap-3 px-5 py-3 bg-purple-500/5 border border-purple-500/10 rounded-2xl hover:bg-purple-500/10 transition-all group/tele">
                                                                    <Search size={14} className="text-purple-400 group-hover/tele:scale-110 transition-transform" />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[9px] text-purple-500/60 font-black uppercase tracking-tighter leading-none mb-1">Tracing</span>
                                                                        <span className="text-xs text-purple-200 font-bold leading-none">{deployPlan.observability.tracing.service}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Docker Inputs */}
                        {sourceType === 'docker' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Docker Image <span className="text-red-400">*</span></label>
                                    <input type="text" value={dockerImage} onChange={e => setDockerImage(e.target.value)} placeholder="e.g. nginx:latest, myrepo/app:v1" className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Container Port</label>
                                    <input type="text" value={containerPort} onChange={e => setContainerPort(e.target.value)} placeholder="80" className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:border-purple-500 outline-none transition-colors" />
                                </div>
                            </div>
                        )}

                        {/* Action Bar */}
                        {!isDeployed ? (
                            <div className="mt-8 pt-8 border-t border-white/10 flex justify-end">
                                <button
                                    onClick={handleDeploySubmit}
                                    disabled={!isFormValid()}
                                    className={`px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold text-base md:text-lg flex items-center gap-3 transition-all ${isFormValid()
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02]'
                                        : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
                                >
                                    <Rocket size={20} />
                                    {isFormValid() ? (deployPlan ? 'Deploy with Plan' : 'Deploy Application') : 'Enter Details to Deploy'}
                                </button>
                            </div>
                        ) : (
                            <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-emerald-400 font-bold italic">
                                    <CheckCircle2 size={18} /> Infrastructure Live
                                </div>
                                <button
                                    onClick={() => setDeployStatus('idle')}
                                    className="text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-widest font-black"
                                >
                                    Reconfigure Source
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
};

export default DeployResourcesStep;


