import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Settings, 
  Cloud,
  Code2,
  Receipt,
  Layers,
  Sparkles,
  Zap,
  HelpCircle
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navItems = [
    { name: 'Control Deck', icon: LayoutDashboard, path: '/workspaces' },
    { name: 'Cloud Clusters', icon: Cloud, path: '/cloud-comparison' },
    { name: 'Terraform Hub', icon: Code2, path: '/terraform-hub' },
    { name: 'Cost Analytics', icon: Receipt, path: '/cost-analytics' },
    { name: 'Preferences', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950/50 backdrop-blur-2xl border-r border-white/5 flex flex-col z-40">
      <div className="absolute inset-0 bg-dot-grid opacity-10 pointer-events-none" />
      
      {/* Branding Zone */}
      <div className="h-20 px-6 flex items-center mb-4">
        <Link to="/" className="flex items-center gap-2 group">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
             <Layers className="text-white w-4 h-4" />
           </div>
           <span className="font-display font-black text-lg tracking-tight text-white">Cloudiverse</span>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="group relative block"
            >
              <div className={`flex items-center gap-3 px-4 h-11 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden ${
                active 
                ? 'bg-brand-500/10 text-brand-400' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}>
                {active && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-transparent border-l-2 border-brand-500"
                  />
                )}
                <Icon size={18} className={`relative z-10 transition-colors ${active ? 'text-brand-400' : 'group-hover:text-slate-300'}`} />
                <span className="relative z-10">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      
      {/* Premium Integration Card */}
      <div className="p-4">
         <div className="glass-panel p-5 rounded-2xl border-white/5 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-accent-purple/10 blur-xl group-hover:bg-accent-purple/20 transition-all" />
            <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center text-accent-purple mb-4">
               <Sparkles size={16} />
            </div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">AI Assistant</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
               Optimizing your cluster for 24 distinct provider regions.
            </p>
            <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-black text-slate-300 uppercase tracking-widest transition-all">
               Run Diagnosis
            </button>
         </div>
      </div>

      {/* User Footer Snippet */}
      <div className="p-4 border-t border-white/5">
         <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all text-left">
            <HelpCircle size={16} className="text-slate-600" />
            <span className="text-xs font-bold text-slate-500">Support Center</span>
         </button>
      </div>
    </aside>
  );
};

export default Sidebar;