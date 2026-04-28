import React, { useState } from 'react';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Building, ArrowRight, Check, Sparkles, Layers } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import AuthHeader from '../components/AuthHeader';

const PremiumSignup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [company, setCompany] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passcodes do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Passcode complexity too low');
      return;
    }
    setLoading(true);
    try {
      const result = await signup(name, email, password, company);
      if (result.success) {
        toast.success('Onboarding Successful');
        const from = location.state?.from?.pathname || '/workspaces';
        navigate(from, { replace: true });
      } else {
        toast.error(result.error || 'Identity conflict detected');
      }
    } catch (error) {
      toast.error('Network handshake failure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Mesh */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, -30, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-accent-purple/10 blur-[130px] rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
          transition={{ duration: 22, repeat: Infinity }}
          className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-accent-cyan/10 blur-[130px] rounded-full"
        />
        <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />
      </div>

      <AuthHeader />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[1000px] flex flex-col md:flex-row glass-panel rounded-[2rem] overflow-hidden border-white/5 shadow-2xl"
      >
        {/* Left Side: Onboarding Experience */}
        <div className="w-full md:w-5/12 bg-slate-900/50 p-12 flex flex-col justify-between relative overflow-hidden hidden md:flex">
          <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
            <motion.div
              animate={{ x: [0, 50, 0], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-brand-500/10 blur-[100px] rounded-full"
            />
          </div>

          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center mb-10 shadow-lg shadow-brand-500/20">
              <Layers className="text-white w-6 h-6" />
            </div>
            <h2 className="text-3xl font-display font-black text-white leading-tight mb-6 tracking-tight">
              Begin your <br />
              <span className="text-gradient">architectural journey</span>
            </h2>

            <div className="space-y-6">
              {[
                { title: "AI Generation", desc: "Turn prompts into infrastructure" },
                { title: "Dynamic Costing", desc: "Real-time pricing for all resources" },
                { title: "HCL Automation", desc: "Production-ready Terraform code" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="flex items-start gap-4"
                >
                  <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center mt-1 border border-white/5">
                    <Check className="text-accent-cyan w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{item.title}</p>
                    <p className="text-slate-500 text-xs">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Registration */}
        <div className="w-full md:w-7/12 p-10 md:p-14 bg-slate-900/40 backdrop-blur-3xl overflow-y-auto max-h-[90vh]">
          <div className="max-w-md mx-auto">
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-2xl font-display font-bold text-white mb-2">Initialize Profile</h1>
              <p className="text-slate-400 text-sm">Create your multi-cloud identity today.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Identity</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                      className="input-premium pl-12 text-sm" placeholder="Name" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Entity</label>
                  <div className="relative group">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                    <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
                      className="input-premium pl-12 text-sm" placeholder="Company" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Authentication Point</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="input-premium pl-12 text-sm" placeholder="architect@domain.com" required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Keyphrase</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                    <input type={showPassword ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-premium pl-12 pr-12 text-sm" placeholder="••••••••" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Verify</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                    <input type={showPassword ? "text" : "password"} value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-premium pl-12 text-sm" placeholder="••••••••" required />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-1">
                <input type="checkbox" id="tos" className="accent-brand-500" required />
                <label htmlFor="tos" className="text-[11px] text-slate-500">I agree to the <Link to="/terms" className="text-slate-300 underline font-bold">Terms of Architecture</Link></label>
              </div>

              <button type="submit" disabled={loading}
                className="btn-premium w-full mt-4 h-14"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
                  <>Initialize Request <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="my-10 relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center"><span className="bg-slate-900/60 px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Federated Access</span></div>
            </div>

            <GoogleLoginButton
              onSuccess={async (res) => {
                setLoading(true);
                try {
                  await loginWithGoogle(res.access_token);
                  toast.success('Sync Successful');
                  navigate(location.state?.from?.pathname || '/workspaces');
                } catch (e) { toast.error('Google channel sync failed'); }
                finally { setLoading(false); }
              }}
              onError={() => toast.error('Google auth channel failure')}
              loading={loading}
              text="Onboard with Google Workspace"
            />

            <p className="mt-10 text-center text-xs text-slate-500 font-medium">
              Already have an entity?{' '}
              <Link to="/login" className="text-brand-500 font-bold hover:underline decoration-brand-500/30 underline-offset-4 transition-all">
                Access Deck
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PremiumSignup;