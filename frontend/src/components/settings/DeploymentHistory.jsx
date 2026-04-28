import React, { useState, useEffect } from 'react';
import { History, Rocket, CheckCircle2, XCircle, Clock, ExternalLink, Hash, GitBranch, Terminal, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DeploymentTerminal from './DeploymentTerminal';

const DeploymentHistory = ({ workspaceId, ciConfig }) => {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState(null);

  const isCiActive = ciConfig?.enabled === true;

  const fetchDeployments = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/deploy/workspace/${workspaceId}`, {
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
    const interval = setInterval(fetchDeployments, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [workspaceId]);

  if (loading && deployments.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loading Pipeline History...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white italic">Deployment Pipeline</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Audit log of all infrastructure and application changes</p>
        </div>
        {isCiActive ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Neural Pipeline Active
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            Automation Inactive
          </div>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-white/5" />

        <div className="space-y-6 relative z-10">
          {deployments.length === 0 ? (
            <div className="ml-12 p-12 border-2 border-dashed border-white/5 rounded-3xl text-center">
              <p className="text-sm text-slate-600 italic">No deployments found for this workspace.</p>
            </div>
          ) : (
            deployments.map((deploy, i) => (
              <div key={deploy.id} className="flex gap-6 group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform group-hover:scale-110 ${deploy.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    deploy.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  }`}>
                  {deploy.status === 'running' ? (
                    <div className="relative">
                      <Rocket size={20} className="animate-bounce" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-brand-500 rounded-full animate-ping" />
                    </div>
                  ) : deploy.status === 'success' ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <XCircle size={20} />
                  )}
                </div>

                <div
                  onClick={() => setSelectedDeploymentId(deploy.id)}
                  className="flex-1 p-5 glass-card rounded-2xl border-white/[0.03] hover:border-brand-500/30 transition-all cursor-pointer relative group/card overflow-hidden"
                >
                  {/* Background ID Glow */}
                  <div className="absolute -right-4 -top-4 text-[60px] font-black text-white/[0.02] select-none italic pointer-events-none">
                    #{deploy.id.toString().slice(-4)}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 relative z-10">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className={`text-sm font-black uppercase tracking-wider italic ${deploy.status === 'success' ? 'text-emerald-400' :
                            deploy.status === 'failed' ? 'text-red-400' : 'text-brand-400'
                          }`}>
                          {deploy.status.replace(/_/g, ' ')}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-600">ID: {deploy.id}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                          <Clock size={12} /> {new Date(deploy.created_at).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-brand-400/60 font-bold uppercase tracking-widest">
                          <Hash size={12} /> {deploy.source_type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-brand-500/10 border border-white/5 hover:border-brand-500/20 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-400 transition-all"
                      >
                        <Terminal size={12} /> View Details
                      </button>
                      {deploy.url && deploy.status === 'success' && (
                        <a
                          href={deploy.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-400 transition-all"
                        >
                          <ExternalLink size={12} /> Live
                        </a>
                      )}
                    </div>
                  </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Environment</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Production</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Type</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{deploy.source_type === 'github' ? 'CI/CD Pipeline' : 'Manual Push'}</span>
                        </div>
                        {deploy.config?.branch && (
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Branch</span>
                            <div className="flex items-center gap-1">
                              <GitBranch size={10} className="text-brand-400/50" />
                              <span className="text-[10px] text-brand-400 font-bold">{deploy.config.branch}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {deploy.config?.repoUrl && (
                        <div className="hidden md:block">
                           <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest text-right">Source</span>
                            <span className="text-[9px] text-slate-500 font-mono truncate max-w-[200px]">{deploy.config.repoUrl.replace('https://github.com/', '')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                </div>
              </div>
            ))
          )}
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

      {deployments.length > 5 && (
        <div className="flex justify-center">
          <button className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-white transition-all">
            Load Full Pipeline History
          </button>
        </div>
      )}
    </div>
  );
};

export default DeploymentHistory;
