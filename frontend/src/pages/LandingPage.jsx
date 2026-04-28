import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  DollarSign,
  Shield,
  Cpu,
  Network,
  ChevronRight,
  Check,
  ArrowUp,
  Menu,
  X,
  ArrowRight,
  Code2,
  Layers,
  Sparkles,
  MousePointer2,
  Box,
  Globe,
  CreditCard,
  ShieldCheck,
  Layout,
  ArrowLeft,
  Grid,
  Linkedin
} from 'lucide-react';
import SampleDiagram from '../components/SampleDiagram';

const NeuralGrid = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Ambient Base Layer */}
      <div className="absolute inset-0 bg-slate-950" />

      {/* The Structural Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Interactive Glow Node */}
      <motion.div
        animate={{
          x: mousePos.x - 250,
          y: mousePos.y - 250,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 150, mass: 0.5 }}
        className="absolute w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[120px] will-change-transform"
      />

      {/* Static Cinematic Blooms */}
      <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-brand-primary/5 blur-[150px] rounded-full" />
      <div className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] bg-slate-900 blur-[150px] rounded-full" />

      {/* Digital Grain/Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC42NSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNuKSIvPjwvc3ZnPg==')]" />
    </div>
  );
};

const ScrollReveal = ({ children, delay = 0, direction = 'up' }) => {
  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...directions[direction],
        scale: 0.98
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1
      }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 1.2,
        delay,
        ease: [0.16, 1, 0.3, 1] // Apple-style Expo Out
      }}
    >
      {children}
    </motion.div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Natural Language Infra",
      description: "Transform plain English app descriptions into production-grade infrastructure specs.",
      color: "from-accent-cyan to-accent-blue"
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Multi-Cloud Mirroring",
      description: "Map your architecture across AWS, Azure, and Google Cloud with zero overhead.",
      color: "from-accent-blue to-accent-purple"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Dual AI Optimization",
      description: "Automatically generate both cost-effective and high-performance variants.",
      color: "from-accent-purple to-accent-pink"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Predictive Costing",
      description: "Get accurate, itemized cost projections before you deploy a single resource.",
      color: "from-accent-green to-accent-cyan"
    },
    {
      icon: <Network className="w-6 h-6" />,
      title: "Live Flow Diagrams",
      description: "Interactive, production-quality visual maps updated in real-time as you type.",
      color: "from-accent-pink to-accent-purple"
    },
    {
      icon: <Code2 className="w-6 h-6" />,
      title: "Terraform Exports",
      description: "One-click export of validated, hardened Terraform HCL for immediate usage.",
      color: "from-accent-blue to-accent-cyan"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const linkMap = {
    Features: '#features',
    Pricing: '#pricing',
    Docs: '/docs',
    About: '/about',
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden selection:bg-brand-500/30 selection:text-white">
      <NeuralGrid />

      {/* Modern Floating Navbar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[min(90%,1100px)]">
        <div className="glass-panel rounded-2xl px-6 py-3 flex items-center justify-between border-white/5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="flex items-center">
              <a href={'/'}><img
                src="/cloudiverse.png"
                alt="Cloudiverse Architect"
                className="h-9 w-auto"
              /></a>
            </div>
          </motion.div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            {['Features', 'Pricing', 'Docs', 'About'].map((link) => (
              <a key={link} href={linkMap[link]} className="hover:text-white transition-colors">{link}</a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors hidden sm:block"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-premium py-2 px-5 text-sm"
            >
              Get Started
            </button>
            <button className="md:hidden text-slate-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-0 right-0 glass-panel rounded-2xl p-6 md:hidden flex flex-col gap-4 text-center"
            >
              {['Features', 'Pricing', 'Docs', 'About'].map((link) => (
                <a key={link} href={`#${link.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-slate-300">{link}</a>
              ))}
              <hr className="border-white/5" />
              <button onClick={() => navigate('/login')} className="text-slate-300">Sign in</button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-24 px-6 z-10">
        <div className="max-w-[1200px] mx-auto text-center">
          <ScrollReveal>
            <h1 className="font-display text-5xl md:text-7xl lg:text-9xl font-black text-white leading-[0.85] tracking-tighter mb-8">
              Architect your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-white to-brand-400">future in cloud</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
              The world's first AI-native infrastructure designer. Turn descriptions into
              live architecture diagrams, Terraform code, and real-time cost estimates.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={() => navigate('/register')}
                className="btn-premium text-lg px-8 py-4 w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-white shadow-xl shadow-brand-500/20"
              >
                Launch Console <ArrowRight />
              </button>
            </div>
          </ScrollReveal>

          {/* Interactive Hero Asset */}
          <ScrollReveal delay={0.4} direction="up">
            <div className="mt-24 relative max-w-[1000px] mx-auto filter drop-shadow-[0_0_50px_rgba(79,70,229,0.15)]">
              <div className="absolute inset-0 bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />
              <div className="glass-premium p-2 rounded-[3rem] border-white/10">
                <div className="rounded-[2.5rem] overflow-hidden bg-slate-900/50 backdrop-blur-3xl border border-white/5 shadow-3xl">
                  <SampleDiagram />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="py-32 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6">
          <ScrollReveal delay={0.2}>
            <div className="text-center mb-24">
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 uppercase tracking-tighter">Engineered for <br /> <span className="text-brand-400">Next-Gen Architecture</span></h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto font-medium">Everything you need to design, compare, and deploy hardened infrastructure in record time.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <ScrollReveal key={idx} delay={idx * 0.1}>
                <div
                  className="glass-card rounded-[2.5rem] p-10 group relative overflow-hidden bg-slate-900/20 hover:bg-slate-900/40 border-white/[0.03] hover:border-brand-500/20 transition-all duration-700 h-full"
                >
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-500 opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-700" />

                  <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-white/5 flex items-center justify-center text-brand-400 mb-8 shadow-2xl group-hover:scale-110 group-hover:bg-brand-500/10 transition-all duration-700">
                    {feature.icon}
                  </div>

                  <h3 className="text-2xl font-black text-white mb-4 tracking-tight uppercase leading-none">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section id="pricing" className="py-32 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6">
          <ScrollReveal delay={0.2}>
            <div className="text-center mb-24">
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 uppercase tracking-tighter">Simple, Transparent <br /> <span className="text-brand-400">Pricing</span></h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <ScrollReveal delay={0.3}>
              <div className="glass-card rounded-[2.5rem] p-10 group relative overflow-hidden bg-slate-900/20 hover:bg-slate-900/40 border-white/[0.03] hover:border-brand-500/20 transition-all duration-700 h-full flex flex-col">
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">Free Tier</h3>
                <div className="mb-4">
                  <span className="text-5xl font-black text-white">₹0</span>
                  <span className="text-slate-400">/month</span>
                </div>
                <p className="text-slate-400 mb-8 font-medium">Perfect for hobbyists and prototypes</p>
                <ul className="space-y-4 mb-8 flex-grow text-slate-300 font-medium">
                  <li className="flex items-center gap-3"><Check className="text-brand-400 w-5 h-5" /> Up to 3 Projects</li>
                  <li className="flex items-center gap-3"><Check className="text-brand-400 w-5 h-5" /> Basic AI Models</li>
                  <li className="flex items-center gap-3"><Check className="text-brand-400 w-5 h-5" /> Standard Speed</li>
                  <li className="flex items-center gap-3"><Check className="text-brand-400 w-5 h-5" /> Community Support</li>
                  <li className="flex items-center gap-3"><Check className="text-brand-400 w-5 h-5" /> Limited Exports</li>
                </ul>
                <button onClick={() => navigate('/register')} className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-bold text-white uppercase tracking-wider text-sm">
                  Get Started Free
                </button>
              </div>
            </ScrollReveal>

            {/* Pro Plan */}
            <ScrollReveal delay={0.4}>
              <div className="glass-card rounded-[2.5rem] p-10 group relative overflow-hidden bg-slate-900/40 border-brand-500/30 hover:border-brand-500/50 transition-all duration-700 h-full flex flex-col shadow-[0_0_50px_rgba(79,70,229,0.1)]">
                <div className="absolute top-0 right-0 bg-brand-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-bl-xl">Most Popular</div>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-brand-500 opacity-20 blur-3xl" />

                <h3 className="text-2xl font-black text-brand-400 mb-2 tracking-tight uppercase">Pro Plan</h3>
                <div className="mb-4">
                  <span className="text-5xl font-black text-white">₹999</span>
                  <span className="text-slate-400">/month</span>
                </div>
                <p className="text-slate-400 mb-8 font-medium">For cloud architects</p>
                <ul className="space-y-4 mb-8 flex-grow text-slate-300 font-medium">
                  <li className="flex items-center gap-3"><Check className="text-brand-400 w-5 h-5" /> Unlimited Projects</li>
                  <li className="flex items-center gap-3"><Check className="text-brand-400 w-5 h-5" /> Advanced AI Models</li>
                  <li className="flex items-center gap-3"><Check className="text-brand-400 w-5 h-5" /> Priority Processing</li>
                  <li className="flex items-center gap-3"><Check className="text-brand-400 w-5 h-5" /> Unlimited Exports</li>
                  <li className="flex items-center gap-3"><Check className="text-brand-400 w-5 h-5" /> Email Support</li>
                  <li className="flex items-center gap-3"><Check className="text-brand-400 w-5 h-5" /> Advanced Security</li>
                </ul>
                <button onClick={() => navigate('/register')} className="w-full py-4 rounded-xl btn-premium bg-brand-500 hover:bg-brand-600 transition-colors font-bold text-white uppercase tracking-wider text-sm shadow-xl shadow-brand-500/20">
                  Upgrade to Pro
                </button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative z-10 px-6">
        <div className="max-w-[1000px] mx-auto">
          <ScrollReveal delay={0.3} direction="down">
            <div className="glass-premium rounded-[4rem] p-12 md:p-24 text-center border-white/[0.05] shadow-[0_0_100px_rgba(79,70,229,0.1)]">

              <h2 className="font-display text-4xl md:text-7xl font-black text-white mb-8 leading-[0.9] tracking-tighter uppercase">
                Design your <br /> <span className="text-brand-400">Masterpiece.</span>
              </h2>
              <p className="text-slate-400 text-lg md:text-xl max-w-xl mb-12 font-medium mx-auto">
                Join to revolutionize your cloud workflow with AI intelligence now.
              </p>

              <button
                onClick={() => navigate('/register')}
                className="btn-premium mx-auto text-xl px-16 py-6 shadow-3xl shadow-brand-500/40 bg-brand-500 hover:bg-brand-600 rounded-2xl transition-all"
              >
                Get Instance Access <ArrowRight />
              </button>

              <div className="mt-16 flex flex-wrap justify-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                {['AWS', 'AZURE', 'GCP', 'TERRAFORM'].map(logo => (
                  <span key={logo} className="font-display font-black text-2xl italic tracking-tighter text-slate-400">{logo}</span>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>


      {/* Footer */}
      <footer className="py-20 border-t border-white/5 relative z-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center">
                  <a href={'/'}><img
                    src="/cloudiverse.png"
                    alt="Cloudiverse Architect"
                    className="h-9 w-auto"
                  /></a>
                </div>
              </div>
              <p className="text-slate-500 max-w-sm mb-6">
                The leading AI infrastructure architect for multi-cloud deployments.
                Built for the speed of thought.
              </p>
              <div className="flex gap-4">
                <a 
                  href="https://linkedin.com/company/cloudiverse" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-brand-500/20 hover:border-brand-500/50 transition-all duration-300"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/docs" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="/service-policy" className="hover:text-white transition-colors">Service Policy</a></li>
                <li><a href="/feedback" className="hover:text-white transition-colors">Feedback</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Legal</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/security" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="/compliance" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>

          </div>
          <div className="pt-8 border-t border-white/5 flex justify-center items-center gap-4 text-slate-600 text-xs font-bold uppercase tracking-widest">
            <p>© {new Date().getFullYear()} Cloudiverse Technologies All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Scroll Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="fixed bottom-10 right-10 z-50 w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-white shadow-2xl hover:bg-slate-800 transition-colors"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;