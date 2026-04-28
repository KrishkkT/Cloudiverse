import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Database, 
  Settings, 
  Activity, 
  Shield, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Info, 
  Layout, 
  Zap,
  Server,
  Cloud,
  Lock,
  Search,
  ChevronRight
} from 'lucide-react';

const RequirementsStep = ({
  workspaceId,
  infraSpec,
  costEstimation,
  onNext,
  onBack,
  onRequirementsCaptured,
  isDeployed
}) => {
  const [requirements, setRequirements] = useState({
    nfr: {
      availability: '99.5',
      latency: 'medium',
      compliance: [],
      data_residency: '',
      cost_ceiling_usd: null,
      security_level: 'standard'
    },
    region: {
      primary_region: 'india',
      secondary_region: '',
      multi_region: false
    },
    data_classes: {},
    data_retention: {},
    deployment_strategy: 'rolling',
    downtime_allowed: true,
    observability: {
      logs: true,
      metrics: true,
      alerts: false
    }
  });

  const [activeTab, setActiveTab] = useState('region');

  const handleNFRChange = (field, value) => {
    setRequirements(prev => ({
      ...prev,
      nfr: { ...prev.nfr, [field]: value }
    }));
  };

  const handleRegionChange = (field, value) => {
    setRequirements(prev => ({
      ...prev,
      region: { ...prev.region, [field]: value }
    }));
  };

  const handleDeploymentStrategyChange = (strategy) => {
    setRequirements(prev => ({ ...prev, deployment_strategy: strategy }));
  };

  const handleObservabilityChange = (service, checked) => {
    setRequirements(prev => ({
      ...prev,
      observability: { ...prev.observability, [service]: checked }
    }));
  };

  const handleSubmit = () => {
    if (onRequirementsCaptured) {
      onRequirementsCaptured(requirements);
    }
    onNext();
  };

  const tabs = [
    { id: 'region', label: 'Primary Node', icon: Globe },
    { id: 'data', label: 'Storage Logic', icon: Database },
    { id: 'deployment', label: 'Release Flow', icon: Zap },
    { id: 'observability', label: 'Telemetry', icon: Activity }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-32 animate-fade-in relative">
      {isDeployed && (
        <div className="absolute inset-x-0 -top-6 z-50 flex justify-center pointer-events-none">
          <div className="bg-amber-500/10 border border-amber-500/20 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
            <Lock size={16} className="text-amber-500" />
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Read-Only Mode: Infrastructure Provisioned</span>
          </div>
        </div>
      )}

      <div className={`text-center space-y-4 mb-16 ${isDeployed ? 'opacity-50' : ''}`}>
        <h2 className="text-4xl font-black text-white italic tracking-tight">Requirement <span className="text-brand-400">Refinement</span></h2>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg">Fine-tune the AI-generated architecture to match your production constraints.</p>
      </div>

      <motion.fieldset 
        layout
        disabled={isDeployed} 
        className="space-y-12 disabled:opacity-50"
      >
        
        {/* Section 1: Geo-Spatial Configuration */}
        <section className="glass-panel rounded-[2.5rem] border-white/5 p-10 relative overflow-hidden group hover:border-brand-500/20 transition-all duration-500">
          <div className="absolute inset-0 bg-dot-grid opacity-10 pointer-events-none" />
          <div className="flex items-center gap-6 mb-10">
             <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 border border-brand-500/20 group-hover:scale-110 transition-transform">
                <Globe size={32} />
             </div>
             <div>
                <h3 className="text-2xl font-display font-black text-white italic">Geo-Spatial Configuration</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Select hardware relay points</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Primary Grid Region</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={requirements.region.primary_region}
                  onChange={(e) => handleRegionChange('primary_region', e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-12 py-4 text-sm text-white focus:outline-none focus:ring-2 ring-brand-500/20 appearance-none transition-all"
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">EU (Ireland)</option>
                  <option value="eu-central-1">EU (Frankfurt)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                  <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Failover Node (Optional)</label>
              <div className="relative">
                <Cloud className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={requirements.region.secondary_region}
                  onChange={(e) => handleRegionChange('secondary_region', e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-12 py-4 text-sm text-white focus:outline-none focus:ring-2 ring-brand-500/20 appearance-none transition-all"
                >
                  <option value="">No redundant failover</option>
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">EU (Ireland)</option>
                  <option value="eu-central-1">EU (Frankfurt)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center text-accent-purple">
                  <Zap size={18} />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-white">Global Availability Mesh</h4>
                  <p className="text-xs text-slate-500">Enable automated multi-region replication</p>
               </div>
            </div>
            <input
              type="checkbox"
              checked={requirements.region.multi_region}
              onChange={(e) => handleRegionChange('multi_region', e.target.checked)}
              className="w-6 h-6 rounded-lg bg-slate-900 border-white/10 accent-brand-500 cursor-pointer"
            />
          </div>
        </section>

        {/* Section 2: Storage Integrity */}
        <section className="glass-panel rounded-[2.5rem] border-white/5 p-10 relative overflow-hidden group hover:border-brand-500/20 transition-all duration-500">
          <div className="flex items-center gap-6 mb-10">
             <div className="w-16 h-16 rounded-2xl bg-accent-cyan/10 flex items-center justify-center text-accent-cyan border border-accent-cyan/20 group-hover:scale-110 transition-transform">
                <Database size={32} />
             </div>
             <div>
                <h3 className="text-2xl font-display font-black text-white italic">Storage Integrity</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Classify and protect asset silos</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { type: 'user_profiles', label: 'Identity Hub', desc: 'Secure storage for account credentials', icon: Server },
                { type: 'payment_data', label: 'Financial Vault', desc: 'PCI-compliant encrypted transaction streams', icon: Lock },
                { type: 'documents', label: 'Blob Storage', desc: 'Massive unstructured data objects', icon: Database },
                { type: 'logs', label: 'Event Streams', desc: 'Cold storage for application telemetry', icon: Activity }
              ].map(data => (
                <div key={data.type} className="glass-card p-6 rounded-2xl border-white/5 flex flex-col gap-4 group/card hover:bg-slate-900/60 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover/card:text-accent-cyan transition-colors">
                       <data.icon size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{data.label}</div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-1">{data.desc}</div>
                    </div>
                  </div>
                  <select
                    value={requirements.data_classes[data.type] || ''}
                    onChange={(e) => setRequirements(prev => ({
                      ...prev,
                      data_classes: { ...prev.data_classes, [data.type]: e.target.value }
                    }))}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:ring-1 ring-brand-500/50"
                  >
                    <option value="">Unclassified</option>
                    <option value="public">Public</option>
                    <option value="internal">Internal</option>
                    <option value="confidential">Confidential</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
              ))}
          </div>
        </section>

        {/* Section 3: Release Strategy */}
        <section className="glass-panel rounded-[2.5rem] border-white/5 p-10 relative overflow-hidden group hover:border-brand-500/20 transition-all duration-500">
          <div className="flex items-center gap-6 mb-10">
             <div className="w-16 h-16 rounded-2xl bg-accent-purple/10 flex items-center justify-center text-accent-purple border border-accent-purple/20 group-hover:scale-110 transition-transform">
                <Zap size={32} />
             </div>
             <div>
                <h3 className="text-2xl font-display font-black text-white italic">Release Strategy</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Initialize production deployment logic</p>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: 'rolling', label: 'Rolling', desc: 'Secure incremental updates', icon: Activity },
              { value: 'blue-green', label: 'B/G Sync', desc: 'Zero-downtime hot swap', icon: Layout },
              { value: 'canary', label: 'Canary', desc: 'Subset traffic verification', icon: Search },
              { value: 'batch', label: 'Hard Batch', desc: 'High-speed total reload', icon: Zap }
            ].map(strategy => (
              <div
                key={strategy.value}
                onClick={() => !isDeployed && handleDeploymentStrategyChange(strategy.value)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center gap-4 ${
                  requirements.deployment_strategy === strategy.value
                  ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10'
                  : 'border-white/5 bg-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10 hover:bg-white/10'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${requirements.deployment_strategy === strategy.value ? 'bg-brand-500 text-white' : 'bg-slate-900 text-slate-600'}`}>
                   <strategy.icon size={24} />
                </div>
                <div>
                    <div className={`text-xs font-black uppercase tracking-widest ${requirements.deployment_strategy === strategy.value ? 'text-white' : ''}`}>{strategy.label}</div>
                    <div className="text-[10px] leading-tight mt-1 opacity-60">{strategy.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-8 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-6">
             <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mt-1 flex-shrink-0">
                <Info size={24} />
             </div>
             <div>
                <h4 className="text-lg font-bold text-blue-200">Architect Advice</h4>
                <p className="text-sm text-blue-200/60 leading-relaxed mt-1">
                   For production-grade clusters, we recommend <strong>B/G Sync</strong> or <strong>Canary</strong> releases to ensure non-disruptive availability across global nodes.
                </p>
             </div>
          </div>
        </section>

        {/* Section 4: Telemetry & Insights */}
        <section className="glass-panel rounded-[2.5rem] border-white/5 p-10 relative overflow-hidden group hover:border-brand-500/20 transition-all duration-500">
          <div className="flex items-center gap-6 mb-10">
             <div className="w-16 h-16 rounded-2xl bg-accent-green/10 flex items-center justify-center text-accent-green border border-accent-green/20 group-hover:scale-110 transition-transform">
                <Activity size={32} />
             </div>
             <div>
                <h3 className="text-2xl font-display font-black text-white italic">Telemetry & Insights</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Activate real-time system monitoring</p>
             </div>
          </div>

          <div className="space-y-4">
            {[
              { id: 'logs', label: 'Logic Trace Logging', desc: 'Capture fine-grained application event streams', icon: Search },
              { id: 'metrics', label: 'Resource Telemetry', desc: 'Hardware utilization metrics (CPU, MEM, NET)', icon: Activity },
              { id: 'alerts', label: 'Anomaly Pulse Alerts', desc: 'Automated notification on threshold drift', icon: Zap }
            ].map(item => (
              <div key={item.id} className="p-8 rounded-[2rem] bg-white/5 border border-white/5 flex items-center justify-between group/row hover:border-brand-500/20 transition-all duration-500">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-600 group-hover/row:text-brand-400 group-hover/row:bg-brand-500/10 transition-all">
                      <item.icon size={28} />
                   </div>
                   <div>
                      <h4 className="text-lg font-bold text-white">{item.label}</h4>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                   </div>
                </div>
                <button 
                  onClick={() => handleObservabilityChange(item.id, !requirements.observability[item.id])}
                  className={`relative w-16 h-8 rounded-full transition-colors ${requirements.observability[item.id] ? 'bg-brand-500 shadow-lg shadow-brand-500/20' : 'bg-slate-800'}`}
                >
                   <motion.div 
                     initial={false}
                     animate={{ x: requirements.observability[item.id] ? 36 : 4 }}
                     className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm"
                   />
                </button>
              </div>
            ))}
          </div>
        </section>

      </motion.fieldset>

      {/* Navigation Actions */}
      {!isDeployed && (
        <div className="sticky bottom-8 left-0 right-0 flex justify-between items-center bg-slate-900/60 p-5 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-2xl z-50 animate-slide-up">
          <button
            onClick={onBack}
            className="flex items-center gap-3 px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back
          </button>
          
          <button
            onClick={handleSubmit}
            className="btn-premium px-14 h-16 text-lg"
          >
            <span>Lock Specifications</span>
            <ArrowRight size={22} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RequirementsStep;