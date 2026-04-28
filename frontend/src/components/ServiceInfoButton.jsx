import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getServiceMetadata } from '../data/serviceMetadata';
import { 
    X, 
    CheckCircle2, 
    AlertCircle, 
    Lightbulb, 
    ExternalLink 
} from 'lucide-react';

import ReactDOM from 'react-dom';

const ServiceInfoButton = ({ serviceId, provider, serviceName }) => {
    const [showPopup, setShowPopup] = useState(false);
    const metadata = getServiceMetadata(serviceId, provider);

    // Fallback name if only ID is provided
    const displayName = serviceName || metadata.name || serviceId;

    const popupContent = (
        <AnimatePresence>
            {showPopup && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999]"
                        onClick={() => setShowPopup(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: "-45%", x: "-50%" }}
                        animate={{ opacity: 1, scale: 1, y: "-50%" }}
                        exit={{ opacity: 0, scale: 0.9, y: "-45%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 w-[95vw] max-w-lg bg-[#0a0f1c]/95 backdrop-blur-[40px] border border-white/10 rounded-[3rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.9)] p-12 z-[10000] overflow-hidden ring-1 ring-white/20"
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Premium Decorative Backgrounds */}
                        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/20 blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />
                        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-purple/20 blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03),transparent_70%)] pointer-events-none" />

                        {/* Close Button */}
                        <button
                            onClick={() => setShowPopup(false)}
                            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all z-10"
                        >
                            <X size={20} />
                        </button>

                        {/* Header */}
                        <div className="flex items-center space-x-5 mb-8 pb-8 border-b border-white/5 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-brand-500/20 flex items-center justify-center text-3xl border border-brand-500/30 shadow-inner">
                                {(() => {
                                    // Try to get a specific emoji or icon based on serviceId
                                    const id = serviceId.toLowerCase();
                                    if (id.includes('compute')) return '⚡';
                                    if (id.includes('storage')) return '📁';
                                    if (id.includes('database')) return '🗄️';
                                    if (id.includes('network') || id.includes('cdn')) return '🌐';
                                    if (id.includes('auth')) return '🔐';
                                    return 'ℹ️';
                                })()}
                            </div>
                            <div>
                                <h4 className="text-3xl font-black text-white tracking-tight leading-none mb-2">{displayName}</h4>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 text-[10px] font-black uppercase tracking-widest border border-brand-500/20">
                                        {provider || 'Cloud Service'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar relative z-10">
                            {/* Description */}
                            <p className="text-base text-slate-300 leading-relaxed font-medium">
                                {metadata.desc}
                            </p>

                            {/* How it Works */}
                            <div className="bg-slate-950/50 rounded-2xl p-6 border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase font-black mb-3 tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 inline-block"></span>
                                    How it works
                                </p>
                                <p className="text-sm text-slate-300 leading-relaxed italic">"{metadata.howItWorks}"</p>
                            </div>

                            {/* Pros & Cons Grid */}
                            {(metadata.pros || metadata.cons) && (
                                <div className="grid grid-cols-2 gap-8">
                                    {metadata.pros && (
                                        <div>
                                            <h5 className="flex items-center text-accent-green text-[10px] font-black uppercase tracking-widest mb-4">
                                                <CheckCircle2 size={14} className="mr-2" /> Pros
                                            </h5>
                                            <ul className="space-y-3">
                                                {metadata.pros.map((p, i) => (
                                                    <li key={i} className="text-xs text-slate-400 flex items-start leading-tight">
                                                        <span className="mr-2 mt-1 w-1.5 h-1.5 rounded-full bg-accent-green/30 shrink-0"></span>
                                                        {p}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {metadata.cons && (
                                        <div>
                                            <h5 className="flex items-center text-accent-red text-[10px] font-black uppercase tracking-widest mb-4">
                                                <AlertCircle size={14} className="mr-2" /> Cons
                                            </h5>
                                            <ul className="space-y-3">
                                                {metadata.cons.map((c, i) => (
                                                    <li key={i} className="text-xs text-slate-400 flex items-start leading-tight">
                                                        <span className="mr-2 mt-1 w-1.5 h-1.5 rounded-full bg-accent-red/30 shrink-0"></span>
                                                        {c}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Best For */}
                            {metadata.bestFor && (
                                <div className="pt-2">
                                    <h5 className="flex items-center text-amber-400 text-[10px] font-black uppercase tracking-widest mb-4">
                                        <Lightbulb size={14} className="mr-2" /> Best For
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {metadata.bestFor.map((bf, i) => (
                                            <span key={i} className="px-4 py-2 bg-amber-400/5 border border-amber-400/20 text-amber-200 text-xs font-bold rounded-xl hover:bg-amber-400/10 transition-colors">
                                                {bf}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Link */}
                            {metadata.link && (
                                <div className="pt-10 mt-4 border-t border-white/5 flex justify-center">
                                    <a
                                        href={metadata.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-slate-300 font-black uppercase tracking-widest flex items-center gap-2 transition-all border border-white/5"
                                    >
                                        View Official Documentation
                                        <ExternalLink size={14} className="text-brand-400" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return (
        <div className="relative inline-block ml-2">
            <button
                onClick={() => setShowPopup(true)} // Click to open
                className="w-5 h-5 rounded-full bg-gray-700 text-gray-300 hover:bg-primary hover:text-white flex items-center justify-center text-xs transition-colors focus:outline-none"
                aria-label="Service Information"
            >
                <span className="font-serif italic font-bold">i</span>
            </button>
            {ReactDOM.createPortal(popupContent, document.body)}
        </div>
    );
};

export default ServiceInfoButton;
