import React from 'react';
import SecondaryBackground from './SecondaryBackground';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Linkedin } from 'lucide-react';
import { motion } from 'framer-motion';

const LegalLayout = ({ title, lastUpdated, icon: Icon, children }) => {
    const navigate = useNavigate();

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
                        <span>Back</span>
                    </button>
                </div>
            </header>

            <main className="relative pt-16 pb-32">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-12"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                                    <Icon size={24} />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black text-white tracking-tight">{title}</h1>
                                    <div className="flex items-center gap-2 text-slate-500 mt-1">
                                        <Clock size={12} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Last updated: {lastUpdated}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <div className="space-y-8">
                            {children}
                        </div>
                    </div>
                </div>
            </main>

            {/* Premium Footer */}
            <footer className="py-12 border-t border-white/5 relative z-10 mt-auto">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">&copy; {new Date().getFullYear()} Cloudiverse Architect</span>
                    </div>
                    <div className="flex items-center gap-8">
                        <a href="/about" className="text-xs font-bold text-slate-500 hover:text-brand-400 transition-colors uppercase tracking-widest">About</a>
                        <a href="/terms" className="text-xs font-bold text-slate-500 hover:text-brand-400 transition-colors uppercase tracking-widest">Terms</a>
                        <a href="/privacy" className="text-xs font-bold text-slate-500 hover:text-brand-400 transition-colors uppercase tracking-widest">Privacy</a>
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

export const LegalSection = ({ title, children }) => (
    <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-premium p-8 rounded-[2rem] border border-white/5"
    >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <div className="w-1.5 h-6 bg-brand-500 rounded-full" />
            {title}
        </h2>
        <div className="text-slate-400 leading-relaxed text-sm space-y-4">
            {children}
        </div>
    </motion.section>
);

export default LegalLayout;
