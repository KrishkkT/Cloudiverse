import React from 'react';
import SecondaryBackground from '../components/SecondaryBackground';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Target, Globe, Heart, Rocket, Shield, Eye, Sparkles, Linkedin } from 'lucide-react';
import { motion } from 'framer-motion';

const About = () => {
    const navigate = useNavigate();

    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    };

    return (
        <div className="relative min-h-screen text-slate-200 selection:bg-brand-500/30 selection:text-white bg-slate-950 font-sans">
            <SecondaryBackground />

            {/* Nav Header */}
            <header className="sticky top-0 z-50 bg-slate-950/50 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2">
                        <img src="/cloudiverse.png" alt="Cloudiverse" className="h-8 w-auto" />
                    </a>
                    <button
                        onClick={() => navigate('/')}
                        className="group flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-all"
                    >
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all">
                            <ArrowLeft size={16} />
                        </div>
                        <span>Back to Home</span>
                    </button>

                </div>
            </header>

            <main className="relative pt-20 pb-32 overflow-hidden">
                {/* Hero Section */}
                <section className="container mx-auto px-6 mb-24 text-center">
                    <motion.div {...fadeInUp}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-widest mb-6">
                            <Sparkles size={12} />
                            <span>Revolutionizing Infrastructure</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-8">
                            Designing the future of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-400">Cloud Architecture.</span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            We're on a mission to democratize cloud infrastructure design, making it accessible,
                            secure, and high-performance for every developer and organization on the planet.
                        </p>
                    </motion.div>
                </section>

                {/* Values / Mission Grid */}
                <section className="container mx-auto px-6 mb-32">
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="glass-premium p-10 rounded-[2.5rem] border border-white/5 group hover:border-brand-500/30 transition-all"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 mb-8 group-hover:scale-110 transition-transform">
                                <Target size={28} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
                            <p className="text-slate-400 leading-relaxed">
                                To eliminate the complexity of cloud management. We believe that designing
                                secure, scalable, and cost-optimized architectures should be an intuitive
                                experience, not a specialized hurdle.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="glass-premium p-10 rounded-[2.5rem] border border-white/5 group hover:border-emerald-500/30 transition-all"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-8 group-hover:scale-110 transition-transform">
                                <Heart size={28} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">Our Values</h2>
                            <ul className="space-y-4">
                                {[
                                    { icon: <Rocket size={14} />, label: "Innovation First", color: "text-brand-400" },
                                    { icon: <Shield size={14} />, label: "Security by Design", color: "text-emerald-400" },
                                    { icon: <Eye size={14} />, label: "Radical Transparency", color: "text-blue-400" },
                                    { icon: <Users size={14} />, label: "Community Driven", color: "text-purple-400" }
                                ].map((v, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                                        <div className={`w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center ${v.color}`}>
                                            {v.icon}
                                        </div>
                                        <span>{v.label}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-3xl mx-auto"
                    >
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 text-brand-400">
                            <Users size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-6">Built by Engineers, for Engineers</h2>
                        <p className="text-slate-400 leading-relaxed mb-10">
                            We're a distributed team of cloud enthusiasts, SREs, and product designers
                            who have faced the "cloud complexity tax" firsthand. Cloudiverse is our
                            answer to the friction of modern DevOps.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-sm font-bold text-slate-300 flex items-center gap-2">
                                <Globe size={16} className="text-brand-400" />
                                <span>Global Distribution</span>
                            </div>
                            <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-sm font-bold text-slate-300 flex items-center gap-2">
                                <Rocket size={16} className="text-emerald-400" />
                                <span>Scale-Native Tech</span>
                            </div>
                        </div>
                    </motion.div>
                </section>
            </main>

            {/* Premium Footer */}
            <footer className="py-12 border-t border-white/5 relative z-10">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">&copy; {new Date().getFullYear()} Cloudiverse Architect</span>
                    </div>
                    <div className="flex items-center gap-8">
                        <a href="/terms" className="text-xs font-bold text-slate-500 hover:text-brand-400 transition-colors uppercase tracking-widest">Terms</a>
                        <a href="/privacy" className="text-xs font-bold text-slate-500 hover:text-brand-400 transition-colors uppercase tracking-widest">Privacy</a>
                        <a href="/contact" className="text-xs font-bold text-slate-500 hover:text-brand-400 transition-colors uppercase tracking-widest">Contact</a>
                        <a 
                            href="https://linkedin.com/company/cloudiverse" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-slate-500 hover:text-brand-400 transition-colors"
                            aria-label="LinkedIn"
                        >
                            <Linkedin size={16} />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default About;
