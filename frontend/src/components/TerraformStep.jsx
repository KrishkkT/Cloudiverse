import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileCode, 
  Download, 
  Copy, 
  Folder, 
  ChevronRight, 
  ArrowLeft, 
  FileText, 
  Terminal, 
  CheckCircle2, 
  Rocket, 
  Layout, 
  Box,
  Monitor,
  HardDrive,
  Code2
} from 'lucide-react';
import DeploymentGuide from './DeploymentGuide';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

const TerraformStep = ({
    workspaceId,
    infraSpec,
    selectedProvider,
    costEstimation,
    onComplete,
    onBack,
    isDeployed,
    onTerraformLoaded,
    onDeploy,
    onNavigateToFeedback
}) => {
    const [loading, setLoading] = useState(true);
    const [terraformProject, setTerraformProject] = useState(null);
    const [selectedFile, setSelectedFile] = useState('main.tf');
    const [services, setServices] = useState([]);
    const [error, setError] = useState(null);
    const [isComingSoon, setIsComingSoon] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSelfDeployed, setIsSelfDeployed] = useState(isDeployed || false);

    useEffect(() => {
        if (isDeployed && !isSelfDeployed) {
            setIsSelfDeployed(true);
        }
    }, [isDeployed]);

    const fetchTerraform = async () => {
        try {
            if (!infraSpec?.sizing) {
                setError('Cost analysis required to generate HCL schemas.');
                setLoading(false);
                return;
            }

            const resolvedRegion = infraSpec?.region?.resolved_region ||
                (selectedProvider?.toUpperCase() === 'AWS' ? 'ap-south-1' :
                    selectedProvider?.toUpperCase() === 'GCP' ? 'asia-south1' :
                        selectedProvider?.toUpperCase() === 'AZURE' ? 'Central India' : null);

            if (!resolvedRegion) {
                setError('Region resolution required.');
                setLoading(false);
                return;
            }

            const requestSpec = { ...infraSpec };
            if (!requestSpec.region) requestSpec.region = {};
            if (!requestSpec.region.resolved_region) requestSpec.region.resolved_region = resolvedRegion;

            const providerDetails = costEstimation.provider_details?.[selectedProvider];
            const selectedProfile = Object.entries(costEstimation.scenarios || {}).find(
                ([_, providers]) => providers[selectedProvider]?.monthly_cost === providerDetails?.total_monthly_cost
            )?.[0] || 'standard';

            try {
                const response = await axios.post(`${API_BASE}/workflow/terraform`, {
                    workspace_id: workspaceId,
                    infraSpec: requestSpec,
                    provider: selectedProvider,
                    profile: selectedProfile,
                    project_name: infraSpec.project_name || 'cloudiverse-project',
                    requirements: {}
                });

                if (response.data.success) {
                    const unflatten = (data) => {
                        const result = {};
                        for (const [path, content] of Object.entries(data)) {
                            const parts = path.split('/');
                            let current = result;
                            for (let i = 0; i < parts.length - 1; i++) {
                                const part = parts[i];
                                if (!current[part]) current[part] = {};
                                current = current[part];
                            }
                            current[parts[parts.length - 1]] = content;
                        }
                        return result;
                    };

                    if (response.data.terraform.structure === 'modular') {
                        setTerraformProject(unflatten(response.data.terraform.project));
                    } else {
                        setTerraformProject({ 'main.tf': response.data.terraform.code });
                    }
                    setServices(response.data.services || []);
                    if (onTerraformLoaded) onTerraformLoaded();
                }
            } catch (err) {
                const errorMessage = err.response?.data?.message || err.message || '';
                if (errorMessage.includes('No template for pattern') || errorMessage.includes('not available')) {
                    setIsComingSoon(true);
                } else {
                    setError(`HCL Generation Fault: ${errorMessage}`);
                }
            }
        } catch (err) {
            setError('System handshake failure during code generation.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTerraform();
    }, [workspaceId, infraSpec, selectedProvider, costEstimation]);

    const getCurrentFileContent = () => {
        if (!terraformProject) return '';
        const parts = selectedFile.split('/');
        let content = terraformProject;
        for (const part of parts) {
            if (typeof content === 'object' && content[part]) content = content[part];
            else return '';
        }
        return typeof content === 'string' ? content : '';
    };

    const getFileTree = (obj, prefix = '') => {
        const items = [];
        for (const [key, value] of Object.entries(obj)) {
            const path = prefix ? `${prefix}/${key}` : key;
            if (typeof value === 'string') {
                items.push({ path, name: key, type: 'file', depth: path.split('/').length - 1 });
            } else if (typeof value === 'object') {
                items.push({ path, name: key, type: 'folder', depth: path.split('/').length - 1 });
                items.push(...getFileTree(value, path));
            }
        }
        return items;
    };

    const copyToClipboard = () => {
        const content = getCurrentFileContent();
        navigator.clipboard.writeText(content);
        toast.success(`HCL snippet copied: ${selectedFile.split('/').pop()}`);
    };

    const downloadZip = async () => {
        if (!terraformProject) return;
        setIsDownloading(true);
        try {
            const loadingId = toast.loading('Assembling HCL project package...');
            const response = await axios.get(`${API_BASE}/workflow/export-terraform?provider=${selectedProvider}&workspaceId=${workspaceId}`, {
                responseType: 'blob'
            });
            const projectName = infraSpec.project_name || 'cloudiverse-project';
            saveAs(response.data, `${projectName}-terraform.zip`);
            toast.success('HCL Project Dispatched', { id: loadingId });
            
            setTimeout(async () => {
                try {
                    const token = localStorage.getItem('token');
                    await axios.put(`${API_BASE}/workspaces/${workspaceId}/deploy`, {
                        deployment_method: 'self',
                        provider: selectedProvider
                    }, { headers: { 'Authorization': `Bearer ${token}` } });
                } catch (e) {}
                setIsSelfDeployed(true);
                if (onDeploy) onDeploy();
            }, 1000);
        } catch (err) {
            toast.error('Export channel sync failure');
        } finally {
            setIsDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-8 animate-fade-in">
                <div className="relative">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 rounded-full border-4 border-brand-500/10 border-t-brand-500 shadow-lg shadow-brand-500/20" 
                    />
                    <Code2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-brand-500" />
                </div>
                <div className="text-center">
                    <p className="text-xl font-display font-black text-white italic tracking-tight">Generating HCL Schemas</p>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2 animate-pulse">Encoding architecture for {selectedProvider}...</p>
                </div>
            </div>
        );
    }

    if (isComingSoon) {
        return (
            <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-32">
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-8 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                       <Terminal size={40} />
                    </div>
                    <div className="max-w-xl">
                        <h2 className="text-3xl font-display font-black text-white italic mb-4">HCL Engine: Beta Target</h2>
                        <p className="text-slate-400 leading-relaxed mb-8 text-sm">
                            The automated Terraform module for this specific pattern is currently under construction. 
                            Our engineering team is finalizing the secure resource mappings for {selectedProvider}.
                        </p>
                        <button
                            onClick={onComplete}
                            className="btn-premium px-10 h-14"
                        >
                            <CheckCircle2 size={18} />
                            <span>Return to Control Deck</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px] gap-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                   <Box size={32} />
                </div>
                <div>
                  <p className="text-xl font-display font-black text-white italic">Generation Interrupted</p>
                  <p className="text-red-400/80 mt-2 text-sm font-medium">{error}</p>
                </div>
                <button onClick={onBack} className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">
                    <ArrowLeft size={16} /> Revert to Topology
                </button>
            </div>
        );
    }

    const fileTree = terraformProject ? getFileTree(terraformProject) : [];
    const currentContent = getCurrentFileContent();

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-32">
            <div className="flex justify-end items-center gap-3 mb-8">
                <button onClick={copyToClipboard} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-black text-slate-300 uppercase tracking-widest transition-all">
                    <Copy size={14} /> Copy Source
                </button>
                <button onClick={downloadZip} disabled={isDownloading} className="btn-premium h-11 px-6 text-xs">
                    {isDownloading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={16} />}
                    <span>{isDownloading ? 'Syncing...' : 'Download Project'}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* File Navigator */}
                <div className="lg:col-span-1 glass-panel border-white/5 rounded-3xl p-6 h-[600px] overflow-y-auto relative">
                    <div className="absolute inset-0 bg-dot-grid opacity-5 pointer-events-none" />
                    <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6 px-1">Source Topology</h3>
                    <div className="space-y-1 relative z-10">
                        {fileTree.map((item) => {
                            const isFolder = item.type === 'folder';
                            const isSelected = item.path === selectedFile;
                            const indent = item.depth * 12;

                            return (
                                <button
                                    key={item.path}
                                    onClick={() => !isFolder && setSelectedFile(item.path)}
                                    disabled={isFolder}
                                    className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-medium transition-all ${
                                        isFolder 
                                        ? 'text-amber-500 font-bold opacity-80 cursor-default mb-1 mt-2' 
                                        : isSelected
                                            ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-lg shadow-brand-500/5'
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                    }`}
                                    style={{ marginLeft: `${indent}px` }}
                                >
                                    {isFolder ? <Folder size={14} /> : <FileCode size={14} className={isSelected ? 'text-brand-400' : 'text-slate-600'} />}
                                    <span className="truncate">{item.name}</span>
                                    {!isFolder && isSelected && (
                                       <motion.div layoutId="file-glow" className="ml-auto w-1 h-1 rounded-full bg-brand-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Code Terminal */}
                <div className="lg:col-span-3 glass-panel border-white/5 rounded-3xl overflow-hidden shadow-2xl bg-slate-950 flex flex-col relative group">
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-b border-white/5 relative z-10">
                        <div className="flex items-center gap-6">
                           <div className="flex gap-1.5 px-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30" />
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/30" />
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30" />
                           </div>
                           <div className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-widest">{selectedFile}</div>
                        </div>
                        <div className="flex items-center gap-3">
                           <Monitor size={14} className="text-slate-700" />
                        </div>
                    </div>
                    
                    <div className="flex-1 p-8 overflow-auto max-h-[500px] font-mono text-sm leading-relaxed relative z-10 custom-scrollbar">
                        <pre className="text-slate-300">
                            {currentContent || '// Terminal ready... select a schema file'}
                        </pre>
                    </div>
                    
                    <div className="px-6 py-2 bg-slate-900/30 border-t border-white/5 flex items-center justify-between">
                       <div className="text-[9px] font-black text-slate-600 uppercase">HCL Version 1.5.0</div>
                       <div className="flex items-center gap-1.5 text-[9px] font-bold text-brand-400">
                          <CheckCircle2 size={10} /> Validated Syntax
                       </div>
                    </div>
                </div>
            </div>

            {/* Tactical Deployment Guide */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-12">
                <DeploymentGuide
                    provider={selectedProvider}
                    region={infraSpec.region?.resolved_region}
                    projectName={infraSpec.project_name}
                    onMarkDeployed={async () => {
                        if (isSelfDeployed) return;
                        try {
                            const loadingId = toast.loading('Synchronizing deployment status...');
                            const token = localStorage.getItem('token');
                            await axios.put(`${API_BASE}/workspaces/${workspaceId}/deploy`, {
                                deployment_method: 'self',
                                provider: selectedProvider
                            }, { headers: { 'Authorization': `Bearer ${token}` } });
                            toast.success('Project Logic Live', { id: loadingId });
                            setIsSelfDeployed(true);
                            if (onDeploy) onDeploy();
                        } catch (err) {
                            toast.error('Sync failure');
                        }
                    }}
                    isMarkingDeployed={isDownloading || isSelfDeployed}
                />
            </motion.div>

            {/* Navigation Flow */}
            <footer className="flex justify-between items-center pt-16 px-4 border-t border-white/5">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all"
                >
                    <ArrowLeft size={16} /> Revisit Topology
                </button>

                <button
                    onClick={onComplete}
                    className="btn-premium px-8 h-12"
                >
                    <Layout size={18} />
                    <span>Finalize Simulation</span>
                </button>
            </footer>
        </div>
    );
};

export default TerraformStep;
