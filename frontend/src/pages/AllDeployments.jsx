import React, { useState, useEffect } from 'react';
import { History, Rocket, CheckCircle2, XCircle, Clock, ExternalLink, Hash, GitBranch, Terminal, ChevronRight, Activity, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DeploymentTerminal from '../components/settings/DeploymentTerminal';
import { Link } from 'react-router-dom';

const AllDeployments = () => {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDeployments = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/deploy/all`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setDeployments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch deployments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
    const interval = setInterval(fetchDeployments, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  const filteredDeployments = deployments.filter(d => 
    d.workspace_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.id.toString().includes(searchTerm)
  );

  if (loading && deployments.length === 0) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-brand-500/10 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Aggregating Global Pipeline Data...</p>
        </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-10 space-y-10 animate-fade-in pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-brand-500/10 rounded-lg text-brand-400">
                    <Activity size={24} />
                </div>
                <h1 className="text-3xl font-black text-white italic tracking-tighter">Global Deployments</h1>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Real-time status across all active projects</p>
        </div>

        <div className="relative group w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={18} />
            <input 
                type="text" 
                placeholder="Search by project or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white/[0.02] border border-white/10 rounded-2xl focus:border-brand-500/50 outline-none text-white font-bold transition-all"
            />
        </div>
      </div>

      <div className="glass-premium rounded-[2.5rem] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Project</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Environment</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Created</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {filteredDeployments.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="px-8 py-20 text-center text-slate-600 italic">
                                No deployments found matching your filters.
                            </td>
                        </tr>
                    ) : (
                        filteredDeployments.map((deploy) => (
                            <tr key={deploy.id} className="group hover:bg-white/[0.01] transition-colors">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                            deploy.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                                            deploy.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                                            'bg-brand-500/10 text-brand-400'
                                        }`}>
                                            {deploy.status === 'running' ? <Rocket size={14} className="animate-bounce" /> : 
                                             deploy.status === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                            deploy.status === 'success' ? 'text-emerald-400' :
                                            deploy.status === 'failed' ? 'text-red-400' : 'text-brand-400'
                                        }`}>
                                            {deploy.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <Link to={`/workspaces/${deploy.workspace_id}/settings?tab=deployments`} className="text-sm font-bold text-white hover:text-brand-400 transition-colors">
                                            {deploy.workspace_name}
                                        </Link>
                                        <span className="text-[10px] text-slate-600 font-mono">#{deploy.id}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest border border-blue-500/20">Production</span>
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{deploy.source_type}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="text-[10px] text-slate-400 font-bold">{new Date(deploy.created_at).toLocaleString()}</span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => setSelectedDeploymentId(deploy.id)}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-brand-500/10 border border-white/5 hover:border-brand-500/20 text-slate-400 hover:text-brand-400 transition-all"
                                            title="View Terminal Logs"
                                        >
                                            <Terminal size={14} />
                                        </button>
                                        {deploy.url && (
                                            <a 
                                                href={deploy.url} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-all"
                                                title="Visit Site"
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedDeploymentId && (
            <DeploymentTerminal 
                deploymentId={selectedDeploymentId} 
                onClose={() => setSelectedDeploymentId(null)} 
            />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AllDeployments;
