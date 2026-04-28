import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Trash2,
  Save,
  ArrowLeft,
  Settings as SettingsIcon,
  Sparkles,
  Edit3,
  ShieldAlert,
  Database,
  Globe,
  History,
  Zap,
  Activity,
  Layers,
  ChevronRight,
  User,
  Shield,
  Box,
  Cpu,
  Lock,
  Cloud
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Sub-components
import CICDConfiguration from '../components/workspaces/CICDConfiguration';
import EnvironmentVariables from '../components/settings/EnvironmentVariables';
import DomainSettings from '../components/settings/DomainSettings';
import DeploymentHistory from '../components/settings/DeploymentHistory';
import ActivityLog from '../components/settings/ActivityLog';
import Integrations from '../components/settings/Integrations';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const WorkspaceSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workspaceData, setWorkspaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('general');

  // Form States
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchWorkspace();
  }, [id]);

  const fetchWorkspace = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/workspaces/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const workspace = response.data;
      setWorkspaceData(workspace);
      setWorkspaceName(workspace.name);
      setWorkspaceDescription(workspace.description || '');
      setLoading(false);
    } catch (error) {
      console.error('Error fetching workspace:', error);
      toast.error('Failed to load project settings');
      navigate('/workspaces');
    }
  };

  useEffect(() => {
    if (!workspaceData) return;
    const stateJson = workspaceData.state_json || {};
    const deploymentMethod = stateJson.deploymentMethod || stateJson.deployment?.method;
    const isDeployed = workspaceData.step === 'deployed' || stateJson.is_deployed === true;

    // Broadcasting context for DashboardLayout
    window.dispatchEvent(new CustomEvent('update-project-context', {
      detail: {
        step: 'settings',
        isProjectLive: stateJson.is_live === true,
        projectName: workspaceData.name,
        isDeployed: isDeployed,
        selectedProvider: stateJson.selectedProvider || stateJson.costEstimation?.recommended?.provider || 'Unknown',
        architecturePattern: stateJson.infraSpec?.architecture_pattern?.replace(/_/g, ' ') || 'Architecture Analysis'
      }
    }));

    // Define main project tabs for the top header
    const tabs = [
      { id: 'input', name: 'Requirements', path: `/workspaces/${id}` },
      { id: 'review_spec', name: 'Specification', path: `/workspaces/${id}` },
      { id: 'cost_estimation', name: 'Cost Estimator', path: `/workspaces/${id}` },
      { id: 'architecture', name: 'Diagram', path: `/workspaces/${id}` },
    ];

    if (deploymentMethod === 'self') {
      tabs.push({ id: 'terraform_view', name: 'Terraform', path: `/workspaces/${id}` });
      tabs.push({ id: 'deployment_summary', name: 'Summary Page', path: `/workspaces/${id}` });
    } else {
      tabs.push({ id: 'terraform_view', name: 'Connection', path: `/workspaces/${id}` });
      tabs.push({ id: 'terraform_provision', name: 'Provision', path: `/workspaces/${id}` });
      tabs.push({ id: 'deploy_resources', name: 'Resources', path: `/workspaces/${id}` });
      tabs.push({ id: 'deployment_summary', name: 'Summary', path: `/workspaces/${id}` });
    }
    tabs.push({ id: 'settings', name: 'Settings', path: `/workspaces/${id}/settings` });

    window.dispatchEvent(new CustomEvent('update-project-tabs', {
      detail: { tabs, activeTab: 'settings' }
    }));
  }, [workspaceData]);

  const handleUpdateWorkspace = async (updates) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/api/workspaces/${id}`, updates, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchWorkspace();
      return true;
    } catch (err) {
      toast.error('Failed to update workspace');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEnvVars = async (newVars) => {
    const stateJson = { ...workspaceData.state_json, user_env_vars: newVars };
    return handleUpdateWorkspace({ state_json: stateJson });
  };

  const handleDeleteWorkspace = async () => {
    const isDeployed = workspaceData?.state_json?.is_deployed === true;
    const warningMsg = isDeployed
      ? '⚠️ CRITICAL: Project is LIVE. Deleting metadata will NOT destroy cloud resources. Manual cleanup required. Continue?'
      : 'Delete this project and all configurations?';

    if (window.confirm(warningMsg)) {
      setIsDeleting(true);
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE}/api/workspaces/${id}${isDeployed ? '?force=true' : ''}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Project Terminated');
        navigate('/workspaces');
      } catch (error) {
        toast.error('Deletion failed');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-brand-500/10 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const sections = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'activities', name: 'Activity Log', icon: Activity },
    { id: 'deployments', name: 'Deployments', icon: History },
    { id: 'env_vars', name: 'Environment Variables', icon: Database },
    { id: 'domains', name: 'Domains', icon: Globe, comingSoon: true }
    // { id: 'cicd', name: 'CI/CD Pipeline', icon: Zap }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-10 animate-fade-in">
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Project Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-6 py-4 bg-white/[0.02] border border-white/10 rounded-2xl focus:border-brand-500/50 outline-none text-white font-bold"
                />
              </div>

              {/* <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Description</label>
                <textarea
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  rows={4}
                  className="w-full px-6 py-4 bg-white/[0.02] border border-white/10 rounded-2xl focus:border-brand-500/50 outline-none text-slate-300 resize-none"
                />
              </div> */}

              <div className="flex justify-end">
                <button
                  onClick={() => handleUpdateWorkspace({ name: workspaceName })}
                  disabled={isSaving}
                  className="btn-premium px-8 h-12"
                >
                  {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                  <span>{isSaving ? 'Saving...' : 'Update Name'}</span>
                </button>
              </div>
            </div>

            <div className="p-8 glass-premium rounded-[2.5rem] border border-red-500/20 space-y-6">
              <div className="flex items-center gap-4 text-red-400">
                <ShieldAlert size={24} />
                <h2 className="text-xl font-black italic italic">Danger Zone</h2>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed italic">
                Deletions are permanent. If your project is deployed, you must manually destroy infrastructure via your cloud provider or use our &quot;Destroy&quot; feature in the Provisioning tab before deleting the workspace.
              </p>
              <button
                onClick={handleDeleteWorkspace}
                disabled={isDeleting}
                className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all border border-red-500/20"
              >
                {isDeleting ? 'Terminating...' : 'Delete Project Metadata'}
              </button>
            </div>
          </div>
        );
      case 'env_vars':
        return (
          <EnvironmentVariables
            workspaceId={id}
            initialVars={workspaceData?.state_json?.user_env_vars || {}}
            onSave={handleUpdateEnvVars}
          />
        );
      case 'domains':
        return <DomainSettings workspaceId={id} initialDomains={workspaceData?.state_json?.domains || []} />;
      case 'cicd':
        return <CICDConfiguration workspaceId={id} initialConfig={workspaceData || {}} />;
      case 'deployments':
        return <DeploymentHistory workspaceId={id} ciConfig={workspaceData?.ci_config || {}} />;
      case 'activities':
        return <ActivityLog workspaceId={id} />;
      case 'integrations':
        return <Integrations workspaceId={id} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-10 space-y-10 animate-fade-in pb-32">
      <div className="flex flex-col lg:flex-row gap-10">

        {/* Left Sidebar Navigation */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="glass-premium rounded-[2.5rem] border border-white/5 p-4 space-y-2 sticky top-10">
            <div className="px-4 py-6 mb-2">
              <h1 className="text-2xl font-black text-white tracking-tighter italic">Settings</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Project configuration</p>
            </div>

            {sections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  data-tab={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${isActive
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-lg shadow-brand-500/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <section.icon size={18} className={isActive ? 'text-brand-400' : 'group-hover:scale-110 transition-transform'} />
                    <span className="text-xs font-bold">{section.name}</span>
                    {section.comingSoon && (
                      <span className="text-[7px] font-black bg-brand-500/10 text-brand-500 px-1.5 py-0.5 rounded-md uppercase tracking-tighter border border-brand-500/20">Soon</span>
                    )}
                  </div>
                  {isActive && <ChevronRight size={14} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          <div className="glass-premium rounded-[2.5rem] border border-white/5 p-10 min-h-[600px] relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
              <SettingsIcon size={300} />
            </div>

            <div className="relative z-10">
              {renderSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettings;