import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X, User, Cloud, Settings, Layers, Bell, Search, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-4 left-0 right-0 z-[100] px-4 md:px-8 pointer-events-none">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`mx-auto max-w-[1400px] pointer-events-auto h-16 rounded-[1.25rem] flex items-center justify-between px-6 transition-all duration-500 ${
          scrolled 
          ? 'glass-panel bg-slate-900/60 shadow-xl border-white/5' 
          : 'bg-transparent border-transparent'
        }`}
      >
        {/* Branding */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
                  <Layers className="text-white w-4 h-4" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-white hidden sm:block">Cloudiverse</span>
          </Link>
          
          <div className="hidden lg:flex items-center ml-8 gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
             <button onClick={() => navigate('/workspaces')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all">Projects</button>
             <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 cursor-not-allowed">Marketplace</button>
             <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 cursor-not-allowed">Assets</button>
          </div>
        </div>

        {/* Action Center */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-2 relative group">
             <Search className="absolute left-3 w-3.5 h-3.5 text-slate-500" />
             <input 
               type="text" 
               placeholder="Search control deck..." 
               className="bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-300 outline-none focus:ring-2 ring-brand-500/20 w-48 focus:w-64 transition-all"
             />
          </div>

          <div className="flex items-center gap-1 md:gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
            <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all relative">
               <Bell size={16} />
               <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent-cyan rounded-full border-2 border-slate-950" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
               <Sparkles size={16} />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block" />

          {user ? (
            <div className="flex items-center gap-2 pl-1">
               <button 
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2 group p-0.5 pr-2 rounded-xl hover:bg-white/5 transition-all"
               >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center p-0.5 overflow-hidden ring-1 ring-white/10">
                     <div className="w-full h-full rounded-md bg-slate-900 flex items-center justify-center text-[10px] font-black text-brand-400">
                        {user.name?.charAt(0) || 'U'}
                     </div>
                  </div>
                  <div className="text-left hidden md:block">
                     <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">{user.name || 'User'}</p>
                     <p className="text-[10px] text-slate-500 leading-none">Pro Plan</p>
                  </div>
               </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/login')} 
                className="text-xs font-bold text-slate-300 hover:text-white transition-colors"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/register')} 
                className="btn-premium py-1.5 px-4 text-xs"
              >
                Sign up
              </button>
            </div>
          )}

          <button
            className="md:hidden p-2 text-slate-300 bg-white/5 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-4 right-4 glass-panel bg-slate-900/95 rounded-2xl p-6 md:hidden z-[101] shadow-2xl border-white/10"
          >
            <div className="grid grid-cols-2 gap-3 mb-6">
               <button onClick={() => navigate('/workspaces')} className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/5 text-slate-300">
                  <Cloud size={20} className="text-brand-500" />
                  <span className="text-xs font-bold">Projects</span>
               </button>
               <button onClick={() => navigate('/settings')} className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/5 text-slate-300">
                  <Settings size={20} className="text-accent-purple" />
                  <span className="text-xs font-bold">Settings</span>
               </button>
            </div>
            
            <div className="space-y-2">
              <button onClick={() => navigate('/profile')} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-slate-300 text-sm font-medium flex items-center gap-3">
                 <User size={16} /> Account Details
              </button>
              <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-red-400 text-sm font-medium flex items-center gap-3">
                 <LogOut size={16} /> Terminate Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;