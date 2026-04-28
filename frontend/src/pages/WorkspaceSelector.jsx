import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Clock,
  Search,
  Layers,
  ChevronRight,
  TrendingUp,
  Box,
  Zap,
  Loader2,
  ArrowRight,
  Filter,
  MoreVertical,
  Activity,
  Globe,
  Database,
  Cloud,
  Settings,
  Trash2,
  Download,
  Share2,
  LayoutDashboard,
  Link as LinkIcon,
  MessageCircle,
  Mail,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import ShareModal from '../components/ShareModal';
import NetworkBackground from '../components/NetworkBackground';

const WorkspaceSelector = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [shareModalWs, setShareModalWs] = useState(null);
  const [activeTab, setActiveTab] = useState('services');
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'activity') setActiveTab('activity');
    else setActiveTab('services');
  }, [location]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  useEffect(() => {
    fetchWorkspaces();
    fetchActivityLogs();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/workspaces`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setWorkspaces(response.data.map(ws => {
        let parsedState = ws.state_json || {};
        try { if (typeof parsedState === 'string') parsedState = JSON.parse(parsedState); }
        catch (e) { parsedState = {}; }
        return { ...ws, state_json: parsedState };
      }));
    } catch (err) {
      if (err.response?.status === 401) { navigate('/login'); }
    } finally { setLoading(false); }
  };

  const fetchActivityLogs = async () => {
    try {
      setActivityLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/analytics/audit?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setActivityLogs((response.data.logs || []).filter(log => log.action !== 'CONFIGURATION_UPDATED'));
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleDeleteProject = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/workspaces/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Project deleted successfully');
      setWorkspaces(workspaces.filter(ws => ws.id !== id));
      setOpenMenuId(null);
      window.dispatchEvent(new CustomEvent('add-notification', {
        detail: {
          title: 'Project Deleted',
          message: 'The project and its configurations have been permanently removed.'
        }
      }));
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  const handleToggleLive = async (e, ws) => {
    e.stopPropagation();
    const newLiveStatus = !ws.state_json?.is_live;

    // Update local state immediately for UI responsiveness
    const updatedWorkspaces = workspaces.map(w => {
      if (w.id === ws.id) {
        return {
          ...w,
          state_json: { ...w.state_json, is_live: newLiveStatus }
        };
      }
      return w;
    });
    setWorkspaces(updatedWorkspaces);

    try {
      const token = localStorage.getItem('token');
      const newState = { ...ws.state_json, is_live: newLiveStatus };

      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/workspaces/${ws.id}`, {
        state_json: newState
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      toast.success(`Deployment is now ${newLiveStatus ? 'Live' : 'Paused'}`);

      window.dispatchEvent(new CustomEvent('add-notification', {
        detail: {
          title: newLiveStatus ? 'System Live' : 'System Offline',
          message: `Service "${ws.name}" has been ${newLiveStatus ? 'activated' : 'deactivated'} successfully.`
        }
      }));
    } catch (err) {
      toast.error('Failed to update status');
      // Revert local state on error
      fetchWorkspaces();
    }
  };

  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter(ws => {
      const matchesSearch = ws.name.toLowerCase().includes(searchTerm.toLowerCase());
      const isDeployed = ws.step === 'deployed' || ws.step === 'deployment_summary' || ws.state_json?.is_deployed === true;
      if (filterStatus === 'live') return matchesSearch && isDeployed && ws.state_json?.is_live;
      if (filterStatus === 'not_deployed') return matchesSearch && !isDeployed;
      return matchesSearch;
    });
  }, [workspaces, searchTerm, filterStatus]);

  const stats = [
    { label: 'Total Services', value: workspaces.length, color: 'text-brand-400' },
    { label: 'Active Clusters', value: workspaces.filter(w => w.state_json?.is_live).length, color: 'text-green-400' },
  ];

  const formatAction = (action) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getActionIcon = (action) => {
    const a = action.toLowerCase();
    if (a.includes('deployment')) return <Zap size={14} className="text-emerald-400" />;
    if (a.includes('architecture')) return <Layers size={14} className="text-blue-400" />;
    if (a.includes('configuration') || a.includes('update')) return <Settings size={14} className="text-brand-400" />;
    if (a.includes('workspace') || a.includes('project')) return <Box size={14} className="text-brand-400" />;
    if (a.includes('login') || a.includes('auth')) return <Activity size={14} className="text-yellow-400" />;
    if (a.includes('deleted')) return <Trash2 size={14} className="text-red-400" />;
    return <Clock size={14} className="text-slate-400" />;
  };

  const getProviderIcon = (ws) => {
    const provider = ws.state_json?.selectedProvider?.toLowerCase() || 'aws';
    if (provider.includes('aws')) return <Cloud size={16} className="text-orange-400" />;
    if (provider.includes('azure')) return <Cloud size={16} className="text-blue-400" />;
    return <Globe size={16} className="text-brand-400" />;
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      <NetworkBackground opacity={0.7} centerClearance={0.5} />

      {/* Beta Phase Warning */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-500/10 border border-amber-500/20 rounded-[1.5rem] p-5 flex items-center gap-4 shadow-xl shadow-amber-900/5"
      >
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/20">
          <Zap size={20} />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Infrastructure Beta Program</h4>
          <p className="text-xs text-amber-200/70 font-bold leading-relaxed italic">
            &quot;Cloudiverse is currently in beta phase. Deployment systems are optimized for **Static Site** architectures. Extended cloud patterns are currently under calibration.&quot;
          </p>
        </div>
      </motion.div>
      {/* Top Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-1">Services</h1>
          <div className="flex items-center gap-4">
            {stats.map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.label}:</span>
                <span className={`text-xs font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 bg-white/5 rounded-xl border border-white/5 mr-4">
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'services' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Services
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'activity' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Activity Log
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:border-brand-500/50 outline-none transition-all w-[240px]"
            />
          </div>
          <button
            onClick={() => navigate('/workspaces/new')}
            className="btn-premium px-5 py-2 text-xs"
          >
            <Plus size={16} />
            <span>New Service</span>
          </button>
        </div>
      </div>

      {/* Services List (Real SaaS Design) */}
      <div className="space-y-4">
        <div className="hidden md:grid grid-cols-12 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
          <div className="col-span-5">Service Name</div>
          <div className="col-span-2 text-center">Provider</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-right">Last Modified</div>
          <div className="col-span-1"></div>
        </div>

        <AnimatePresence mode="popLayout">
          {activeTab === 'services' ? (
            <>
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="py-24 flex flex-col items-center gap-4 glass-card rounded-3xl"
                >
                  <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Syncing Intelligence...</span>
                </motion.div>
              ) : filteredWorkspaces.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  className="py-20 text-center glass-premium border-dashed border-white/5 rounded-[2.5rem]"
                >
                  <Box className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No services active</h3>
                  <p className="text-slate-500 text-sm mb-8">Ready to deploy your next high-performance cloud stack?</p>
                </motion.div>
              ) : (
                filteredWorkspaces.map((ws, i) => {
                  const isLive = ws.state_json?.is_live;
                  const isDeployed = ws.step === 'deployed' || ws.step === 'deployment_summary' || ws.state_json?.is_deployed || ws.deployment_status === 'DEPLOYED';

                  return (
                    <motion.div
                      key={ws.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => navigate(`/workspaces/${ws.id}`)}
                      className={`group cursor-pointer relative ${openMenuId === ws.id ? 'z-50' : 'z-10'}`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 px-6 py-5 glass-card rounded-2xl border-white/[0.03] hover:border-brand-500/30 hover:bg-white/[0.02] transition-all duration-300">
                        {/* Name & Desc */}
                        <div className="col-span-5 flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isLive ? 'bg-green-500/10 text-green-400' : 'bg-brand-500/10 text-brand-400'} group-hover:scale-110`}>
                            <Box size={20} />
                          </div>
                          <div className="overflow-hidden">
                            <h3 className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors truncate">{ws.name}</h3>
                            <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">{ws.description}</p>
                          </div>
                        </div>

                        {/* Provider */}
                        <div className="col-span-2 flex justify-center">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                            {getProviderIcon(ws)}
                            <span className="text-[10px] font-black uppercase tracking-tight text-slate-300">
                              {ws.state_json?.selectedProvider || 'AWS'}
                            </span>
                          </div>
                        </div>

                        {/* Status Toggle / Deployment Badge */}
                        <div className="col-span-2 flex justify-center">
                          {isDeployed ? (
                            <div
                              onClick={(e) => handleToggleLive(e, ws)}
                              className="flex items-center gap-3 cursor-pointer group/toggle p-2 hover:bg-white/5 rounded-xl transition-all"
                              title={isLive ? 'Service is Live - Click to Pause' : 'Service is Paused - Click to Resume'}
                            >
                              <div className={`relative w-12 h-6 rounded-full transition-all duration-500 ${isLive ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-800'}`}>
                                <motion.div
                                  animate={{ x: isLive ? 28 : 4 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                                />
                              </div>
                              <span className={`text-[9px] font-black uppercase tracking-widest hidden lg:block ${isLive ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {isLive ? 'Live' : 'Paused'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
                              <Activity size={12} className="animate-pulse" />
                              <span className="text-[10px] font-black uppercase tracking-tight">Draft</span>
                            </div>
                          )}
                        </div>

                        {/* Meta & Date */}
                        <div className="col-span-2 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-slate-400">{new Date(ws.updated_at).toLocaleDateString()}</span>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5">Updated</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex justify-end relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === ws.id ? null : ws.id); }}
                            className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-600 hover:text-white transition-colors focus:outline-none"
                          >
                            <MoreVertical size={16} />
                          </button>

                          <AnimatePresence>
                            {openMenuId === ws.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.1 }}
                                className="absolute right-0 top-10 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-1"
                              >
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate(`/workspaces/${ws.id}`); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                  <LayoutDashboard size={14} className="text-slate-500" /> View Project
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate(`/workspaces/${ws.id}/settings`); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                  <Settings size={14} className="text-slate-500" /> Settings
                                </button>

                                {isDeployed && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/report-download/${ws.id}`); setOpenMenuId(null); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                  >
                                    <Download size={14} className="text-slate-500" /> Download Report
                                  </button>
                                )}

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    setShareModalWs(ws);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                  <Share2 size={14} className="text-slate-500" /> Share Project Diagram
                                </button>

                                <div className="h-px bg-white/5 my-1" />

                                <button
                                  onClick={(e) => handleDeleteProject(e, ws.id)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                >
                                  <Trash2 size={14} /> Delete Project
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </>
          ) : (
            <div className="space-y-3">
              {activityLoading ? (
                <div className="py-24 flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Retrieving Logs...</span>
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="py-20 text-center glass-card rounded-3xl border-dashed border-white/5">
                  <Activity className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 text-sm">No recent activity detected.</p>
                </div>
              ) : (
                activityLogs.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center justify-between p-4 glass-card rounded-xl border-white/[0.03] hover:bg-white/[0.02] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        {getActionIcon(log.action)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{formatAction(log.action)}</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">
                          {log.workspace_name ? `Project: ${log.workspace_name}` : log.workspace_id ? `Project ID: ${log.workspace_id}` : 'General Action'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5">
                        {new Date(log.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {!!shareModalWs && (
          <ShareModal
            isOpen={true}
            onClose={() => setShareModalWs(null)}
            workspaceId={shareModalWs?.id}
            architectureData={shareModalWs?.state_json?.architectureData || shareModalWs?.state_json?.architecture_data}
            provider={shareModalWs?.state_json?.selectedProvider || shareModalWs?.state_json?.selected_provider || 'AWS'}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceSelector;
