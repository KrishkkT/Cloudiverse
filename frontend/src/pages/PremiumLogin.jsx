import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthHeader from '../components/AuthHeader';
import GoogleLoginButton from '../components/GoogleLoginButton';

const PremiumLogin = () => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Missing credentials');
      return;
    }
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success('Access Granted');
        const from = location.state?.from?.pathname || '/workspaces';
        navigate(from, { replace: true });
      } else {
        toast.error(result.error || 'Identity Verification Failed');
      }
    } catch (error) {
      toast.error('Cloud connection timeout');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    setLoading(true);
    try {
      await loginWithGoogle(tokenResponse.access_token);
      toast.success('Sync Successful');
      const from = location.state?.from?.pathname || '/workspaces';
      navigate(from, { replace: true });
    } catch (err) {
      toast.error("Google authentication error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Mesh */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-500/10 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, -45, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-accent-purple/10 blur-[120px] rounded-full"
        />
        <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />
      </div>

      <AuthHeader />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[900px] flex flex-col md:flex-row glass-panel rounded-[2rem] overflow-hidden border-white/5 shadow-2xl"
      >
        {/* Left Side: Visual Experience */}
        <div className="w-full md:w-5/12 bg-slate-900/50 p-12 flex flex-col justify-between relative overflow-hidden hidden md:flex">
          <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
            <motion.div
              animate={{ y: [0, -20, 0], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute -top-1/2 -right-1/2 w-full h-full bg-accent-cyan/10 blur-[80px] rounded-full"
            />
          </div>

          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center mb-8 shadow-lg shadow-brand-500/20">
              <Layers className="text-white w-6 h-6" />
            </div>
            <h2 className="text-3xl font-display font-black text-white leading-tight mb-4 tracking-tight">
              Scale your <br />
              <span className="text-gradient">imagination</span>
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              The command center for your multi-cloud destiny. Optimized for performance and growth.
            </p>
          </div>
        </div>

        {/* Right Side: Authentication */}
        <div className="w-full md:w-7/12 p-10 md:p-14 bg-slate-900/40 backdrop-blur-3xl">
          <div className="max-w-sm mx-auto">
            <div className="mb-10">
              <h1 className="text-2xl font-display font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-slate-400 text-sm">Sign in to your Cloudiverse control deck.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Endpoint</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-premium pl-12"
                    placeholder="architect@domain.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Secret Key</label>
                  <Link to="/forgot-password" title="Recover access" className="text-[11px] font-bold text-slate-600 hover:text-brand-500 transition-colors">
                    Reset Password
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-premium pl-12 pr-12"
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-premium w-full mt-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Initial Authentication <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="my-10 relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center"><span className="bg-slate-900/60 px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">External Identity</span></div>
            </div>

            <GoogleLoginButton
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google auth channel failure')}
              loading={loading}
              text="Continue with Google Workspace"
            />

            <p className="mt-10 text-center text-xs text-slate-500 font-medium">
              New to the platform?{' '}
              <Link to="/register" className="text-brand-500 font-bold hover:underline decoration-brand-500/30 underline-offset-4 transition-all">
                Request Onboarding
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PremiumLogin;