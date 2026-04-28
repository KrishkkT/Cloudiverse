import React, { useState } from 'react';
import { Plus, Trash2, Shield, EyeOff, Eye, Save, Search, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const EnvironmentVariables = ({ workspaceId, initialVars = {}, onSave }) => {
  const [vars, setVars] = useState(
    Object.entries(initialVars).map(([key, value]) => ({ key, value, isNew: false, isSecret: key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') || key.toLowerCase().includes('token') }))
  );
  const [showValues, setShowValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRedeployPrompt, setShowRedeployPrompt] = useState(false);

  const toggleShow = (key) => {
    setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAdd = () => {
    setVars([...vars, { key: '', value: '', isNew: true, isSecret: false }]);
  };

  const handleRemove = (index) => {
    setVars(vars.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, val) => {
    const newVars = [...vars];
    newVars[index][field] = val;
    
    // Auto-detect secret
    if (field === 'key') {
        const k = val.toLowerCase();
        newVars[index].isSecret = k.includes('secret') || k.includes('key') || k.includes('token') || k.includes('password');
    }
    
    setVars(newVars);
  };

  const handleSave = async () => {
    // Validate
    const invalid = vars.find(v => !v.key.trim() || !v.value.trim());
    if (invalid) {
      toast.error('All variables must have a key and a value');
      return;
    }

    setIsSaving(true);
    try {
      const payload = vars.reduce((acc, v) => {
        acc[v.key.trim()] = v.value.trim();
        return acc;
      }, {});
      
      await onSave(payload);
      toast.success('Environment variables updated successfully');
      setVars(vars.map(v => ({ ...v, isNew: false })));
      setShowRedeployPrompt(true);
    } catch (err) {
      toast.error('Failed to update environment variables');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRedeploy = async () => {
    setIsSaving(true);
    try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/deploy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                workspace_id: workspaceId,
                source: 'github', // Default to github for CI/CD
                config: { trigger: 'env_update' }
            })
        });
        const data = await res.json();
        if (data.deploymentId) {
            toast.success('Redeployment started!');
            // Redirect to deployment tab (this depends on parent state, but we can try to find the tab switcher)
            const deployTab = document.querySelector('[data-tab="deployments"]');
            if (deployTab) deployTab.click();
            setShowRedeployPrompt(false);
        }
    } catch (e) {
        toast.error('Failed to trigger redeployment');
    } finally {
        setIsSaving(false);
    }
  };

  const filteredVars = vars.filter(v => v.key.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white italic">Environment Variables</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Configure runtime configuration and secrets</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input 
                    type="text"
                    placeholder="Search variables..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-300 focus:border-brand-500/50 outline-none w-48"
                />
            </div>
            <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
                <Plus size={14} /> Add Variable
            </button>
        </div>
      </div>

      <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
        <Shield size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-500/80 leading-relaxed italic">
          Variables are encrypted at rest using AES-256-CBC. Secrets are masked by default in the UI. 
          Use these for API keys, database credentials, and production configuration.
        </p>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredVars.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                <p className="text-sm text-slate-600 italic">No environment variables defined.</p>
            </div>
          ) : (
            filteredVars.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                layout
                className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl items-center hover:bg-white/[0.04] transition-all"
              >
                <div className="md:col-span-4">
                  <input
                    type="text"
                    value={v.key}
                    onChange={(e) => handleChange(i, 'key', e.target.value)}
                    placeholder="VARIABLE_NAME"
                    className="w-full bg-transparent border-none outline-none text-sm font-bold text-white placeholder-slate-700 font-mono"
                  />
                </div>
                <div className="md:col-span-6 relative">
                  <input
                    type={showValues[i] || !v.isSecret ? "text" : "password"}
                    value={v.value}
                    onChange={(e) => handleChange(i, 'value', e.target.value)}
                    placeholder="value"
                    className="w-full bg-transparent border-none outline-none text-sm text-slate-400 placeholder-slate-800 font-mono pr-10"
                  />
                  {v.isSecret && (
                    <button 
                      onClick={() => toggleShow(i)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:text-white text-slate-600 transition-colors"
                    >
                      {showValues[i] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </div>
                <div className="md:col-span-2 flex justify-end gap-2">
                  {v.isSecret && <div title="Secret Detected" className="p-2 text-amber-500/50"><Shield size={14} /></div>}
                  <button
                    onClick={() => handleRemove(i)}
                    className="p-2 hover:bg-red-500/10 text-slate-600 hover:text-red-400 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="pt-6 border-t border-white/5 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-premium px-8 h-12"
        >
          {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
          <span>{isSaving ? 'Syncing...' : 'Save Configuration'}</span>
        </button>
      </div>
      <AnimatePresence>
        {showRedeployPrompt && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-brand-500/10 border border-brand-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center text-brand-400">
                        <Rocket size={24} className="animate-bounce" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest italic">Apply Changes?</h4>
                        <p className="text-[10px] text-slate-400 font-bold max-w-md mt-1">
                            Environment variables have been updated in the cloud. To apply these to your live site, a new deployment is required.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => setShowRedeployPrompt(false)}
                        className="flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all"
                    >
                        Maybe Later
                    </button>
                    <button 
                        onClick={handleRedeploy}
                        className="flex-1 md:flex-none px-8 py-3 bg-brand-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-500/20"
                    >
                        Redeploy Now
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnvironmentVariables;
