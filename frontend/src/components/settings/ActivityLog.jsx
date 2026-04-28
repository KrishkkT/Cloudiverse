import React, { useState, useEffect } from 'react';
import { Activity, Clock, User, Shield, Zap, Database, Settings, Rocket, CheckCircle2, XCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const ActivityLog = ({ workspaceId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/settings/${workspaceId}/activities`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [workspaceId]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'WORKSPACE_CREATE': return <Zap className="text-brand-400" />;
      case 'WORKSPACE_UPDATE': return <Settings className="text-slate-400" />;
      case 'DEPLOYMENT_STARTED': return <Rocket className="text-blue-400" />;
      case 'ENV_VARS_UPDATE': return <Database className="text-amber-400" />;
      case 'INFRA_PROVISIONED': return <CheckCircle2 className="text-emerald-400" />;
      default: return <Info className="text-slate-500" />;
    }
  };

  const getActionLabel = (action) => {
    return action.replace(/_/g, ' ');
  };

  if (loading && activities.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scanning timeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white italic">Activity Stream</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Real-time audit log of project operations</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-white/5" />

        <div className="space-y-6 relative z-10">
          {activities.length === 0 ? (
            <div className="ml-12 p-12 border-2 border-dashed border-white/5 rounded-3xl text-center">
              <p className="text-sm text-slate-600 italic">No activity recorded yet.</p>
            </div>
          ) : (
            activities.map((activity, i) => (
              <div key={activity.id} className="flex gap-6 group">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-lg transition-transform group-hover:scale-110">
                  {getActionIcon(activity.action)}
                </div>

                <div className="flex-1 p-5 glass-card rounded-2xl border-white/[0.03] hover:border-white/10 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      {getActionLabel(activity.action)}
                    </h3>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                      <Clock size={12} /> {new Date(activity.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-400">
                    {activity.details?.name && <span>Project: <strong className="text-white">{activity.details.name}</strong> </span>}
                    {activity.details?.step && <span>Step: <strong className="text-brand-400 uppercase">{activity.details.step}</strong> </span>}
                    {activity.details?.count && <span>Modified <strong className="text-white">{activity.details.count}</strong> variables</span>}
                    {activity.details?.deploymentId && <span>Build ID: <strong className="text-mono text-blue-400">#{activity.details.deploymentId}</strong></span>}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                        <User size={10} /> System
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                        <Shield size={10} /> Verified
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
