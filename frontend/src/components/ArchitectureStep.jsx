import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap,
    Map,
    Settings,
    Shield,
    Box,
    Layout,
    ArrowLeft,
    ArrowRight,
    Sparkles,
    Info,
    CheckCircle2,
    Plus,
    X,
    Clock,
    ChevronRight,
    Lightbulb,
    Rocket,
    Download,
    Terminal,
    Database,
    Globe,
    Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactFlowDiagram from './ReactFlowDiagram';
import ServiceInfoButton from './ServiceInfoButton';
import ShareModal from './ShareModal';
import { Share2 } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

const ArchitectureStep = ({
    workspaceId,
    infraSpec,
    costEstimation,
    selectedProvider,
    selectedProfile,
    usageProfile,
    requirementsData,
    architectureData,
    onArchitectureDataLoaded,
    onInfraSpecUpdate,
    onDiagramImageSave,
    onNext,
    onBack,
    isDeployed
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const diagramRef = useRef(null);

    // New State for Service Addition Flow
    const [selectedAvailableService, setSelectedAvailableService] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    // AI Suggestions State
    const [suggestedServices, setSuggestedServices] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    useEffect(() => {
        const loadArchitecture = async () => {
            if (!infraSpec || !selectedProvider || !selectedProfile) return;

            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                const response = await axios.post(`${API_BASE}/workflow/architecture`, {
                    workspace_id: workspaceId,
                    infraSpec,
                    provider: selectedProvider,
                    profile: selectedProfile,
                    usage_profile: usageProfile?.usage_profile || {},
                    intent: infraSpec?.locked_intent || {},
                    requirements: requirementsData || {}
                }, { headers });

                if (!response.data || !response.data.data) {
                    throw new Error('Invalid response structure');
                }

                if (onArchitectureDataLoaded) {
                    onArchitectureDataLoaded(response.data.data);
                }
                setError(null);
            } catch (err) {
                console.error('Architecture loading error:', err);
                setError('Failed to load architecture diagram.');
                toast.error('Failed to load architecture diagram');
            } finally {
                setLoading(false);
            }
        };

        loadArchitecture();
    }, [workspaceId, infraSpec, selectedProvider, selectedProfile, usageProfile, requirementsData, onArchitectureDataLoaded]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!infraSpec?.original_input || !architectureData?.services) return;
            if (suggestedServices.length > 0) return;

            setLoadingSuggestions(true);
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                const res = await axios.post(`${API_BASE}/architecture/validate-completeness`, {
                    description: infraSpec.original_input,
                    current_services: architectureData.services,
                    catalog: {}
                }, { headers });

                if (res.data.suggestions) {
                    setSuggestedServices(res.data.suggestions);
                }
            } catch (e) {
                console.error("Failed to fetch suggestions:", e);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        if (!loading) {
            fetchSuggestions();
        }
    }, [loading, infraSpec, architectureData]);

    const handleAddService = async () => {
        if (!selectedAvailableService || isDeployed) return;

        const serviceId = selectedAvailableService.service_id || selectedAvailableService.id;
        const serviceName = selectedAvailableService.name || serviceId;

        setIsPopupOpen(false);
        const toastId = toast.loading(`Provisioning ${serviceName}...`);

        try {
            const currentInfra = {
                services: architectureData.services || [],
                services_contract: architectureData.services_contract
            };
            const action = { type: 'ADD_SERVICE', serviceId: serviceId };
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const res = await axios.post(`${API_BASE}/architecture/reconcile`, {
                action,
                current_infra: currentInfra
            }, { headers });

            const { services_contract, deployable_services } = res.data;
            toast.success(`${serviceName} integrated!`, { id: toastId });

            const newArchData = {
                ...architectureData,
                services: services_contract.services,
                remaining_services: architectureData.remaining_services.filter(s => s.service_id !== serviceId && s.id !== serviceId)
            };
            onArchitectureDataLoaded(newArchData);

            if (onInfraSpecUpdate && infraSpec) {
                onInfraSpecUpdate({
                    ...infraSpec,
                    canonical_architecture: {
                        ...infraSpec.canonical_architecture,
                        deployable_services: deployable_services,
                    },
                    services_contract: services_contract
                });
            }
            setSelectedAvailableService(null);
        } catch (err) {
            toast.error(err.response?.data?.error || err.message, { id: toastId });
        }
    };

    if (error) {
        return (
            <div className="max-w-4xl mx-auto space-y-12 pb-32">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-display font-black text-white italic">Fallback Mode</h2>
                    <p className="text-slate-400">Diagram generation stalled, but your logic is intact.</p>
                </div>
                <div className="glass-panel p-8 border-red-500/20 bg-red-500/5 rounded-3xl">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-red-200">System Handover</h3>
                            <p className="text-sm text-red-200/60 leading-relaxed">
                                Architecture visualization failed. You can still proceed to Terraform generation using the existing infra spec.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center bg-slate-900/40 p-2 rounded-2xl border border-white/5">
                    <button onClick={onBack} className="btn-ghost flex items-center gap-2 text-sm font-bold px-6">
                        <ArrowLeft size={16} /> Previous Deck
                    </button>
                    <button onClick={onNext} className="btn-premium px-8">
                        Continue to Feedback <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        );
    }

    if (loading && !architectureData) {
        return (
            <div className="max-w-4xl mx-auto space-y-12 pb-32">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-display font-black text-white italic">Mapping Cluster</h2>
                    <p className="text-slate-400 animate-pulse">Running architectural simulation for {selectedProvider}...</p>
                </div>
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
                    <div className="relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-24 h-24 rounded-full border-4 border-brand-500/10 border-t-brand-500"
                        />
                        <Layers className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-brand-500" />
                    </div>
                    <div className="flex gap-2">
                        {[0, 1, 2].map(i => (
                            <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} className="w-1 h-1 rounded-full bg-brand-500" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-32">

            {/* Config Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Target Provider</p>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg
                            ${selectedProvider === 'AWS' ? 'bg-[#FF9900]/20 text-[#FF9900] shadow-[#FF9900]/10' :
                                selectedProvider === 'GCP' ? 'bg-[#4285F4]/20 text-[#4285F4] shadow-[#4285F4]/10' : 'bg-[#0078D4]/20 text-[#0078D4] shadow-[#0078D4]/10'}`}>
                            {selectedProvider}
                        </div>
                        <div>
                            <p className="font-display font-black text-white">{selectedProvider === 'AZURE' ? 'Microsoft Azure' : selectedProvider === 'AWS' ? 'Amazon Web Services' : 'Google Cloud Platform'}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black">Multi-region capable</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Cost Profile</p>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent-purple/20 flex items-center justify-center text-accent-purple shadow-lg shadow-accent-purple/10">
                            <Zap size={20} />
                        </div>
                        <div>
                            <p className="font-display font-black text-white capitalize">{selectedProfile?.replace('_', ' ')}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Optimized for efficiency</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-3xl sm:col-span-2 lg:col-span-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">System Nodes</p>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent-cyan/20 flex items-center justify-center text-accent-cyan shadow-lg shadow-accent-cyan/10">
                            <Box size={20} />
                        </div>
                        <div>
                            <p className="font-display font-black text-white">{architectureData?.services?.length || 0} Components</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black">Active in topology</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Diagram Viewport */}
            <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-3 rounded-[2.5rem] border-white/10 relative overflow-hidden group shadow-2xl shadow-brand-500/5"
            >
                <div className="absolute top-8 left-8 flex items-center gap-3 z-20">
                    <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                        <Layout size={14} className="text-brand-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Global Topology</span>
                    </div>
                    {isDeployed && (
                        <div className="bg-accent-green/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-accent-green/20 text-accent-green text-[10px] font-black uppercase flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" /> Live Status
                        </div>
                    )}
                </div>

                <div className="absolute top-8 right-8 z-20">
                    <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl border border-white/10 shadow-lg shadow-brand-500/20 transition-all active:scale-95 group"
                    >
                        <Share2 size={14} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Share & Export</span>
                    </button>
                </div>

                <div className="rounded-[2rem] overflow-hidden bg-slate-950/80 backdrop-blur-md border border-white/5 h-[650px] relative">
                    <ReactFlowDiagram
                        ref={diagramRef}
                        services={architectureData?.architecture?.nodes || []}
                        edges={architectureData?.architecture?.edges || []}
                        provider={selectedProvider}
                        pattern={infraSpec?.architecture_pattern || 'SERVERLESS_WEB_APP'}
                    />
                </div>
            </motion.div>

            {/* Component Inventory */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-display font-black text-white flex items-center gap-3 italic">
                            Hardware Interface
                        </h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Provider-specific service mapping</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500">
                        <Terminal size={20} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {architectureData?.services?.map((service, index) => {
                        const isDisabled = service.state === 'USER_DISABLED';
                        if (isDisabled) return null;

                        return (
                            <motion.div
                                key={index}
                                whileHover={{ y: -2 }}
                                className="glass-card p-6 rounded-[1.5rem] border-white/5 group relative transition-all"
                            >
                                <div className="absolute -right-4 -top-4 w-12 h-12 bg-brand-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 group-hover:bg-brand-500 group-hover:text-white transition-all shadow-xl">
                                        <Database size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-display font-black text-white group-hover:text-brand-400 transition-colors">
                                                {service.name || service.pretty_name || service.canonical_type}
                                            </h4>
                                            <ServiceInfoButton
                                                serviceId={service.canonical_type || service.name}
                                                provider={selectedProvider}
                                                serviceName={service.name || service.pretty_name}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors">
                                            {service.description}
                                        </p>
                                        <div className="mt-4 flex items-center gap-3">
                                            <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                                                {service.category}
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-accent-green">
                                                <Globe size={10} /> {selectedProvider} Cloud
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* AI Suggestions */}
                {suggestedServices.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="mt-12 space-y-4"
                    >
                        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-accent-purple/10 border border-accent-purple/20 w-fit">
                            <Lightbulb size={14} className="text-accent-purple" />
                            <h4 className="text-[10px] font-black text-accent-purple uppercase tracking-[0.2em]">Architecture Intelligence</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {suggestedServices.map((suggestion, index) => {
                                const fullService = architectureData.remaining_services?.find(s => s.service_id === suggestion.service_id || s.id === suggestion.service_id);
                                const serviceName = fullService?.name || suggestion.service_id;

                                return (
                                    <div key={index} className="glass-card p-6 rounded-[1.5rem] border-dashed border-accent-purple/30 bg-accent-purple/5 group relative">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center text-accent-purple">
                                                <Sparkles size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-display font-black text-white italic mb-1">
                                                    {serviceName}
                                                </h4>
                                                <p className="text-xs text-slate-500 leading-relaxed mb-4">{suggestion.reason}</p>
                                                <button
                                                    onClick={() => {
                                                        if (isDeployed) {
                                                            toast.error("Architecture is locked for live projects.");
                                                            return;
                                                        }
                                                        if (fullService) {
                                                            setSelectedAvailableService(fullService);
                                                            handleAddService();
                                                        } else {
                                                            toast.error("Service details locked.");
                                                        }
                                                    }}
                                                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${isDeployed ? 'text-slate-600 cursor-not-allowed' : 'text-accent-purple hover:text-white'}`}
                                                >
                                                    Inject Component <ChevronRight size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </section>

            {/* Actions */}
            {!isDeployed && (
                <div className="flex flex-col gap-10 pt-16 border-t border-white/5">
                    <div className="text-center">
                        <h3 className="text-2xl font-display font-black text-white italic mb-2 tracking-tight">Deploy Logic Engine</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Select your production pipeline</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.button
                            whileHover={{ y: -5, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onNext('self')}
                            className="p-8 glass-card rounded-[2.5rem] border-accent-blue/30 bg-accent-blue/5 text-left group transition-all hover:bg-accent-blue/10 relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-10">
                                <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-all shadow-xl">
                                    <Download size={24} />
                                </div>
                                <div className="p-2 bg-white/5 rounded-full">
                                    <ArrowRight size={14} className="text-slate-600 group-hover:text-brand-400 transition-colors" />
                                </div>
                            </div>
                            <h4 className="text-xl font-display font-black text-white mb-2">Self-Managed</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Generate validated Terraform files and deploy manually using your local CLI environment.
                            </p>
                        </motion.button>

                        <motion.button
                            whileHover={{ y: -5, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onNext('oneclick')}
                            className="p-8 glass-card rounded-[2.5rem] border-accent-green/30 bg-accent-green/5 text-left group transition-all hover:bg-accent-green/10 relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-10">
                                <div className="w-14 h-14 rounded-2xl bg-accent-green/20 flex items-center justify-center text-accent-green group-hover:bg-accent-green group-hover:text-black transition-all shadow-xl">
                                    <Rocket size={24} />
                                </div>
                                <div className="p-2 bg-accent-green/10 rounded-full">
                                    <Sparkles size={14} className="text-accent-green" />
                                </div>
                            </div>
                            <h4 className="text-xl font-display font-black text-white mb-2 italic">Automated Dispatch</h4>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Full lifecycle deployment handled by the AI engine. No local DevOps environment required.
                            </p>
                        </motion.button>
                    </div>

                    <div className="flex justify-center">
                        <button onClick={onBack} className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
                            <ArrowLeft size={16} /> Revisit Consumption Metrics
                        </button>
                    </div>
                </div>
            )}

            {isDeployed && (
                <div className="flex justify-center pt-16 border-t border-white/5">
                    <div className="glass-panel px-8 py-4 rounded-2xl border-accent-green/20 bg-accent-green/5 text-accent-green text-sm font-bold flex items-center gap-3">
                        <CheckCircle2 size={18} />
                        Infrastructure is currently Live and Locked
                    </div>
                </div>
            )}

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                workspaceId={workspaceId}
                architectureData={architectureData}
                provider={selectedProvider}
            />
        </div>
    );
};

export default ArchitectureStep;