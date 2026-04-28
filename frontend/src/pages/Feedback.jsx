import React from 'react';
import SecondaryBackground from '../components/SecondaryBackground';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import FeedbackForm from '../components/FeedbackForm';

const Feedback = () => {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen text-slate-200 selection:bg-brand-500/30 selection:text-white bg-slate-950 font-sans flex flex-col">
            <SecondaryBackground />
            
            {/* Nav Header */}
            <header className="sticky top-0 z-50 bg-slate-950/50 backdrop-blur-xl border-b border-white/5 h-16 shrink-0">
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <img src="/cloudiverse.png" alt="Cloudiverse" className="h-8 w-auto" />
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-all"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back</span>
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto py-16 md:py-24">
                <div className="max-w-4xl mx-auto px-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16 space-y-4"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-widest">
                            <Sparkles size={12} />
                            <span>Community Feedback</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                            Help us <span className="text-brand-400">Improve.</span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
                            We're building Cloudiverse for you. Tell us what's working and what we can do better.
                        </p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="max-w-2xl mx-auto glass-premium rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl"
                    >
                        <FeedbackForm onCancel={() => navigate('/')} />
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 shrink-0 mt-auto">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">&copy; {new Date().getFullYear()} Cloudiverse Architect</p>
                </div>
            </footer>
        </div>
    );
};

export default Feedback;
