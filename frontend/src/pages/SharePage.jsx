import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    Layout, 
    Box, 
    Zap, 
    Shield, 
    ExternalLink, 
    ArrowRight,
    Loader2,
    Globe,
    Cpu,
    Database,
    Network
} from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

const SharePage = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${API_BASE}/architecture/share-metadata/${id}`);
                setData(res.data);
            } catch (err) {
                console.error('Share data error:', err);
                setError('Architecture not found or is private.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 rounded-full border-4 border-brand-500/10 border-t-brand-500 animate-spin" />
                <p className="text-slate-500 font-display font-black italic uppercase tracking-widest animate-pulse">Retrieving Architecture...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                    <Shield size={40} />
                </div>
                <h1 className="text-3xl font-display font-black text-white italic mb-4">Access Denied</h1>
                <p className="text-slate-400 max-w-md mx-auto mb-8">{error}</p>
                <Link to="/" className="btn-premium px-8">Back to Home</Link>
            </div>
        );
    }

    const { summary } = data;
    // Construct the expected SVG URL based on workspace ID and a naming convention 
    // (In production, the backend would provide the specific URL or hash)
    const diagramUrl = `https://cloudiverse-assets.s3.ap-south-1.amazonaws.com/diagrams/${id}/arch-latest.svg`;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-brand-500/30">
            {/* Header / Nav */}
            <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black italic shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
                            C
                        </div>
                        <span className="text-xl font-display font-black text-white italic tracking-tighter">CLOUDIVERSE</span>
                    </Link>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                    
                    {/* Sidebar / Info */}
                    <div className="lg:col-span-4 space-y-10 order-2 lg:order-1">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-widest">
                                <Globe size={12} /> Public Architecture
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-display font-black text-white italic leading-tight">
                                {summary.name}
                            </h1>
                            <p className="text-slate-400 leading-relaxed italic">
                                "{summary.description}"
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass-card p-5 rounded-2xl border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cloud Provider</p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${summary.provider === 'AWS' ? 'bg-[#FF9900]' : 'bg-[#4285F4]'}`} />
                                    <span className="text-white font-bold">{summary.provider}</span>
                                </div>
                            </div>
                            <div className="glass-card p-5 rounded-2xl border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Components</p>
                                <div className="flex items-center gap-2 text-white font-bold">
                                    <Box size={14} className="text-brand-400" />
                                    {summary.serviceCount} Nodes
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic border-l-2 border-brand-500 pl-4">
                                Technical Profile
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-brand-400 transition-colors">
                                        <Cpu size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Architecture Pattern</p>
                                        <p className="text-white font-bold text-sm uppercase">{summary.pattern.replace(/_/g, ' ')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-brand-400 transition-colors">
                                        <Database size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Data Strategy</p>
                                        <p className="text-white font-bold text-sm">Stateful Distributed System</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 border-t border-white/5">
                            <Link to="/signup" className="group flex flex-col items-start gap-4 p-6 rounded-3xl bg-brand-500 hover:bg-brand-600 transition-all shadow-2xl shadow-brand-500/20">
                                <div className="flex items-center justify-between w-full">
                                    <Zap size={24} className="text-white" />
                                    <ArrowRight size={20} className="text-white group-hover:translate-x-2 transition-transform" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-display font-black text-white italic">Build Yours Now</h4>
                                    <p className="text-white/70 text-xs font-medium">Join 5,000+ architects building on Cloudiverse.</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Diagram Main View */}
                    <div className="lg:col-span-8 order-1 lg:order-2">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-panel p-3 rounded-[3rem] border-white/10 shadow-2xl shadow-brand-500/5 overflow-hidden"
                        >
                            <div className="bg-slate-950/80 rounded-[2.5rem] border border-white/5 aspect-square lg:aspect-auto lg:h-[800px] overflow-hidden relative group">
                                <img 
                                    src={diagramUrl} 
                                    alt="Cloud Architecture" 
                                    className="w-full h-full object-contain p-8 sm:p-12 lg:p-20"
                                    onError={(e) => {
                                        e.target.src = "https://placehold.co/1200x800/020617/64748b?text=Generating+Architecture+View...";
                                    }}
                                />
                                
                                <div className="absolute top-8 left-8 flex items-center gap-3">
                                    <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                                        <Network size={14} className="text-brand-400" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">High-Res Vector Output</span>
                                    </div>
                                </div>

                                <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a 
                                        href={diagramUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-5 py-2.5 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-bold transition-all"
                                    >
                                        <ExternalLink size={14} /> Open Full Scale
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </main>

            {/* Footer */}
            <footer className="py-20 border-t border-white/5 text-center">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">
                    DESIGNED & VALIDATED BY CLOUDIVERSE AI ENGINE
                </p>
            </footer>
        </div>
    );
};

export default SharePage;
