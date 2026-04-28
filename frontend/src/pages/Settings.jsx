import React, { useState } from 'react';
import { User, CreditCard, BarChart2, Shield, Settings as SettingsIcon, LogOut, ArrowLeft, LayoutDashboard, ChevronRight, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Sections
import AccountSection from './settings/AccountSection';
import BillingSection from './settings/BillingSection';
import UsageSection from './settings/UsageSection';
import SecuritySection from './settings/SecuritySection';
import PreferencesSection from './settings/PreferencesSection';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'account';

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const tabs = [
    { id: 'account', label: 'Identity', icon: User },
    { id: 'billing', label: 'Subscription', icon: CreditCard },
    { id: 'usage', label: 'Node Usage', icon: BarChart2 },
    { id: 'security', label: 'Security Keys', icon: Shield },
    { id: 'preferences', label: 'Environment', icon: SettingsIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'account': return <AccountSection user={user} />;
      case 'billing': return <BillingSection />;
      case 'usage': return <UsageSection />;
      case 'security': return <SecuritySection />;
      case 'preferences': return <PreferencesSection />;
      default: return <AccountSection user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex relative overflow-hidden">
      <div className="bg-mesh" />

      {/* Modern Settings Sidebar */}
      <aside className="w-80 border-r border-white/5 bg-slate-900/40 backdrop-blur-3xl p-8 flex flex-col hidden lg:flex relative z-10">
        <Link to="/" className="flex items-center gap-2 mb-12 group">
          <div className="flex items-center">
            <a href={'/'}><img
              src="/cloudiverse.png"
              alt="Cloudiverse Architect"
              className="h-9 w-auto"
            /></a>
          </div>
        </Link>

        <div className="flex-1 space-y-1">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 ml-4">Workspace Settings</p>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 h-12 rounded-xl transition-all group ${isActive
                  ? 'bg-brand-500/10 text-brand-400'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? 'text-brand-400' : 'group-hover:text-slate-300'} />
                  <span className="text-sm font-bold">{tab.label}</span>
                </div>
                {isActive && <motion.div layoutId="nav-pill" className="w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(14,140,235,1)]" />}
              </button>
            );
          })}
          <div className="pt-6 mt-6 border-t border-white/5">
            <button onClick={() => navigate('/workspaces')} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-white/5 border border-white/5 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all">
              <LayoutDashboard size={18} /> Back to Dashboard
            </button>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto h-screen relative z-10 custom-scrollbar">
        {/* Desktop Header Top Bar */}
        <header className="h-20 flex items-center px-8 md:px-12 bg-slate-950/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/workspaces')} className="lg:hidden p-2 text-slate-400"><ArrowLeft /></button>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">{tabs.find(t => t.id === activeTab)?.label}</h2>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                <Link to="/workspaces" className="hover:text-brand-400">Dashboard</Link>
                <ChevronRight size={10} />
                <span>Preferences</span>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-8 md:px-12 pt-6 pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              duration={0.3}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Settings;
