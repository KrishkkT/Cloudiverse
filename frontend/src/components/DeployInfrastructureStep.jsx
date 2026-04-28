import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    ArrowRight,
    ArrowLeft,
    Layers,
    CheckCircle2,
    AlertTriangle,
    Trash2,
    RefreshCw,
    Terminal,
    Rocket,
    Lock,
    ShieldCheck,
    Zap
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

const DeployInfrastructureStep = ({
    workspaceId,
    selectedProvider,
    onComplete,
    onBack,
    userPlan = 'free',
    savedState = {},
    isDeployed = false,
    onUpdateWorkspace
}) => {
    const [deployStatus, setDeployStatus] = useState('idle');
    const [destroyStatus, setDestroyStatus] = useState('idle');
    const [logs, setLogs] = useState([]);
    const [deployJobId, setDeployJobId] = useState(null);
    const [showDestroyConfirm, setShowDestroyConfirm] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const logEndRef = useRef(null);
    const pollingRef = useRef(null);
    const isPro = userPlan === 'pro' || userPlan === 'enterprise';

    // Hydrate state
    useEffect(() => {
        if (savedState && Object.keys(savedState).length > 0) {
            if (savedState.deployStatus) setDeployStatus(savedState.deployStatus);
            if (savedState.destroyStatus) setDestroyStatus(savedState.destroyStatus);
            if (savedState.logs) setLogs(savedState.logs);
            if (savedState.deployJobId) {
                setDeployJobId(savedState.deployJobId);
                if (!pollingRef.current) {
                    if (savedState.deployStatus === 'running') startPollingDeployment(savedState.deployJobId);
                    else if (savedState.destroyStatus === 'running') startPollingDestroy(savedState.deployJobId);
                }
            }
        }
    }, [savedState]);

    useEffect(() => {
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, []);

    const persistState = (updates) => { if (onUpdateWorkspace) onUpdateWorkspace(updates); };

    // ─── PROVISIONING ────────────────────────────────────────────────────────────
    const handleProvision = async () => {
        try {
            setDeployStatus('running');
            setLogs([]);
            persistState({ deployStatus: 'running', logs: [] });

            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE}/workflow/deploy/terraform`, {
                workspace_id: workspaceId,
                provider: selectedProvider
            }, { headers: { Authorization: `Bearer ${token}` } });

            const jobId = res.data.jobId;
            setDeployJobId(jobId);
            toast.success("Provisioning started...");
            persistState({ deployJobId: jobId, deployStatus: 'running' });
            startPollingDeployment(jobId);
        } catch (err) {
            console.error("Provisioning error:", err);
            setDeployStatus('failed');
            persistState({ deployStatus: 'failed' });
            toast.error(err.response?.data?.error || "Failed to start provisioning");
        }
    };

    const startPollingDeployment = (jobId) => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_BASE}/workflow/deploy/${jobId}/status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const job = res.data;
                setLogs(job.logs || []);
                if (job.status === 'completed') {
                    setDeployStatus('success');
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    persistState({ deployStatus: 'success', logs: job.logs, infra_provisioned: true });
                    toast.success("Infrastructure Ready");
                } else if (job.status === 'failed') {
                    setDeployStatus('failed');
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    persistState({ deployStatus: 'failed', logs: job.logs });
                    toast.error("Provisioning Failed");
                } else {
                    persistState({ logs: job.logs });
                }
            } catch (err) { console.error("Poll Error:", err); }
        }, 2000);
    };

    // ─── DESTROY ─────────────────────────────────────────────────────────────────
    const handleDestroy = async () => {
        try {
            setDestroyStatus('running');
            setShowDestroyConfirm(false);
            setLogs([]);
            persistState({ destroyStatus: 'running', logs: [] });

            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE}/workflow/deploy/terraform/destroy`, {
                workspace_id: workspaceId,
                provider: selectedProvider
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data.upgradeRequired) {
                toast.error('Upgrade to Pro to access Destroy Infrastructure');
                setDestroyStatus('idle');
                persistState({ destroyStatus: 'idle' });
                return;
            }

            const jobId = res.data.jobId;
            setDeployJobId(jobId);
            toast.success("Destroy operation started...");
            persistState({ deployJobId: jobId, destroyStatus: 'running' });
            startPollingDestroy(jobId);
        } catch (err) {
            console.error("Destroy error:", err);
            setDestroyStatus('failed');
            persistState({ destroyStatus: 'failed' });
            toast.error(err.response?.data?.error || "Failed to start destroy");
        }
    };

    const startPollingDestroy = (jobId) => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_BASE}/workflow/deploy/${jobId}/status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const job = res.data;
                setLogs(job.logs || []);
                if (job.status === 'completed') {
                    setDestroyStatus('success');
                    setDeployStatus('idle');
                    setLogs([]);
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    persistState({ destroyStatus: 'success', deployStatus: 'idle', logs: [], infra_provisioned: false });
                    toast.success("Infrastructure Destroyed");
                } else if (job.status === 'failed') {
                    setDestroyStatus('failed');
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    persistState({ destroyStatus: 'failed', logs: job.logs });
                    toast.error("Destroy Failed");
                } else {
                    persistState({ logs: job.logs });
                }
            } catch (err) { console.error("Poll Error:", err); }
        }, 2000);
    };

    // ─── RENDER ──────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-4xl mx-auto pb-24 animate-fade-in space-y-10">

            {/* ── PROVISION CARD ──────────────────────────────────────────── */}
            <div className={`glass-premium rounded-[2.5rem] border overflow-hidden shadow-2xl transition-all duration-500 ${deployStatus === 'success' ? 'border-emerald-500/30 shadow-emerald-500/5' : 'border-white/5'}`}>
                {/* Header */}
                <div className="px-10 py-10 border-b border-white/5 bg-gradient-to-r from-blue-500/10 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-700 shadow-lg ${deployStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10' : deployStatus === 'running' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-blue-500/10 animate-pulse' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                            {deployStatus === 'success' ? <CheckCircle2 size={32} /> : <Layers size={32} />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic tracking-tight">Infra <span className="text-blue-400">Provisioning</span></h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                Terraform Engine → {selectedProvider?.toUpperCase()} Node
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {deployStatus === 'idle' && <span className="px-5 py-2 bg-white/5 text-slate-400 text-[10px] font-black rounded-full border border-white/10 uppercase tracking-widest">Ready to Deploy</span>}
                        {deployStatus === 'running' && <span className="px-5 py-2 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-full border border-blue-500/20 uppercase tracking-widest animate-pulse flex items-center gap-2 shadow-inner"><RefreshCw size={12} className="animate-spin" /> Provisioning</span>}
                        {deployStatus === 'success' && <span className="px-5 py-2 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/20 uppercase tracking-widest flex items-center gap-2 shadow-inner"><CheckCircle2 size={12} /> Infrastructure Live</span>}
                        {deployStatus === 'failed' && <span className="px-5 py-2 bg-red-500/10 text-red-400 text-[10px] font-black rounded-full border border-red-500/20 uppercase tracking-widest">Failed</span>}
                    </div>
                </div>

                {/* Body */}
                <div className="p-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
                            Apply the generated Terraform configuration to create the necessary resources in your {selectedProvider} account.
                        </p>

                        {deployStatus === 'idle' && (
                            <button 
                                onClick={handleProvision} 
                                disabled={isDeployed}
                                className="btn-premium px-10 h-14 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                            >
                                <Rocket size={18} />
                                <span>{isDeployed ? 'Infrastructure Live' : 'Start Provisioning'}</span>
                            </button>
                        )}
                        {deployStatus === 'failed' && (
                            <button 
                                onClick={handleProvision} 
                                disabled={isDeployed}
                                className="px-8 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                <RefreshCw size={14} /> Retry
                            </button>
                        )}
                    </div>

                    {/* Terminal Logs */}
                    {(deployStatus !== 'idle' || logs.length > 0) && (
                        <div className="bg-[#0a0c10] rounded-2xl border border-white/5 overflow-hidden shadow-inner">
                            <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Terminal size={12} /> Terraform Output
                                </span>
                                {deployStatus === 'running' && <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
                            </div>
                            <div className="p-4 h-64 overflow-y-auto font-mono text-xs space-y-1 custom-scrollbar">
                                {logs.length === 0 && (
                                    <div className="text-slate-600 italic text-center py-10">Initializing Terraform runner...</div>
                                )}
                                {logs.map((log, i) => (
                                    <div key={i} className="text-slate-400 border-l-2 border-transparent pl-3 hover:bg-white/[0.02] hover:border-brand-500/30 py-0.5 transition-all">
                                        <span className="text-slate-700 mr-2 select-none">&gt;</span>{log.message}
                                    </div>
                                ))}
                                <div ref={logEndRef} />
                            </div>
                        </div>
                    )}

                    {/* Success Summary */}
                    {deployStatus === 'success' && (
                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl animate-fade-in">
                            <div className="flex items-center gap-3 mb-2">
                                <ShieldCheck size={18} className="text-emerald-400" />
                                <h4 className="font-bold text-emerald-400">Infrastructure Provisioned Successfully</h4>
                            </div>
                            <p className="text-sm text-slate-400">All cloud resources have been created. You can now proceed to deploy your application.</p>
                        </div>
                    )}

                    {/* Destroy Section */}
                    {(deployStatus === 'success' || deployStatus === 'failed') && (
                        <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h5 className="font-bold text-white flex items-center gap-2 text-sm">
                                        <Trash2 size={16} className="text-red-400" /> Destroy Infrastructure
                                    </h5>
                                    <p className="text-xs text-slate-500 mt-1">Remove all deployed resources</p>
                                </div>
                                {isPro ? (
                                    <button
                                        onClick={() => { setShowDestroyConfirm(true); setConfirmText(''); }}
                                        disabled={destroyStatus === 'running' || isDeployed}
                                        className="px-6 py-2.5 text-xs flex items-center gap-2 rounded-xl border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        {destroyStatus === 'running' ? <><RefreshCw size={14} className="animate-spin" /> Destroying...</> : <><Trash2 size={14} /> Destroy</>}
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-brand-500/20">Pro Only</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Destroy Dialog */}
            {showDestroyConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="glass-premium rounded-3xl p-8 max-w-md mx-4 shadow-2xl border border-red-500/20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                <AlertTriangle size={24} className="text-red-400" />
                            </div>
                            <h3 className="text-lg font-black text-white italic">Confirm Destroy</h3>
                        </div>
                        <div className="mb-6 space-y-3">
                            <label className="block text-sm text-slate-400">
                                To confirm, type <strong className="text-red-400">DELETE</strong> below:
                            </label>
                            <input
                                type="text"
                                className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-white focus:border-red-500/50 outline-none transition-all font-mono"
                                placeholder="DELETE"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowDestroyConfirm(false)} className="px-6 py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-xs hover:bg-white/10 transition-all">Cancel</button>
                            <button onClick={handleDestroy} disabled={confirmText !== 'DELETE'} className="px-6 py-3 bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-600 transition-all">Yes, Destroy</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── NAVIGATION ────────────────────────────────────────────── */}
            <div className="flex items-center justify-between pt-4">
                <button onClick={onBack} className="px-8 py-4 rounded-xl bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3">
                    <ArrowLeft size={16} /> Back to Connection
                </button>
                {deployStatus === 'success' && (
                    <button onClick={onComplete} className="btn-premium px-14 h-16 text-lg">
                        <span>Deploy Resources</span>
                        <ArrowRight size={22} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default DeployInfrastructureStep;
