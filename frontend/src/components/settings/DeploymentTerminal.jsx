import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Copy, CheckCircle2, XCircle, Clock, Hash, ChevronRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';

const DeploymentTerminal = ({ deploymentId, onClose }) => {
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const terminalRef = useRef(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [deploymentId]);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [deployment?.logs, autoScroll]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/deploy/${deploymentId}/status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setDeployment(data);
    } catch (err) {
      console.error('Failed to fetch deployment status:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyLogs = () => {
    const logText = (deployment?.logs || []).map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(logText);
    toast.success('Logs copied to clipboard');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-emerald-400';
      case 'failed': return 'text-red-400';
      case 'running': return 'text-brand-400';
      default: return 'text-slate-400';
    }
  };

  return createPortal(
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-end justify-center p-4 md:p-8"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl h-[85vh] bg-[#0A0A0A] border border-white/10 rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-[0_-25px_50px_-12px_rgba(0,0,0,0.5)]"
      >
        {/* Visual Handle */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-white/10 rounded-full" />
        </div>

        {/* Terminal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              <div onClick={onClose} className="w-3 h-3 rounded-full bg-red-500/50 hover:bg-red-500 cursor-pointer transition-colors" />
              <div className="w-3 h-3 rounded-full bg-amber-500/50 hover:bg-amber-500 cursor-pointer transition-colors" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50 hover:bg-emerald-500 cursor-pointer transition-colors" />
            </div>
            <div className="h-4 w-px bg-white/10 mx-2" />
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-slate-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deployment: {deploymentId}</span>
              {deployment && (
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-bold ${getStatusColor(deployment.status)} uppercase tracking-tighter ml-2`}>
                  {deployment.status === 'running' && <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                  {deployment.status}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={copyLogs}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
            >
              <Copy size={12} /> Copy Logs
            </button>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <XCircle size={18} />
            </button>
          </div>
        </div>

        {/* Deployment Info Bar */}
        {deployment && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-6 py-4 border-b border-white/5 bg-white/[0.01]">
            <div>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Status</p>
              <p className={`text-[11px] font-bold uppercase ${getStatusColor(deployment.status)}`}>
                {deployment.status === 'success' ? 'Ready' : deployment.status === 'failed' ? 'Error' : 'Building'}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Trigger</p>
              <p className="text-[11px] text-slate-300 font-bold uppercase">{deployment.source_type}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Created At</p>
              <p className="text-[11px] text-slate-300 font-bold">{new Date(deployment.created_at).toLocaleString()}</p>
            </div>
            {deployment.url && (
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Live URL</p>
                <a href={deployment.url} target="_blank" rel="noreferrer" className="text-[11px] text-brand-400 hover:underline font-bold truncate block">
                  {deployment.url}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Terminal Body */}
        <div 
          ref={terminalRef}
          className="flex-1 overflow-y-auto p-6 font-mono text-xs leading-relaxed bg-black selection:bg-brand-500/30"
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
          }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600 italic">
               <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
               <p>Connecting to build stream...</p>
            </div>
          ) : (deployment?.logs || []).length === 0 ? (
            <div className="flex items-center gap-2 text-slate-600 italic">
              <ChevronRight size={14} className="text-brand-500" />
              <span>Initialising deployment sequence...</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {deployment.logs.map((log, i) => (
                <div key={i} className="flex gap-4 group">
                  <span className="text-slate-700 select-none w-20 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                  </span>
                  <span className={`
                    ${log.message.includes('✅') || log.message.includes('success') ? 'text-emerald-400' : ''}
                    ${log.message.includes('❌') || log.message.includes('failed') || log.message.includes('Error') ? 'text-red-400' : ''}
                    ${log.message.includes('🚀') || log.message.includes('Starting') ? 'text-brand-400' : ''}
                    ${!log.message.includes('✅') && !log.message.includes('❌') && !log.message.includes('🚀') ? 'text-slate-300' : ''}
                  `}>
                    {log.message}
                  </span>
                </div>
              ))}
              {deployment.status === 'running' && (
                <div className="flex gap-4">
                  <span className="text-slate-700 select-none w-20 flex-shrink-0">--:--:--</span>
                  <span className="text-brand-400 animate-pulse">▋</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1 text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                <div className={`w-1.5 h-1.5 rounded-full ${autoScroll ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                Auto-scroll {autoScroll ? 'On' : 'Off'}
             </div>
          </div>
          <div className="text-[9px] text-slate-700 font-black uppercase tracking-[0.2em]">
             Cloudiverse CI/CD Pipeline v2.1
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default DeploymentTerminal;
