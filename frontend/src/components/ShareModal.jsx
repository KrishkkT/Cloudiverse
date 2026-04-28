import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Share2, 
    Download, 
    Link as LinkIcon, 
    Mail, 
    MessageCircle, 
    Copy, 
    Check,
    Image as ImageIcon,
    FileCode,
    ExternalLink,
    Loader2,
    Sparkles,
    Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

const ShareModal = ({ isOpen, onClose, workspaceId, architectureData, provider }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [urls, setUrls] = useState(null);
    const [copied, setCopied] = useState(false);

    const generateLinks = async () => {
        if (!architectureData) {
            console.warn('[ShareModal] No architecture data available for export');
            return;
        }
        setIsGenerating(true);
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            const payload = {
                workspaceId,
                architectureData: architectureData.architecture || architectureData,
                provider
            };
            console.log('[ShareModal] Export Payload:', payload);
            
            const res = await axios.post(`${API_BASE}/architecture/export-diagram`, payload, { headers });

            if (res.data.success) {
                setUrls(res.data.urls);
            }
        } catch (err) {
            console.error('Export error:', err);
            toast.error('Failed to generate high-res diagram artifacts.');
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        if (isOpen && !isGenerating) {
            generateLinks();
        }
    }, [isOpen, architectureData]);

    // Optional: Reset URLs if architecture data changes while modal is closed
    useEffect(() => {
        setUrls(null);
    }, [architectureData]);

    const handleCopy = (url) => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const shareWhatsApp = (url) => {
        const text = encodeURIComponent(`Check out the cloud architecture I built on Cloudiverse! 🚀\n\n${url}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const shareEmail = (url) => {
        const subject = encodeURIComponent('Cloud Architecture Diagram - Cloudiverse');
        const body = encodeURIComponent(`Hi,\n\nI just designed a high-quality cloud architecture for my project using Cloudiverse.\n\nYou can view the diagram here: ${url}\n\nGenerated with Cloudiverse AI.`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const shareUrl = urls ? `${window.location.origin}/share/${workspaceId}` : '';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg glass-panel overflow-hidden rounded-[2.5rem] border-white/10 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                                    <Share2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-display font-black text-white italic">Share Diagram</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">High-Res Vector Export</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-8">
                            {isGenerating ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full border-4 border-brand-500/10 border-t-brand-500 animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles size={24} className="text-brand-400" />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-bold italic">Rendering High-Res Artifacts...</p>
                                        <p className="text-xs text-slate-500 mt-2">Computing 300 DPI vectors & PNGs</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Action Links */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <motion.a 
                                            whileHover={{ y: -5, scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            href={urls?.svg} 
                                            download={`architecture-${workspaceId}.svg`}
                                            target="_blank"
                                            className="flex flex-col items-center justify-center gap-5 p-10 glass-premium rounded-[2.5rem] border-white/5 bg-white/[0.02] hover:bg-brand-500/10 hover:border-brand-500/30 transition-all group relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-dot-grid opacity-10 pointer-events-none" />
                                            <div className="w-16 h-16 rounded-2xl bg-accent-cyan/10 flex items-center justify-center text-accent-cyan group-hover:bg-accent-cyan group-hover:text-black transition-all shadow-xl">
                                                <FileCode size={32} />
                                            </div>
                                            <div className="text-center">
                                                <span className="text-xs font-black uppercase tracking-[0.2em] text-white group-hover:text-accent-cyan transition-colors">Download Vector</span>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">SVG Format (Lossless)</p>
                                            </div>
                                        </motion.a>

                                        <motion.a 
                                            whileHover={{ y: -5, scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            href={urls?.png} 
                                            download={`architecture-${workspaceId}.png`}
                                            target="_blank"
                                            className="flex flex-col items-center justify-center gap-5 p-10 glass-premium rounded-[2.5rem] border-white/5 bg-white/[0.02] hover:bg-brand-500/10 hover:border-brand-500/30 transition-all group relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-dot-grid opacity-10 pointer-events-none" />
                                            <div className="w-16 h-16 rounded-2xl bg-accent-purple/10 flex items-center justify-center text-accent-purple group-hover:bg-accent-purple group-hover:text-black transition-all shadow-xl">
                                                <ImageIcon size={32} />
                                            </div>
                                            <div className="text-center">
                                                <span className="text-xs font-black uppercase tracking-[0.2em] text-white group-hover:text-accent-purple transition-colors">Download Image</span>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">PNG Format (300 DPI)</p>
                                            </div>
                                        </motion.a>
                                    </div>

                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4">
                                        <Info size={16} className="text-amber-500 mt-1 flex-shrink-0" />
                                        <p className="text-[10px] text-amber-500/80 font-bold leading-relaxed uppercase tracking-widest">
                                            Public sharing links are disabled for production security. Use these high-fidelity exports for internal documentation and stakeholder presentations.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-slate-900/40 border-t border-white/5 text-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter flex items-center justify-center gap-2">
                                <Check size={12} className="text-accent-green" /> Deterministic Vector Architecture System
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ShareModal;
