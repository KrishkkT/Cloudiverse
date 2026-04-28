import React from 'react';
import { Layers, Rocket, Shield, Zap, Box, ArrowRight } from 'lucide-react';

const Integrations = ({ workspaceId }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-black text-white italic">Cloud Integrations</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Multi-cloud orchestration and third-party adapters</p>
        </div>
      </div>

      <div className="relative overflow-hidden glass-premium rounded-[2.5rem] border border-white/5 p-12 text-center group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] -ml-48 -mb-48" />

        <div className="relative z-10 space-y-8">
          <div className="w-24 h-24 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-700">
            <Layers size={48} className="text-brand-400" />
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-4xl font-black text-white italic tracking-tight">Enterprise Adapters <span className="text-brand-500">Coming Soon</span></h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              We are currently architecting secure handshakes for <strong>Vercel, Render, and Netlify</strong>. 
              Soon, you'll be able to orchestrate hybrid deployments that leverage edge networks for frontends 
              while maintaining stateful workloads on your primary cloud infrastructure.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
             {['Vercel', 'Render', 'Netlify', 'Cloudflare'].map(item => (
               <div key={item} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-white hover:border-brand-500/30 transition-all cursor-default">
                 {item}
               </div>
             ))}
          </div>

          <div className="pt-8">
            <button className="px-8 py-4 bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:bg-brand-600 transition-all flex items-center gap-3 mx-auto">
              Vote for Priority <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <Zap size={20} className="text-brand-400" />
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Universal Adapters</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed italic">
            Once released, our AI engine will automatically generate the necessary CI/CD bridge between your workspace and external providers, ensuring atomic deployments across the stack.
          </p>
        </div>
        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-blue-400" />
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Cross-Cloud Security</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed italic">
            Integrations will use ephemeral OIDC tokens or encrypted secret rotation, keeping your credentials isolated and protected from cross-provider vulnerabilities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
