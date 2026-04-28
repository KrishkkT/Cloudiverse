import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Activity,
  CreditCard,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Bell,
  Search,
  Plus,
  Globe,
  BarChart2,
  Database,
  Box,
  Cpu,
  ArrowLeft,
  Rocket
} from 'lucide-react';
import FeedbackWidget from '../components/FeedbackWidget';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to Cloudiverse', message: 'Your workspace is ready. Deploy your first project today.', isRead: false, time: new Date() }
  ]);

  useEffect(() => {
    const handleNotification = (e) => {
      const { title, message } = e.detail;
      setNotifications(prev => [{
        id: Date.now(),
        title,
        message,
        isRead: false,
        time: new Date()
      }, ...prev]);
    };
    window.addEventListener('add-notification', handleNotification);
    return () => window.removeEventListener('add-notification', handleNotification);
  }, []);

  useEffect(() => {
    if (isNotificationsOpen) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  }, [isNotificationsOpen]);

  const [projectTabs, setProjectTabs] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [projectContext, setProjectContext] = useState(null);

  useEffect(() => {
    const handleContextUpdate = (e) => {
      setProjectContext(e.detail);
    };
    window.addEventListener('update-project-context', handleContextUpdate);
    return () => window.removeEventListener('update-project-context', handleContextUpdate);
  }, []);

  useEffect(() => {
    const handleTabsUpdate = (e) => {
      if (e.detail.tabs) setProjectTabs(e.detail.tabs);
      if (e.detail.activeTab) setActiveTab(e.detail.activeTab);
    };
    window.addEventListener('update-project-tabs', handleTabsUpdate);
    return () => window.removeEventListener('update-project-tabs', handleTabsUpdate);
  }, []);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/workspaces' },
    { name: 'Deployments', icon: Rocket, path: '/deployments' },
    // { name: 'Team', icon: User, path: '/team' },
    { name: 'Billing', icon: CreditCard, path: '/settings?tab=billing' },
  ];

  const isActive = (path) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));
  };

  const isProjectView = location.pathname.match(/^\/workspaces\/[a-zA-Z0-9_-]+(\/.*)?$/) && !location.pathname.startsWith('/workspaces/new');
  const projectId = isProjectView ? location.pathname.split('/')[2] : null;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <div className="fixed inset-0 bg-mesh pointer-events-none z-0" />
      <div className="fixed inset-0 bg-dot-grid pointer-events-none z-0 opacity-40" />

      {/* Desktop Sidebar */}
      {!isProjectView && (
        <motion.aside
          animate={{ width: isSidebarExpanded ? 260 : 80 }}
          className="hidden md:flex flex-col border-r border-white/5 bg-slate-900/40 backdrop-blur-xl relative z-30"
        >
          {/* Logo Section */}
          <div className="h-20 flex items-center px-6 border-b border-white/5 overflow-hidden">
            <div className="flex items-center gap-3 min-w-[200px]">
              {!isSidebarExpanded && (
                <div className="w-15 h-15 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20 flex-shrink-0">
                  <img
                    src="/icon.svg"
                    alt="Cloudiverse Architect"
                    className="h-9 w-auto"
                  />
                </div>
              )}
              {isSidebarExpanded && (
                <div className="flex items-center">
                  <a href={'/'}><img
                    src="/cloudiverse.png"
                    alt="Cloudiverse Architect"
                    className="h-9 w-auto"
                  /></a>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
            <div className="mb-4">
              {isSidebarExpanded && <p className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Main Menu</p>}
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive(item.path)
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                >
                  <item.icon size={20} className={isActive(item.path) ? 'text-brand-400' : 'group-hover:scale-110 transition-transform'} />
                  {isSidebarExpanded && <span className="font-bold text-sm">{item.name}</span>}
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-white/5">
              <button
                onClick={() => navigate('/workspaces/new')}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20 transition-all active:scale-95 ${!isSidebarExpanded ? 'px-0' : 'px-4'
                  }`}
              >
                <Plus size={20} />
                {isSidebarExpanded && <span className="font-black uppercase text-[10px] tracking-widest">New Project</span>}
              </button>
            </div>
          </nav>

          {/* User Footer */}
          <div className="p-4 border-t border-white/5 space-y-2">
            <Link
              to="/workspaces"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group ${isActive('/profile') ? 'text-white bg-white/5' : ''
                }`}
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                {user?.avatar ? <img src={user.avatar} alt="P" /> : <User size={14} />}
              </div>
              {isSidebarExpanded && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold truncate">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                </div>
              )}
            </Link>

            <Link
              to="/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <Settings size={20} />
              {isSidebarExpanded && <span className="font-bold text-sm">Settings</span>}
            </Link>

            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all group"
            >
              <LogOut size={20} />
              {isSidebarExpanded && <span className="font-bold text-sm">Sign out</span>}
            </button>
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-xl z-50"
          >
            {isSidebarExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </motion.aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Click-away overlays */}
        {isNotificationsOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
        )}
        {searchQuery && (
          <div className="fixed inset-0 z-40" onClick={() => setSearchQuery('')}></div>
        )}

        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-slate-900/20 backdrop-blur-md z-50 relative flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            {!isProjectView && (
              <button className="md:hidden text-slate-400" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu size={24} />
              </button>
            )}

            {/* Context Logo/Breadcrumb for Project View */}
            {isProjectView && projectContext && (
              <div className="flex items-center gap-6 animate-fade-in-down">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${projectContext.isProjectLive ? 'bg-green-500/10 text-green-400' : 'bg-brand-500/10 text-brand-400'}`}>
                  <Box size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-lg font-black text-white tracking-tight">{projectContext.projectName || 'Service Initiation'}</h1>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${projectContext.isProjectLive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-800 text-slate-500 border-white/5'
                      }`}>
                      <div className={`w-1 h-1 rounded-full ${projectContext.isProjectLive ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
                      {projectContext.isProjectLive ? 'Live' : projectContext.isDeployed ? 'Provisioned' : 'Drafting'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Globe size={10} /> {projectContext.selectedProvider || 'Auto-Optimizing'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Cpu size={10} /> {projectContext.architecturePattern || 'Architecture Analysis'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 relative z-50">
            {isProjectView && projectContext && projectContext.step === 'deploy' && projectContext.isProjectLive && (
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-green-500/20 transition-all mr-2">
                <Activity size={14} /> View Runtime Logs
              </button>
            )}
            {isProjectView && (
              <button
                onClick={() => navigate('/workspaces')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all mr-2"
              >
                <ArrowLeft size={14} /> Back to Dashboard
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 focus-within:border-brand-500/50 focus-within:ring-1 focus-within:ring-brand-500/50 transition-all text-slate-400 relative">
              <Search size={14} className="text-slate-500" />
              <input
                type="text"
                placeholder="Global Search... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-slate-600 w-[200px]"
              />

              <AnimatePresence>
                {searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-full min-w-[300px] bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                      {(() => {
                        const allSearchableItems = [
                          { title: 'Overview / Workspaces', path: '/workspaces', type: 'Dashboard' },
                          { title: 'Profile & Identity', path: '/profile', type: 'Account' },
                          { title: 'General Preferences', path: '/settings?tab=preferences', type: 'Settings' },
                          { title: 'Billing & Subscriptions', path: '/settings?tab=billing', type: 'Settings' },
                          { title: 'Node Usage & Metrics', path: '/settings?tab=usage', type: 'Settings' },
                          { title: 'Security Keys', path: '/settings?tab=security', type: 'Settings' },
                          { title: 'Documentation', path: '/docs', type: 'Help' },
                        ];
                        const results = allSearchableItems.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

                        return results.length > 0 ? results.map((res, i) => (
                          <div key={i} onMouseDown={(e) => { e.preventDefault(); navigate(res.path); setSearchQuery(''); }} className="p-3 hover:bg-white/5 cursor-pointer rounded-lg transition-colors flex justify-between items-center">
                            <span className="font-medium text-sm text-slate-200">{res.title}</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest">{res.type}</span>
                          </div>
                        )) : (
                          <div className="p-4 text-center text-sm text-slate-500">No results found</div>
                        );
                      })()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative w-9 h-9 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 transition-colors focus:outline-none focus:bg-white/10"
              >
                <motion.div
                  animate={notifications.some(n => !n.isRead) ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Bell size={18} />
                </motion.div>
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 bg-brand-500 text-[10px] font-bold text-white rounded-full shadow-[0_0_10px_rgba(var(--brand-500),0.8)]">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                      <span className="font-bold text-sm text-white">Notifications</span>
                      <span className="text-[10px] uppercase font-black tracking-widest text-brand-400 cursor-pointer hover:text-brand-300" onClick={() => setIsNotificationsOpen(false)}>Close</span>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar flex flex-col">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">No new notifications</p>
                      ) : (
                        notifications.map((n, idx) => (
                          <div key={n.id} className={`p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${idx === 0 && !n.isRead ? 'bg-brand-500/5' : ''}`}>
                            <h4 className="text-sm font-semibold text-white mb-1">{n.title}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] font-medium text-slate-500 mt-2">{new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Secondary Header for Project View (Vercel Style) */}
        {isProjectView && (
          <div className="h-14 flex items-end px-6 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex-shrink-0">
            <div className="flex items-center gap-8 overflow-x-auto custom-scrollbar w-full">
              {projectTabs.map((tab) => {
                const isActiveTab = tab.id === activeTab;
                const isLocked = tab.locked === true;

                const handleClick = () => {
                  if (isLocked) {
                    // Show a subtle indicator that the tab is locked
                    return;
                  }
                  if (tab.path) {
                    navigate(tab.path);
                  } else {
                    window.dispatchEvent(new CustomEvent('project-tab-click', { detail: tab.id }));
                  }
                };

                return tab.path && !isLocked ? (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${isActiveTab ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    {tab.name}
                    {isActiveTab && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500"
                      />
                    )}
                  </Link>
                ) : (
                  <button
                    key={tab.id}
                    onClick={handleClick}
                    disabled={isLocked}
                    className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-1.5 ${isLocked
                      ? 'text-slate-600 cursor-not-allowed opacity-40'
                      : isActiveTab
                        ? 'text-white'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                    title={isLocked ? 'Complete the previous step to unlock' : ''}
                  >
                    {tab.name}
                    {isLocked && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                    {isActiveTab && !isLocked && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="bg-mesh opacity-20" />
          {children}
        </div>
      </main>

      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[280px] bg-slate-900 z-[110] md:hidden flex flex-col p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-10">
              <span className="font-display font-black text-2xl tracking-tighter text-white">Cloudiverse</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400"><X size={24} /></button>
            </div>
            <nav className="flex-1 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.path)
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <item.icon size={20} />
                  <span className="font-bold">{item.name}</span>
                </Link>
              ))}
            </nav>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <button
                onClick={() => { navigate('/workspaces/new'); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-brand-500 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-brand-500/20"
              >
                <Plus size={18} /> New Project
              </button>

              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={20} />
                <span className="font-bold">Sign out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      {/* Feedback Widget */}
      <FeedbackWidget />
    </div>
  );
};

export default DashboardLayout;
