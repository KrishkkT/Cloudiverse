import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Github,
    Rocket,
    Lock,
    Copy,
    Check,
    Info,
    GitBranch,
    ShieldCheck,
    Terminal,
    ExternalLink,
    Zap,
    Globe
} from 'lucide-react';

const CICDConfiguration = ({ workspaceId, initialConfig }) => {
    const [repoUrl, setRepoUrl] = useState(initialConfig?.repo_url || '');
    const [branch, setBranch] = useState(initialConfig?.ci_config?.branch || 'main');
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState(initialConfig?.ci_config || null);
    const [copied, setCopied] = useState(null);

    const handleSetup = async (e) => {
        e.preventDefault();
        if (!repoUrl) return toast.error('Repository URL is required');

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const res = await fetch(`${baseUrl}/api/ci/setup/${workspaceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ repoUrl, branch })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Setup failed');

            toast.success('CI/CD Pipeline Synchronized!');
            setConfig({
                ...config,
                webhook_secret: data.secrets.webhook_secret,
                ci_token: data.secrets.ci_token,
                repo_full_name: repoUrl.replace('https://github.com/', ''),
                enabled: true
            });
        } catch (err) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
        toast.info('Credential Sequestered', { autoClose: 1000 });
    };

    return (
        <div className="glass-premium rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative group">
            <div className="px-10 py-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 border border-brand-500/20">
                        <Rocket size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white italic">Neural CI/CD</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Automation Engine</p>
                    </div>
                </div>
                {config?.enabled && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <ShieldCheck size={12} /> Active Pipeline
                    </div>
                )}
            </div>

            <div className="p-10 space-y-10">
                {!config?.enabled ? (
                    <form onSubmit={handleSetup} className="space-y-10">
                        <div className="p-8 bg-brand-500/[0.03] border border-brand-500/10 rounded-[2rem] flex flex-col md:flex-row gap-8 items-center">
                            <div className="w-20 h-20 rounded-[1.5rem] bg-brand-500/10 flex items-center justify-center text-brand-400 border border-brand-500/20 shrink-0 shadow-lg shadow-brand-500/5">
                                <Zap size={40} className="animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic mb-2">Automate Your Deployments</h3>
                                <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                                    Connect your GitHub repository to enable high-fidelity automated deployments.
                                    Our orchestration engine will monitor your branch for secure production pushes and synchronize changes instantly with zero-downtime potential.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">
                                    <Github size={12} /> Repository Endpoint
                                </label>
                                <input
                                    type="url"
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                    placeholder="https://github.com/user/repo"
                                    className="w-full px-8 py-5 bg-white/[0.02] border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50 transition-all text-white font-bold placeholder-slate-700 outline-none shadow-inner"
                                    required
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">
                                    <GitBranch size={12} /> Target Branch
                                </label>
                                <input
                                    type="text"
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                    placeholder="main"
                                    className="w-full px-8 py-5 bg-white/[0.02] border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50 transition-all text-white font-bold placeholder-slate-700 outline-none shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="pt-4 text-white border-t border-white/5">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-premium px-12 h-16 w-full md:w-auto"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-3 text-white border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Rocket size={20} className="text-white" />
                                )}
                                <span className='text-white'> {loading ? 'Initializing Pipeline...' : 'Authorize Automation'}</span>
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-10 animate-fade-in">
                        {/* Active Status Card */}
                        <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-[2rem] gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                                    <ShieldCheck size={28} />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-emerald-100 italic">Neural Pipeline Active</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Secure Handshake Established</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, enabled: false })}
                                className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all border border-white/5 hover:border-white/20 rounded-xl"
                            >
                                Reconfigure Pipeline
                            </button>
                        </div>

                        {/* Credentials Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 bg-white/[0.01] rounded-3xl border border-white/5 relative group/card overflow-hidden">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mb-6 block px-1">Webhook Secret Key</label>
                                <div className="flex items-center justify-between gap-4 relative z-10">
                                    <code className="text-sm font-mono text-brand-400 truncate bg-brand-500/5 px-4 py-3 rounded-xl border border-brand-500/10 flex-1">
                                        {config.webhook_secret ? '••••••••••••••••••••••••' : 'Unauthorized'}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(config.webhook_secret, 'secret')}
                                        className="p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 shadow-lg active:scale-90"
                                    >
                                        {copied === 'secret' ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5 text-slate-500" />}
                                    </button>
                                </div>
                                <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                    <Lock size={120} className="text-white" />
                                </div>
                            </div>

                            <div className="p-8 bg-white/[0.01] rounded-3xl border border-white/5 relative group/card overflow-hidden">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mb-6 block px-1">Neural Access Token</label>
                                <div className="flex items-center justify-between gap-4 relative z-10">
                                    <code className="text-sm font-mono text-brand-400 truncate bg-brand-500/5 px-4 py-3 rounded-xl border border-brand-500/10 flex-1">
                                        {config.ci_token ? '••••••••••••••••••••••••' : 'Unauthorized'}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(config.ci_token, 'token')}
                                        className="p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 shadow-lg active:scale-90"
                                    >
                                        {copied === 'token' ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5 text-slate-500" />}
                                    </button>
                                </div>
                                <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                    <Terminal size={120} className="text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Webhook Endpoint Section */}
                        <div className="pt-6 space-y-6">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">
                                <Globe size={12} /> Universal Webhook Endpoint
                            </label>
                            <div className="flex flex-col md:flex-row items-center gap-4 p-6 bg-slate-950/50 rounded-3xl border border-white/5 group/url shadow-inner">
                                <code className="flex-1 text-xs font-mono text-slate-400 break-all md:truncate px-2">
                                    {`${import.meta.env.VITE_API_BASE_URL}/api/ci/webhook`}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(`${import.meta.env.VITE_API_BASE_URL}/api/ci/webhook`, 'url')}
                                    className="w-full md:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {copied === 'url' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-slate-500" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Copy URL</span>
                                </button>
                            </div>
                            <div className="flex items-start gap-3 px-2">
                                <Info size={14} className="text-brand-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-medium text-slate-600 leading-relaxed">
                                    Deploy this endpoint to your GitHub repository webhook settings. Ensure the payload format is set to <span className="text-slate-400 font-bold italic">application/json</span> for optimal synchronization.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CICDConfiguration;
