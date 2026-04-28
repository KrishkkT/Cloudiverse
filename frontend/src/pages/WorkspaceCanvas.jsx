import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Trash2,
    ChevronRight,
    ChevronLeft,
    ChevronUp,
    ChevronDown,
    Search,
    Zap,
    Layout,
    Shield,
    ArrowLeft,
    ArrowRight,
    Rocket,
    CheckCircle2,
    AlertCircle,
    Box,
    Settings,
    Cpu,
    Globe,
    Database,
    Bot,
    Sparkles,
    Terminal,
    BarChart3,
    Grid,
    Info,
    Clock,
    Layers,
    Activity,
    Code2,
    Tag,
    X,
    Paperclip,
    Undo2,
    Ban,
    CreditCard,
    ShieldCheck,
    Users,
    Loader2,
    Check,
    Calculator,
    Folder,
    HardDrive,
    Brain,
    Server,
    Lock,
    File,
    Image,
    Cloud,
    Lightbulb,
    ExternalLink
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
import { validateProjectDescription } from '../utils/validation/intentValidator';
import { getServiceMetadata } from '../data/serviceMetadata';

import FeedbackStep from '../components/FeedbackStep';
import TerraformStep from '../components/TerraformStep';
import RequirementsStep from '../components/RequirementsStep';
import ArchitectureStep from '../components/ArchitectureStep';
import DeployTerraformStep from '../components/DeployTerraformStep';
import DeployInfrastructureStep from '../components/DeployInfrastructureStep';
import DeployResourcesStep from '../components/DeployResourcesStep';
import DeployedSummary from '../components/DeployedSummary';
import NetworkBackground from '../components/NetworkBackground';

const WorkspaceCanvas = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(null); // Initialized to null to prevent flashing Requirements page
    const [description, setDescription] = useState('');
    const [history, setHistory] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [infraSpec, setInfraSpec] = useState(null);
    const [projectData, setProjectData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [usageProfile, setUsageProfile] = useState(null); // Step 2.5 data

    const [aiSnapshot, setAiSnapshot] = useState(null);
    const [costEstimation, setCostEstimation] = useState(null);
    const [costProfile, setCostProfile] = useState('cost_effective');
    const [workspaceId, setWorkspaceId] = useState(id === 'new' ? null : id);
    const [selectedProvider, setSelectedProvider] = useState(null); // Explicit selection
    const [selectedAvailableService, setSelectedAvailableService] = useState(null);
    const [connection, setConnection] = useState(null); // 🔥 Track cloud connection metadata
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    // Separate state for architecture/diagram data (derived from infraSpec but distinct)
    const [architectureData, setArchitectureData] = useState(null);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [requirementsData, setRequirementsData] = useState(null);
    const [isDeployed, setIsDeployed] = useState(false); // 🔥 Track deployment status
    const [deploymentMethod, setDeploymentMethod] = useState('connect'); // 'connect' | 'self' | 'oneclick'
    const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'resources' | 'usage' | 'settings' (For Deployed View)
    const [isProjectLive, setIsProjectLive] = useState(false); // Track if project is live

    // Polish-to-Production States
    const [isAssumptionsDrifted, setIsAssumptionsDrifted] = useState(false);
    const [isUsageUserModified, setIsUsageUserModified] = useState(false);
    const [initialDescription, setInitialDescription] = useState('');
    const [serverError, setServerError] = useState(null); // 🔥 Track critical connectivity errors
    const [isMarkingDeployed, setIsMarkingDeployed] = useState(false);

    // V2 State
    const [domains, setDomains] = useState([]);
    const [traffic, setTraffic] = useState('medium');
    const [dbExcluded, setDbExcluded] = useState(false); // Simple boolean for now
    const [removedServices, setRemovedServices] = useState([]); // 🔥 Recycle Bin for services
    const [diagramImage, setDiagramImage] = useState(null); // 🔥 Store high-res architecture snapshot
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [lastDescription, setLastDescription] = useState('');
    const [isEnhanced, setIsEnhanced] = useState(false);
    const [unlockedSteps, setUnlockedSteps] = useState(['input']); // 🔥 Track which steps the user has reached


    // AI Suggestions State
    const [suggestedServices, setSuggestedServices] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [userPlan, setUserPlan] = useState('free'); // 🔥 Track user plan
    const [provisioningState, setProvisioningState] = useState({}); // 🔥 Persistent Provisioning State
    const [infraOutputs, setInfraOutputs] = useState(null); // 🔥 Captured Terraform Outputs

    // Derived State: Read Only Mode
    // const isReadOnly = isDeployed || isProjectLive || provisioningState?.infra_provisioned;

    // Detect Drift
    useEffect(() => {
        // Only show drift warning if cost estimation exists AND description has actually changed
        // after initial load (not on page refresh when both values are set simultaneously)
        if (costEstimation && initialDescription && description !== initialDescription) {
            setIsAssumptionsDrifted(true);
        } else if (costEstimation && initialDescription && description === initialDescription) {
            // If they match, clear any drift warning
            setIsAssumptionsDrifted(false);
        }
    }, [description, initialDescription, costEstimation]);

    // Auto-scroll to top on step changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    // Scroll to top when active tab changes (for deployed view)
    useEffect(() => {
        if (isDeployed) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [activeTab, isDeployed]);

    // Helper to determine if a deployment step is locked
    const checkStepLocked = useCallback((stepId) => {
        // Deployed or Provisioned projects have all navigation UNLOCKED
        if (isProjectLive || isDeployed || provisioningState?.infra_provisioned) return false;

        // Saved drafts have all navigation UNLOCKED (per user request)
        if (workspaceId) return false;

        // New strict locking logic: must be in unlockedSteps to be clickable
        if (unlockedSteps.includes(stepId)) return false;

        // Allow settings always
        if (stepId === 'settings') return false;

        return true;
    }, [isProjectLive, isDeployed, provisioningState, workspaceId, unlockedSteps]);

    // Update dynamic tabs in header
    useEffect(() => {

        let tabs = [
            { id: 'input', name: 'Requirements' },
            { id: 'review_spec', name: 'Specification' },
            { id: 'cost_estimation', name: 'Cost Estimator' },
            { id: 'architecture', name: 'Diagram' },
        ];

        if (deploymentMethod === 'self') {
            tabs.push({ id: 'terraform_view', name: 'Terraform' });
            tabs.push({ id: 'deployment_summary', name: 'Summary', locked: !isDeployed });
        } else if (deploymentMethod === 'oneclick') {
            tabs.push({ id: 'terraform_view', name: 'Connection', locked: false });
            tabs.push({ id: 'terraform_provision', name: 'Provision', locked: checkStepLocked('terraform_provision') });
            tabs.push({ id: 'deploy_resources', name: 'Resources', locked: checkStepLocked('deploy_resources') });

            tabs.push({ id: 'deployment_summary', name: 'Summary', locked: !isDeployed });
        }

        // Ensure settings and summary are always reachable
        // Configuration tabs remain reachable but will be read-only via isReadOnly prop
        const isProjectProvisioned = provisioningState?.infra_provisioned || isDeployed || isProjectLive;

        tabs = tabs.map(t => {
            // 1. Mark as read-only if deployed or provisioned (Requirement 1)
            // 2. Exception: Summary and Settings are usually functional (view-wise)
            if (isProjectProvisioned && t.id !== 'deployment_summary' && t.id !== 'settings' && t.id !== 'deploy_resources') {
                return { ...t, isReadOnly: true };
            }
            return t;
        });

        tabs.push({ id: 'settings', name: 'Settings', path: `/workspaces/${id}/settings` });

        // Map intermediate/processing steps to their parent tab
        const stepToTab = {
            'processing': 'input',
            'question': 'input',
            'processing_spec': 'review_spec',
            'confirm_intent': 'input',
            'usage_review': 'cost_estimation',
            'processing_cost': 'cost_estimation',
            'processing_architecture': 'architecture',
            'feedback': 'architecture',
            'deployment_processing': 'deployment_summary',
            'deployed': 'deployment_summary',
        };
        const resolvedActiveTab = stepToTab[step] || step;

        window.dispatchEvent(new CustomEvent('update-project-tabs', {
            detail: {
                tabs,
                activeTab: resolvedActiveTab
            }
        }));

        window.dispatchEvent(new CustomEvent('update-project-context', {
            detail: {
                step,
                isProjectLive,
                projectName: projectData?.name || infraSpec?.project_name,
                isDeployed,
                selectedProvider,
                architecturePattern: infraSpec?.architecture_pattern?.replace(/_/g, ' ')
            }
        }));
    }, [step, deploymentMethod, id, isProjectLive, projectData, infraSpec, isDeployed, selectedProvider, connection, provisioningState, unlockedSteps]);

    // Listen for tab clicks from header
    useEffect(() => {
        const handleTabClick = (e) => {
            const tabId = e.detail;

            // 🔥 Check if locked before switching
            if (checkStepLocked(tabId)) {
                toast.error("Complete the current step to unlock this tab.", { id: 'locked-tab' });
                return;
            }

            setStep(tabId);
        };
        window.addEventListener('project-tab-click', handleTabClick);
        return () => window.removeEventListener('project-tab-click', handleTabClick);
    }, [unlockedSteps, deploymentMethod, connection, provisioningState, isDeployed]);

    // New: Fetch AI Suggestions Effect
    useEffect(() => {
        const fetchSuggestions = async () => {
            // Only fetch if we have the architecture data loaded and base inputs
            if (!infraSpec?.original_input || !architectureData?.services) return;

            setLoadingSuggestions(true);
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                const res = await axios.post(`${API_BASE}/api/architecture/validate-completeness`, {
                    description: infraSpec.original_input,
                    current_services: architectureData.services,
                    catalog: {}
                }, { headers });

                if (res.data.suggestions) {
                    setSuggestedServices(prev => {
                        const existingIds = new Set(prev.map(s => s.service_id || s.id));
                        // Filter out suggestions that are already in the project
                        const currentModules = new Set((infraSpec.modules || []).map(m => m.type || m.service_name));

                        const newSuggestions = res.data.suggestions.filter(s =>
                            !existingIds.has(s.service_id) &&
                            !currentModules.has(s.service_id)
                        );

                        return [...prev, ...newSuggestions];
                    });
                }
            } catch (e) {
                console.error("Failed to fetch suggestions:", e);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        if (step === 'review_spec' && !isProcessing) {
            // 1. Load Pattern Suggestions (Deterministic)
            if (infraSpec?.optional_services?.length > 0) {
                const patternSuggestions = infraSpec.optional_services.map(s => ({
                    service_id: s.service_class, // Normalize to service_id
                    ...s
                }));

                setSuggestedServices(prev => {
                    const existingIds = new Set(prev.map(s => s.service_id || s.id));
                    const currentModules = new Set((infraSpec.modules || []).map(m => m.type || m.service_name));

                    const newItems = patternSuggestions.filter(s =>
                        !existingIds.has(s.service_id) &&
                        !currentModules.has(s.service_id)
                    );

                    if (newItems.length === 0) return prev;
                    return [...prev, ...newItems];
                });
            }

            // 2. Fetch AI Suggestions (Creative)
            fetchSuggestions();
        }
    }, [step, isProcessing, infraSpec, architectureData]);

    // 🔥 Fetch User Plan on Mount
    useEffect(() => {
        const fetchUserPlan = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const res = await axios.get(`${API_BASE}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.plan?.plan) {
                    setUserPlan(res.data.plan.plan);
                    console.log("[WORKSPACE] User Plan:", res.data.plan.plan);
                }
            } catch (err) {
                console.error("Failed to fetch user plan:", err);
            }
        };
        fetchUserPlan();
    }, []);

    const handleApiError = (err, fallbackMsg = "An error occurred") => {
        console.error('[API ERROR]', err);
        setIsProcessing(false);

        let errMsg = fallbackMsg;
        if (err.response?.status === 401) {
            errMsg = "Your session has expired. Please login again.";
            toast.error(errMsg);
            setTimeout(() => navigate('/login'), 1500);
        } else if (err.response?.status === 500) {
            errMsg = "Server error occurred. Our team has been notified.";
            setServerError(errMsg);
        } else if (!err.response) {
            errMsg = "Cannot connect to server. Please ensure the backend is running.";
            setServerError(errMsg);
        } else {
            errMsg = err.response?.data?.msg || err.response?.data?.error || errMsg;
            toast.error(errMsg);
        }
        return errMsg;
    };



    // STEP 2.5: Usage Prediction Handler
    const handleAnalyzeUsage = async () => {
        if (isDeployed) {
            setStep('usage_review');
            return;
        }
        if (usageProfile) {
            console.log("Usage profile already exists, skipping redundant AI call.");
            setStep('usage_review');
            return;
        }
        setIsProcessing(true);
        setStep('processing_usage');

        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const res = await axios.post(`${API_BASE}/api/workflow/predict-usage`, {
                intent: aiSnapshot,
                infraSpec: infraSpec
            }, { headers });

            setTimeout(() => {
                setUsageProfile(res.data.data); // Store { usage_profile, rationale }
                setStep('usage_review');
                setIsProcessing(false);
                toast.success("Usage estimates generated!");
            }, 1000);

        } catch (err) {
            handleApiError(err, "Failed to estimate usage.");
            setStep('review_spec');
        }
    };

    // 🔥 SIRI ANIMATION HELPER: Triggers "thinking" state for synchronous transitions
    const transitionToStep = (nextStep, instant = false) => {
        // Unlock the next step if not already unlocked
        if (!unlockedSteps.includes(nextStep)) {
            setUnlockedSteps(prev => [...prev, nextStep]);
        }

        if (instant) {
            setStep(nextStep);
            setIsProcessing(false);
            return;
        }

        setIsProcessing(true); // Triggers .is-thinking class

        setTimeout(() => {
            setStep(nextStep);
            setIsProcessing(false);
        }, 800); // 800ms artificial delay for "intelligence" feel
    };

    // STEP 3: Cost Estimation Handler (Updated to use Usage Profile)
    const handleProceedToCostEstimation = async () => {
        if (isDeployed) {
            transitionToStep('cost_estimation');
            return;
        }

        if (!infraSpec || !aiSnapshot) {
            toast.error("Missing infrastructure data. Please restart.");
            return;
        }

        setIsProcessing(true);
        setStep('processing_cost');
        toast.loading("Analyzing costs across providers...", { id: 'cost-analysis' });

        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            // Send usage profile if available (Layer B activation)
            const payload = {
                infraSpec,
                intent: aiSnapshot,
                cost_profile: costProfile,
                removedServices, // 🔥 Pass the list of services user explicitly removed
                usage_profile: {
                    ...usageProfile?.usage_profile,
                    source: isUsageUserModified ? 'user_provided' : 'ai_inferred'
                }
            };

            // Reset drift states on new analysis
            setIsAssumptionsDrifted(false);
            setInitialDescription(description);

            const response = await axios.post(`${API_BASE}/api/workflow/cost-analysis`, payload, { headers });

            toast.dismiss('cost-analysis');

            if (response.data.step === 'cost_estimation') {
                setTimeout(() => {
                    const data = response.data.data;
                    setCostEstimation(data);

                    // Update infraSpec with sizing data from cost analysis
                    // This ensures TerraformStep has the required sizing information
                    if (data.sizing) {
                        setInfraSpec(prev => ({
                            ...prev,
                            sizing: data.sizing
                        }));
                    }

                    const providerFromRes = data.recommended?.provider || data.recommended_provider;
                    setSelectedProvider(providerFromRes ? providerFromRes.toUpperCase() : null);
                    transitionToStep('cost_estimation');
                    toast.success("Cost analysis complete!");
                }, 100);
            } else {
                throw new Error("Unexpected response from cost analysis");
            }

        } catch (err) {
            toast.dismiss('cost-analysis');
            handleApiError(err, "Failed to analyze costs.");
            transitionToStep('usage_review');
        } finally {
            setIsProcessing(false);
        }
    };


    // Load Workspace Data if ID is present
    useEffect(() => {
        const loadWorkspace = async () => {
            if (!id) return;

            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                const res = await axios.get(`${API_BASE}/api/workspaces/${id}`, { headers });
                const ws = res.data;

                // 🔥 Check if workspace is deployed
                const deploymentStatus = ws.deployment_status || ws.state_json?.deployment?.status || ws.step;
                const isStatusActive = (
                    deploymentStatus === 'DEPLOYED' ||
                    deploymentStatus === 'ACTIVE' ||
                    ws.step === 'active_deployment' ||
                    ws.step === 'deployed' ||
                    ws.step === 'deployment_summary'
                );

                if (isStatusActive) {
                    setIsDeployed(true);
                    setIsProjectLive(true);
                    setStep('deployment_summary'); // 🔥 Set instantly to prevent flashing
                    console.log('[WORKSPACE] Deployed workspace - instant summary redirect');
                    
                    // 🔥 SELF-HEAL: Sync DB status if it was missing flags
                    if (!ws.state_json?.is_deployed) {
                        setTimeout(() => {
                            handleSaveDraft(true, { is_deployed: true, is_live: true, force: true });
                        }, 1000);
                    }
                }

                setWorkspaceId(ws.id);
                setProjectData({ id: ws.project_id, name: ws.name }); // Ensure projectId is set

                // Hydrate State from JSON
                if (ws.state_json) {
                    const savedState = ws.state_json;
                    let hydratedStep = savedState.step || ws.step || 'input';

                    if (savedState.unlockedSteps) {
                        setUnlockedSteps(savedState.unlockedSteps);
                    } else {
                        // Fallback: Unlock current step and everything before it in a reasonable order
                        setUnlockedSteps(['input', hydratedStep]);
                    }

                    // Hydrate deployment method to ensure tabs are correct
                    if (savedState.deploymentMethod) {
                        setDeploymentMethod(savedState.deploymentMethod);
                    } else if (savedState.deployment?.method) {
                        setDeploymentMethod(savedState.deployment.method);
                    }

                    // 🔥 DEPLOYMENT REDIRECT: If project is live, always show summary
                    if (isStatusActive) {
                        hydratedStep = 'deployment_summary';
                    }

                    // MIGRATION: 'confirm_intent' is deprecated. Reset to input to restart flow.
                    if (hydratedStep === 'confirm_intent') {
                        hydratedStep = 'input';
                    }

                    setStep(hydratedStep);
                    setDescription(savedState.description || '');
                    setHistory(savedState.history || []);
                    setCurrentQuestion(savedState.currentQuestion || null);
                    if (savedState.infraSpec) {
                        // 🛡️ CORRUPTION CHECK: Verify infraSpec is valid
                        // If it looks like the diagram object (has architecture prop but no canonical_architecture), reset it.
                        // The 'alias' bug replaced infraSpec with { architecture: {...}, services: [...] }
                        const isCorrupted = (!savedState.infraSpec.canonical_architecture && (savedState.infraSpec.nodes || savedState.infraSpec.architecture));

                        if (isCorrupted) {
                            console.error("[WORKSPACE] Detected corrupted infraSpec (likely overwritten by diagram data). Triggering self-healing.");
                            toast.error("Project data was corrupted. Restoring to initial state...");
                            setInfraSpec(null);
                            setStep('review_spec'); // Force re-analysis
                        } else {
                            setInfraSpec(savedState.infraSpec);
                        }
                    } else {
                        setInfraSpec(null);
                    }

                    // Restore AI snapshot for cost estimation (prevents "missing infrastructure" error)
                    if (savedState.aiSnapshot) {
                        setAiSnapshot(savedState.aiSnapshot);
                    }

                    // Restore cost estimation data
                    if (savedState.costEstimation) {
                        setCostEstimation(savedState.costEstimation);
                    }
                    if (savedState.costProfile) {
                        setCostProfile(savedState.costProfile);
                    }
                    // Restore selected provider - PRIORITY: Saved State > Recommended
                    if (savedState.selected_provider) {
                        console.log("Hydrating Provider from Saved State:", savedState.selected_provider);
                        setSelectedProvider(savedState.selected_provider);
                    }
                    if (savedState.connection) {
                        console.log("Hydrating Connection from Saved State:", savedState.connection);
                        setConnection(savedState.connection);
                    } else if (savedState.connection?.provider) {
                        console.log("Hydrating Provider from Connection:", savedState.connection.provider);
                        setSelectedProvider(savedState.connection.provider);
                    } else if (savedState.costEstimation?.recommended?.provider) {
                        // Only fallback if NO explicit selection existed
                        const rec = savedState.costEstimation.recommended.provider;
                        console.log("Hydrating Provider from Recommendation:", rec);
                        setSelectedProvider(rec);
                    }

                    // 🔥 Hydrate Provisioning State & Outputs
                    if (savedState.provisioning) {
                        setProvisioningState(savedState.provisioning);
                    }
                    if (savedState.infra_outputs) {
                        setInfraOutputs(savedState.infra_outputs);
                        console.log("Hydrating Infra Outputs:", Object.keys(savedState.infra_outputs));
                    }


                    // Restore project live status
                    if (savedState.is_live !== undefined) {
                        setIsProjectLive(savedState.is_live);
                    }
                    if (savedState.is_deployed) {
                        setIsDeployed(savedState.is_deployed);
                    }

                    // Merge saved projectData (spec data) with structural data
                    if (savedState.projectData) {
                        setProjectData(prev => ({ ...prev, ...savedState.projectData }));
                    }

                    // 🔥 Restore Provider Selection
                    if (savedState.selectedProvider || savedState.selected_provider) {
                        setSelectedProvider(savedState.selectedProvider || savedState.selected_provider);
                    } else if (savedState.costEstimation?.recommended?.provider) {
                        // Fallback to recommended if no selection saved
                        setSelectedProvider(savedState.costEstimation.recommended.provider);
                    }

                    // Restore Usage Profile
                    if (savedState.usageProfile) {
                        setUsageProfile(savedState.usageProfile);
                    }

                    // Restore Provisioning State
                    if (savedState.provisioning) {
                        setProvisioningState(savedState.provisioning);
                    }

                    // Restore Removed Services (Recycle Bin)
                    if (savedState.removedServices) {
                        setRemovedServices(savedState.removedServices);

                        // 🔥 FIX: Reconcile infraSpec.modules with removedServices
                        // Filter out any services that are in the removed list to prevent duplicates
                        if (savedState.infraSpec?.modules?.length && savedState.removedServices.length) {
                            const removedIds = new Set(savedState.removedServices.map(r => r.service_name || r.type));
                            setInfraSpec(prev => {
                                if (!prev?.modules) return prev;
                                const filteredModules = prev.modules.filter(m => !removedIds.has(m.service_name || m.type));
                                console.log(`[WORKSPACE] Reconciled modules: ${prev.modules.length} → ${filteredModules.length} (removed ${removedIds.size} services)`);
                                return { ...prev, modules: filteredModules };
                            });
                        }
                    }

                    // Restore Architecture Snapshot
                    if (savedState.diagramImage) {
                        setDiagramImage(savedState.diagramImage);
                    }
                }

                // Set initial description to prevent false assumption drift warnings
                setInitialDescription(description);

                // If loading into a completed state, ensure toast doesn't annoy user, 
                // but console log success
                console.log("Workspace loaded:", ws.name);

            } catch (err) {
                handleApiError(err, "Failed to load workspace.");
                if (err.response?.status === 404) {
                    navigate('/workspaces');
                }
            }
        };

        loadWorkspace();
    }, [id, navigate]);

    const handleAnalyze = async () => {
        if (isDeployed) return;

        // 🔥 VALIDATION GATE
        const validation = validateProjectDescription(description);
        if (!validation.isValid) {
            toast.error(validation.error);
            return;
        }

        setIsProcessing(true);

        setStep('processing');

        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const payload = {
                description: description,
                domains: domains, // Need to add UI for this
                toggles: {
                    traffic: traffic,
                    scaling: 'auto'
                },
                exclusions: {
                    database: dbExcluded
                }
            };

            // V2 API Call
            const res = await axios.post(`${API_BASE}/api/workflow/v2/analyze`, payload, { headers });

            setTimeout(() => {
                const { step: nextStep, data } = res.data;
                setIsProcessing(false);

                // Mapping V2 response to V1 frontend state logic
                if (nextStep === 'infra_spec_generated') {
                    setInfraSpec(data);
                    setProjectData({ name: data.project_name });
                    setAiSnapshot(data.intent); // 🔥 Ensure badges and features load
                    // V2 doesn't have intermediate confirmation step, goes straight to spec
                    transitionToStep('review_spec');
                    toast.success("V2 Architecture Generated Successfully!");
                } else {
                    // Fallback/Legacy logic if V2 behaves differently
                }
                // Fallback for unknown steps
                console.warn("Unknown Step:", nextStep);
                // Stay on processing or go back to input?
                // If we got data but unknown step, maybe error?
                if (!nextStep && !data) {
                    toast.error("Server returned empty response.");
                    transitionToStep('input');
                }
            }, 1200);

        } catch (err) {
            handleApiError(err, "Failed to analyze your request.");
            transitionToStep('input');
        }
    };

    const handleEnhanceRequirements = async () => {
        if (!description || description.trim().length < 10) {
            toast.error("Please enter a bit more detail first.");
            return;
        }

        if (isEnhancing) return;

        setIsEnhancing(true);
        setLastDescription(description);

        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const res = await axios.post(`${API_BASE}/api/ai/enhance-requirements`, {
                text: description
            }, { headers });

            const enhanced = res.data.enhanced;

            // Smoothly replace the text
            setDescription(enhanced);
            setIsEnhanced(true);
            toast.success("Requirements refined by AI!", {
                icon: '✨',
                duration: 4000
            });
        } catch (err) {
            handleApiError(err, "Failed to enhance requirements.");
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleUndoEnhancement = () => {
        if (lastDescription) {
            setDescription(lastDescription);
            setLastDescription('');
            setIsEnhanced(false);
            toast("Reverted to your original text.", { icon: '↩️' });
        }
    };

    const handleConfirmation = async (approvedAnalysis) => {
        if (isDeployed) return;

        setIsProcessing(true);
        setStep('processing');

        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            // 🔥 FIX: Ensure description exists (fallback to stored description or workspace name)
            const finalDescription = description || projectData?.name || "User confirmed intent";

            const res = await axios.post(`${API_BASE}/api/workflow/analyze`, {
                userInput: finalDescription,
                conversationHistory: history,
                input_type: 'CONFIRMATION', // Tell backend user confirmed the intent
                approvedIntent: approvedAnalysis // Send back the logic gate approval
            }, { headers });

            setTimeout(() => {
                const { step: nextStep, data } = res.data;
                setIsProcessing(false);

                // Note: Step 2 returns 'infra_spec_generated' now.
                if (nextStep === 'refine_requirements') {
                    setCurrentQuestion(data);
                    transitionToStep('question');
                } else if (nextStep === 'infra_spec_generated') {
                    setInfraSpec(data);
                    setProjectData({ name: data.project_name });
                    transitionToStep('review_spec');
                    toast.success("Architecture Generated Successfully!");
                }
            }, 1000);
        } catch (err) {
            console.error('[CONFIRMATION ERROR]', err);
            setIsProcessing(false);
            setStep('confirm_intent');

            // Enhanced error messages
            let errMsg = "Failed to confirm and generate architecture.";

            if (err.response?.status === 400) {
                errMsg = err.response?.data?.msg || err.response?.data?.error || "Invalid confirmation data. Please try again.";
            } else if (err.response?.status === 401) {
                errMsg = "Session expired. Please login again.";
                setTimeout(() => navigate('/'), 1500);
            } else if (err.response?.status === 500) {
                errMsg = "Server error during architecture generation. Please try again.";
            } else if (!err.response) {
                errMsg = "Network error. Please check your connection.";
            } else {
                errMsg = err.response?.data?.msg || err.response?.data?.error || errMsg;
            }

            toast.error(errMsg, { duration: 5000 });
        }
    };
    const handleAnswerQuestion = async (answer) => {
        if (isDeployed) return;

        setSelectedOption(answer);

        setTimeout(async () => {
            const newHistory = [
                ...history,
                { role: 'user', content: description },
                { role: 'assistant', content: currentQuestion.clarifying_question },
                { role: 'user', content: answer }
            ];
            setHistory(newHistory);
            setCurrentQuestion(null);
            setSelectedOption(null);
            setIsProcessing(true);
            setStep('processing_spec');

            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                const res = await axios.post(`${API_BASE}/api/workflow/analyze`, {
                    // DO NOT send answer as userInput - it causes AI re-analysis
                    userInput: description, // Keep original description for context
                    conversationHistory: newHistory,
                    input_type: 'AXIS_ANSWER', // Tell backend this is an MCQ answer, NOT a description
                    ai_snapshot: aiSnapshot || currentQuestion?.full_analysis // Send frozen snapshot
                }, { headers });

                setTimeout(() => {
                    const { step: nextStep, data } = res.data;
                    setIsProcessing(false);

                    // Update snapshot if backend returns a new one
                    if (data?.full_analysis) {
                        setAiSnapshot(data.full_analysis);
                    }

                    if (nextStep === 'refine_requirements') {
                        setCurrentQuestion(data);
                        transitionToStep('question');
                    } else if (nextStep === 'confirm_intent') {
                        setCurrentQuestion(data);
                        transitionToStep('confirm_intent');
                    } else if (nextStep === 'infra_spec_generated') {
                        setInfraSpec(data);
                        setProjectData({ name: data.project_name });
                        transitionToStep('review_spec');
                        toast.success("Architecture Refined & Generated!");
                    }
                }, 1200);

            } catch (err) {
                handleApiError(err, "Failed to process your answer.");
                transitionToStep('question');
            }
        }, 600);
    };

    const handleSaveDraft = async (silent = false, overrides = {}) => {
        const targetStep = overrides.step || step;

        if (isDeployed && !overrides.force) {
            console.log("Draft save skipped: Project is deployed (read-only)");
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const payload = {
                workspaceId, // Send existing ID if available to perform UPDATE
                projectId: projectData?.id, // Send project ID if available
                name: projectData?.name || `Draft ${new Date().toLocaleTimeString()}`,
                step: targetStep,
                state: {
                    history,
                    description,
                    currentQuestion,
                    infraSpec: overrides.infraSpec || infraSpec,
                    projectData,
                    aiSnapshot,
                    costEstimation,
                    costProfile,
                    usageProfile, // 🔥 Persist Usage Profile
                    removedServices: overrides.removedServices || removedServices, // 🔥 Persist Removed Services (with override support)
                    diagramImage, // 🔥 Persist high-res snapshot for report

                    selectedProvider, // 🔥 Persist the user's choice (Standardized)
                    selected_provider: selectedProvider, // Legacy support
                    connection, // 🔥 Persist connection metadata
                    provisioning: overrides.provisioning || provisioningState, // 🔥 Persist Provisioning State
                    is_live: overrides.is_live !== undefined ? overrides.is_live : isProjectLive, // 🔥 Persist Live status for dashboard toggle
                    is_deployed: overrides.is_deployed !== undefined ? overrides.is_deployed : isDeployed, // 🔥 Persist Deployed status
                    deploymentMethod, // 🔥 Persist deployment method for tab consistency
                    unlockedSteps, // 🔥 Persist navigation progress
                    architectureData, // 🔥 Persist for sharing/export in selector
                    step
                }
            };

            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const res = await axios.post(`${API_BASE}/api/workspaces/save`, payload, { headers });

            // Update local state with the returned ID so future saves are Updates
            setWorkspaceId(res.data.workspaceId);
            if (res.data.projectId) {
                setProjectData(prev => ({ ...prev, id: res.data.projectId }));
            }

            if (!silent) {
                toast.success(`Draft ${workspaceId ? 'Updated' : 'Saved'} Successfully!`);
            }

        } catch (err) {
            if (!silent) {
                handleApiError(err, "Failed to save draft.");
            } else {
                console.error("Silent Save Error:", err);
            }
        }
    };

    // Auto-save when step changes
    useEffect(() => {
        if (step && workspaceId && step !== 'input' && step !== 'processing' && !isDeployed) {
            // Debounce auto-save to prevent spam
            const timer = setTimeout(() => {
                handleSaveDraft(true); // Silent save
                console.log(`[Auto-save] Step: ${step}`);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [step, infraSpec, costEstimation, isDeployed]);




    // 🔥 NEW: Auto-Deployment Handler (Triggered by Terraform Load)
    const handleAutoDeploy = async () => {
        if (isDeployed) return;

        // Optimistic UI Update: Show "Live" toggle immediately
        setIsDeployed(true);
        toast.success('🚀 Project marked as Live!', { duration: 3000 });

        try {
            console.log('[DEPLOY] Auto-deploying workspace...');
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.put(`${API_BASE}/api/workspaces/${id}/deploy`, {
                deployment_method: 'self',
                provider: selectedProvider
            }, { headers });

        } catch (error) {
            console.error('[DEPLOY ERROR]', error);
        }
    };

    // 🔥 NEW: Add Suggested Service
    const handleAddService = () => {
        if (isDeployed || !selectedAvailableService) return;

        const service = selectedAvailableService;

        // Construct module object
        const moduleToAdd = {
            service_name: service.name || service.service_id || service.id,
            type: service.service_class || service.service_id || service.id,
            category: service.category || 'other',
            provider: selectedProvider || 'AZURE', // Default to current provider
            description: service.description,
            is_suggestion_added: true
        };

        setInfraSpec(prev => ({
            ...prev,
            modules: [...(prev.modules || []), moduleToAdd]
        }));

        // Remove from suggestions to hide it
        setSuggestedServices(prev => prev.filter(s =>
            (s.service_id || s.id || s.service_class) !== (service.service_id || service.id)
        ));

        setIsPopupOpen(false);
        setSelectedAvailableService(null);
        toast.success(`Added ${moduleToAdd.service_name} to architecture.`);
        setTimeout(() => handleSaveDraft(true), 100);
    };

    // 🔥 NEW: Handle Module Removal from Specification Step
    const handleRemoveModule = async (moduleName) => {
        if (isDeployed) return;

        // Find the module object
        const moduleToRemove = infraSpec.modules.find(m => (m.service_name || m.type) === moduleName);
        if (!moduleToRemove) return;

        // Critical Service Warning
        const isCritical = ['compute', 'database', 'storage'].includes(moduleToRemove.category);
        const warningMsg = isCritical
            ? `⚠️ WARNING: You are removing a CRITICAL component (${moduleName}).\n\nThis may make your architecture non-functional or cause data loss logic gaps.\n\nAre you sure you want to move this to the Removed Bin?`
            : `Are you sure you want to remove ${moduleName}? It will be moved to the Removed Bin and excluded from costs.`;

        if (!window.confirm(warningMsg)) {
            return;
        }

        try {
            console.log(`[SPEC] Removing module: ${moduleName}`);

            // 1. Calculate new state synchronously
            const updatedModules = infraSpec.modules.filter(m => (m.service_name || m.type) !== moduleName);
            const updatedRemovedServices = [...removedServices, moduleToRemove];

            // 🔥 DEEP FILTER: Ensure the service is removed from all internal tracking fields
            const updatedInfraSpec = { ...infraSpec, modules: updatedModules };

            if (updatedInfraSpec.canonical_architecture?.deployable_services) {
                updatedInfraSpec.canonical_architecture.deployable_services =
                    updatedInfraSpec.canonical_architecture.deployable_services.filter(s => {
                        const svcId = s.service_id || s.service_class || s.id;
                        return svcId !== moduleName;
                    });
            }

            if (updatedInfraSpec.service_classes?.required_services) {
                updatedInfraSpec.service_classes.required_services =
                    updatedInfraSpec.service_classes.required_services.filter(s => {
                        const svcId = typeof s === 'string' ? s : (s.service_id || s.service_class || s.id);
                        return svcId !== moduleName;
                    });
            }

            // 2. Update React state
            setInfraSpec(updatedInfraSpec);
            setRemovedServices(updatedRemovedServices);

            // 3. Trigger Save with updated values (fixes stale closure bug)
            toast.success(`${moduleName} moved to Removed Services.`);
            setTimeout(() => handleSaveDraft(true, {
                infraSpec: updatedInfraSpec,
                removedServices: updatedRemovedServices
            }), 100);

        } catch (err) {
            console.error('[REMOVE ERROR]', err);
            toast.error("Failed to remove module.");
        }
    };

    // 🔥 NEW: Check for Restore
    const handleRestoreModule = (moduleName) => {
        if (isDeployed) return;
        const moduleRestored = removedServices.find(m => (m.service_name || m.type) === moduleName);
        if (!moduleRestored) return;

        // 1. Calculate new state synchronously
        const updatedRemovedServices = removedServices.filter(m => (m.service_name || m.type) !== moduleName);

        // 🔥 DEEP RESTORE: Re-inject the service into all tracking fields
        const updatedInfraSpec = {
            ...infraSpec,
            modules: [...(infraSpec.modules || []), moduleRestored]
        };

        // Restore to deployable_services if tracked
        if (updatedInfraSpec.canonical_architecture?.deployable_services) {
            const restoredSvc = {
                service_id: moduleRestored.service_name || moduleRestored.type,
                service_class: moduleRestored.service_name || moduleRestored.type,
                terraform: { supported: true }
            };
            updatedInfraSpec.canonical_architecture.deployable_services.push(restoredSvc);
        }

        // Restore to required_services if tracked
        if (updatedInfraSpec.service_classes?.required_services) {
            updatedInfraSpec.service_classes.required_services.push(moduleRestored.service_name || moduleRestored.type);
        }

        // 2. Update React state
        setInfraSpec(updatedInfraSpec);
        setRemovedServices(updatedRemovedServices);

        // 3. Trigger Save with updated values (fixes stale closure bug)
        toast.success(`${moduleName} restored to architecture.`);
        setTimeout(() => handleSaveDraft(true, {
            infraSpec: updatedInfraSpec,
            removedServices: updatedRemovedServices
        }), 100);
    };

    const isReadOnly = isProjectLive || isDeployed || provisioningState?.infra_provisioned;

    return (
        <div className="flex flex-col min-h-screen bg-background text-white font-inter relative selection:bg-primary/30 transition-all duration-500">
            <NetworkBackground opacity={0.5} centerClearance={0.8} />
            <Toaster position="top-right" toastOptions={{
                style: {
                    background: 'var(--color-surface, #171E2B)',
                    color: '#fff',
                    border: '1px solid var(--color-border, #2E3645)'
                }
            }} />

            {/* Global Error Banner */}
            {serverError && (
                <div className="fixed top-0 left-0 right-0 z-[1000] bg-red-600/95 backdrop-blur-md text-white p-4 shadow-2xl flex items-center justify-center gap-6 animate-slide-down border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-white animate-pulse" size={24} />
                        <span className="font-bold text-lg tracking-wide">{serverError}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setServerError(null); window.location.reload(); }}
                            className="px-6 py-2 bg-white text-red-600 rounded-xl text-sm font-black hover:bg-gray-100 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                        >
                            RECONNECT NOW
                        </button>
                        <button
                            onClick={() => setServerError(null)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            title="Dismiss"
                        >
                            <X className="text-white" size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col min-h-full flex-1">
                <Toaster position="top-right" />

                <div className="flex-1 overflow-y-auto">
                    <div className="relative z-10 p-8 pt-6">
                        <AnimatePresence mode="wait">
                            {!step ? (
                                <motion.div
                                    key="initial-loader"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-fade-in"
                                >
                                    <div className="relative">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="w-20 h-20 rounded-full border-4 border-brand-500/10 border-t-brand-500 shadow-lg shadow-brand-500/20"
                                        />
                                        <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-brand-500 animate-pulse" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-display font-black text-white italic tracking-tight">Initializing Workspace</p>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2 animate-pulse">Syncing environment state...</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className="max-w-[1400px] mx-auto overflow-visible"
                                >
                                    {/* STEP: INPUT (Premium Creation Interface) */}
                                    {step === 'input' && (
                                        <div className="max-w-5xl mx-auto space-y-12 py-12">
                                            <div className="text-center space-y-4">
                                                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                                                    Describe your <span className="text-brand-400">service vision</span>.
                                                </h1>
                                                <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                                                    The AI engine will synthesize a high-fidelity cloud architecture, Terraform blueprints, and cost forecasts.
                                                </p>
                                            </div>

                                            <div className="glass-premium rounded-[2.5rem] p-8 shadow-2xl relative group overflow-hidden border-white/[0.03]">
                                                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

                                                <div className="space-y-8">
                                                    {/* Technical Context Bar */}
                                                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                                                            <Layers size={14} /> Multi-Cloud Routing
                                                        </div>
                                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                                                            <ShieldCheck size={14} /> Security-First
                                                        </div>
                                                    </div>

                                                    <div className="relative">
                                                        <textarea
                                                            value={description}
                                                            onChange={(e) => {
                                                                setDescription(e.target.value);
                                                                if (isEnhanced) setIsEnhanced(false);
                                                            }}
                                                            disabled={isReadOnly}
                                                            placeholder={isReadOnly ? "Project is live. Configuration is read-only." : "E.g., High-traffic E-commerce API with Redis caching, PostgreSQL db, and autoscaling containers on AWS..."}
                                                            className={`w-full h-48 bg-white/[0.02] border border-white/5 rounded-3xl p-8 text-xl text-white placeholder-slate-600 focus:border-brand-500/30 focus:bg-white/[0.04] outline-none transition-all resize-none shadow-inner ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        />


                                                        <div className="absolute bottom-4 right-4 flex items-center gap-4">
                                                            <AnimatePresence mode="wait">
                                                                {!isEnhanced ? (
                                                                    <motion.button
                                                                        key="enhance"
                                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                                        onClick={handleEnhanceRequirements}
                                                                        disabled={isReadOnly || isEnhancing || description.trim().length < 10}
                                                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-widest hover:bg-brand-500/20 transition-all ${isReadOnly || isEnhancing || description.trim().length < 10 ? 'opacity-30 pointer-events-none' : ''}`}
                                                                    >
                                                                        {isEnhancing ? (
                                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                                        ) : (
                                                                            <Sparkles className="w-3 h-3" />
                                                                        )}
                                                                        <span>{isEnhancing ? 'Refining...' : 'AI Enhance'}</span>
                                                                    </motion.button>
                                                                ) : (
                                                                    <motion.button
                                                                        key="undo"
                                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                                        onClick={handleUndoEnhancement}
                                                                        disabled={isReadOnly}
                                                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all ${isReadOnly ? 'opacity-30 pointer-events-none' : ''}`}
                                                                    >
                                                                        <Undo2 className="w-3 h-3" />
                                                                        <span>Undo AI</span>
                                                                    </motion.button>
                                                                )}
                                                            </AnimatePresence>

                                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                                {description.length} Characters
                                                            </span>
                                                            <button
                                                                onClick={handleAnalyze}
                                                                disabled={isReadOnly || isEnhancing || description.trim().length < 10}
                                                                className={`flex items-center gap-3 px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all transform hover:scale-[1.02] shadow-xl shadow-brand-500/20 ${isReadOnly || isEnhancing || description.trim().length < 10 ? 'opacity-30 pointer-events-none' : ''}`}
                                                            >
                                                                {isEnhancing ? <Loader2 className="animate-spin" /> : <Rocket size={18} />}
                                                                <span>Initialize Build</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP: PROCESSING ANIMATION */}
                                    {(step === 'processing' || step === 'processing_spec') && (
                                        <div className="flex flex-col items-center justify-center h-[60vh] space-y-8 animate-fade-in">
                                            <div className="relative w-24 h-24">
                                                <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                                                <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Cpu size={32} className="text-white animate-pulse" />
                                                </div>
                                            </div>
                                            <div className="text-center space-y-2">
                                                <h2 className="text-2xl font-black text-white uppercase tracking-widest">
                                                    {step === 'processing' ? 'Synthesizing Intent' : 'Generating Topology'}
                                                </h2>
                                                <p className="text-slate-500 font-medium animate-pulse">Architecting production-grade infrastructure...</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP: QUESTION (AI Clarification) */}
                                    {step === 'question' && currentQuestion && (
                                        <div className="space-y-8 animate-fade-in-up max-w-4xl mx-auto mt-12">
                                            <div className="text-center space-y-4">
                                                <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-500/20 shadow-lg shadow-brand-500/10">
                                                    <Bot size={32} className="text-brand-400" />
                                                </div>
                                                <h2 className="text-3xl font-black text-white uppercase tracking-widest leading-none">Clarifying Requirements</h2>
                                                <p className="text-slate-400 text-lg font-medium">{currentQuestion.clarifying_question}</p>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {currentQuestion.suggested_options?.map((opt, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleAnswerQuestion(typeof opt === 'object' ? (opt.value || opt.label) : opt)}
                                                        className={`p-6 glass-card rounded-2xl text-left transition-all group relative overflow-hidden border-white/5 hover:border-brand-500/30
                                                    ${selectedOption === (typeof opt === 'object' ? (opt.value || opt.label) : opt) ? 'border-brand-500 bg-brand-500/5' : ''}`}
                                                    >
                                                        <div className="relative z-10 flex items-center justify-between">
                                                            <div>
                                                                <div className="text-lg font-bold text-white mb-1">{typeof opt === 'object' ? opt.label : opt}</div>
                                                                {opt.description && <div className="text-sm text-slate-500 font-medium line-clamp-2">{opt.description}</div>}
                                                            </div>
                                                            <ArrowRight size={20} className="text-slate-600 group-hover:text-brand-400 transition-colors" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP: REVIEW SPEC (Architecture) */}
                                    {step === 'review_spec' && infraSpec && (
                                        <div className="space-y-8 animate-fade-in">
                                            <div className="flex justify-end mb-8">
                                                <button
                                                    onClick={() => transitionToStep('input')}
                                                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                                >
                                                    Edit Intent
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                <div className="lg:col-span-2 space-y-6">
                                                    {/* Technical Summary */}
                                                    <div className="glass-premium rounded-3xl p-8 border-white/5 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-[60px]" />
                                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                            <Info size={14} /> Executive Summary
                                                        </h3>
                                                        <p className="text-xl text-white font-medium leading-relaxed">
                                                            "{infraSpec.project_summary || 'Proposed architecture for a modern cloud application.'}"
                                                        </p>
                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
                                                            <div>
                                                                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Architecture</div>
                                                                <div className="text-xs font-bold text-white uppercase">{infraSpec.architecture_pattern?.replace(/_/g, ' ') || 'Web App'}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Traffic Tier</div>
                                                                <div className="text-xs font-bold text-brand-400 uppercase">{infraSpec.assumptions?.traffic_tier || 'Balanced'}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Scalability</div>
                                                                <div className="text-xs font-bold text-white">Auto-scaling</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Cloud Target</div>
                                                                <div className="text-xs font-bold text-white uppercase">{selectedProvider || 'AWS'}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Service List (Render style technical rows) */}
                                                    <div className="space-y-4">
                                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Infrastructure Components</h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {infraSpec.modules?.map((mod, idx) => (
                                                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/40 border border-white/5 rounded-2xl hover:border-brand-500/20 transition-all group">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-brand-500/10 group-hover:text-brand-400 transition-all">
                                                                            {mod.category === 'compute' ? <Cpu size={20} /> : mod.category === 'storage' ? <Database size={20} /> : <Box size={20} />}
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-sm font-bold text-white">{mod.service_name || mod.type}</div>
                                                                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5">{mod.category}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        {!isDeployed && (
                                                                            <button
                                                                                onClick={() => handleRemoveModule(mod.service_name || mod.type)}
                                                                                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                                                                            >
                                                                                <X size={14} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    {/* AI Understanding Rationale */}
                                                    <div className="glass-card p-6 rounded-3xl border-brand-500/10 bg-brand-500/[0.02]">
                                                        <h4 className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                            <Sparkles size={14} /> Architecture Rationale
                                                        </h4>
                                                        <ul className="space-y-4">
                                                            {infraSpec.explanations?.slice(0, 4).map((exp, idx) => (
                                                                <li key={idx} className="flex gap-3">
                                                                    <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-500/50" />
                                                                    <p className="text-[11px] text-slate-400 leading-relaxed">{exp}</p>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    {/* Proceed Action */}
                                                    <div className="p-6 rounded-3xl bg-slate-900 border border-white/5">
                                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Execution Phase</h4>
                                                        <button
                                                            onClick={handleAnalyzeUsage}
                                                            disabled={isProcessing || isDeployed}
                                                            className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-black text-[12px] uppercase tracking-widest rounded-2xl transition-all transform hover:scale-[1.02] shadow-xl shadow-brand-500/20 flex items-center justify-center gap-3 disabled:opacity-30 disabled:pointer-events-none"
                                                        >
                                                            Forecast Costs
                                                            <ArrowRight size={18} />
                                                        </button>
                                                        <p className="text-[10px] text-center text-slate-600 mt-4 font-medium uppercase tracking-tighter">
                                                            Generates Infracost JSON & Billing simulation
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP: USAGE REVIEW */}
                                    {step === 'usage_review' && usageProfile && (
                                        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto py-12">

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {[
                                                    { key: 'monthly_users', label: 'Scale: Active Users', icon: Users, color: 'brand' },
                                                    { key: 'data_transfer_gb', label: 'Network: Bandwidth (GB)', icon: Activity, color: 'blue' },
                                                    { key: 'data_storage_gb', label: 'Storage: Persistent (GB)', icon: Database, color: 'purple' }
                                                ].map((item) => (
                                                    <div key={item.key} className="glass-premium p-8 rounded-[2rem] border-white/5 group relative overflow-hidden">
                                                        <div className={`absolute top-0 right-0 p-4 text-${item.color}-500 opacity-10 group-hover:opacity-20 transition-opacity`}>
                                                            <item.icon size={48} />
                                                        </div>
                                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">{item.label}</h3>

                                                        <div className="flex items-end gap-3 mb-8">
                                                            <div className="space-y-2 flex-1">
                                                                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Expected Max</div>
                                                                <input
                                                                    type="number"
                                                                    value={usageProfile?.usage_profile?.[item.key]?.max || 0}
                                                                    disabled={isDeployed}
                                                                    onChange={(e) => {
                                                                        const val = parseInt(e.target.value) || 0;
                                                                        setUsageProfile(prev => {
                                                                            const baseProfile = prev?.usage_profile || {};
                                                                            const itemProfile = baseProfile[item.key] || {};
                                                                            return {
                                                                                ...prev,
                                                                                usage_profile: {
                                                                                    ...baseProfile,
                                                                                    [item.key]: { ...itemProfile, max: val }
                                                                                }
                                                                            };
                                                                        });
                                                                        setIsUsageUserModified(true);
                                                                    }}
                                                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white font-black text-lg focus:border-brand-500/30 outline-none transition-all disabled:opacity-50"
                                                                />
                                                            </div>
                                                        </div>

                                                        <p className="text-[11px] text-slate-500 italic leading-relaxed">
                                                            "{usageProfile?.rationale?.[item.key] || 'Calculated based on workload patterns.'}"
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            {!isDeployed && (
                                                <div className="flex justify-between items-center pt-12 border-t border-white/5">
                                                    <button
                                                        onClick={() => transitionToStep('review_spec')}
                                                        className="px-6 py-3 rounded-xl bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                                                    >
                                                        <ArrowLeft size={14} /> Topology Review
                                                    </button>
                                                    <div className="flex gap-4">
                                                        <button
                                                            onClick={() => { setCostProfile('cost_effective'); handleProceedToCostEstimation(); }}
                                                            className="px-8 py-4 bg-slate-900 border border-white/5 hover:border-brand-500/30 text-white font-black text-[12px] uppercase tracking-widest rounded-2xl transition-all shadow-xl"
                                                        >
                                                            Cost Effective
                                                        </button>
                                                        <button
                                                            onClick={() => { setCostProfile('high_performance'); handleProceedToCostEstimation(); }}
                                                            className="px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-black text-[12px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-brand-500/20"
                                                        >
                                                            High Performance
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* STEP: COST ESTIMATION */}
                                    {step === 'cost_estimation' && costEstimation && (
                                        <div className="space-y-8 overflow-y-hidden animate-fade-in">

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {(costEstimation.rankings || []).map((rank) => {
                                                    const isSelected = selectedProvider === rank.provider;
                                                    return (
                                                        <div
                                                            key={rank.provider}
                                                            onClick={() => !isDeployed && setSelectedProvider(rank.provider.toUpperCase())}
                                                            className={`rounded-[2rem] p-8 border transition-all duration-500 relative overflow-hidden group
                                                        ${isSelected ? 'bg-brand-500/10 border-brand-500 shadow-2xl shadow-brand-500/10' : 'bg-slate-900/40 border-white/5 hover:border-white/20'}
                                                        ${isDeployed ? 'cursor-default' : 'cursor-pointer'}`}
                                                        >
                                                            {rank.recommended && (
                                                                <div className="absolute top-4 right-4 px-2 py-0.5 bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                                                                    Recommended
                                                                </div>
                                                            )}

                                                            <div className="flex flex-col h-full justify-between relative z-10">
                                                                <div>
                                                                    <div className="flex items-center gap-3 mb-6">
                                                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-brand-500/10 group-hover:text-brand-400 transition-all">
                                                                            <Box size={24} />
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-xl font-black text-white tracking-tight">{rank.provider}</div>
                                                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{rank.score}% Match</div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-1">
                                                                        <div className="text-3xl font-black text-white">{rank.formatted_cost || `$${rank.monthly_cost?.toFixed(2)}`}</div>
                                                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estimated Monthly</div>
                                                                    </div>
                                                                </div>
                                                                {/* Show the cost profile used for this provider */}
                                                                {(() => {
                                                                    // Try to find which profile was used for this provider
                                                                    let profileUsed = 'standard'; // default fallback

                                                                    if (costEstimation.scenarios) {
                                                                        // Check each profile to see if this provider has data
                                                                        for (const [profileName, providers] of Object.entries(costEstimation.scenarios)) {
                                                                            if (providers[rank.provider]) {
                                                                                profileUsed = profileName;
                                                                                break;
                                                                            }
                                                                        }
                                                                    }

                                                                    return (
                                                                        <div className="text-[10px] text-gray-400">
                                                                            {profileUsed.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} profile
                                                                        </div>
                                                                    );
                                                                })()}
                                                                {rank.recommended && costEstimation?.recommendation_facts?.facts?.dominant_drivers?.[0] && (
                                                                    <div className="text-[10px] text-amber-400 italic mt-1">
                                                                        {`${costEstimation.recommendation_facts.facts.dominant_drivers[0].name} is a key cost driver at your usage level.`}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {isSelected && (
                                                                <div className="mt-4 pt-3 border-t border-primary/20 flex items-center justify-between text-[10px] text-primary font-bold uppercase tracking-wider">
                                                                    <span>Selected</span>
                                                                    <CheckCircle2 className="text-green-400" size={12} />
                                                                </div>
                                                            )}

                                                            {/* 🆕 SERVICE BREAKDOWN DROPDOWN */}
                                                            {(() => {
                                                                // Get services for this provider from scenarios or breakdown
                                                                const providerData = costEstimation.scenarios?.cost_effective?.[rank.provider] ||
                                                                    costEstimation.scenarios?.high_performance?.[rank.provider] ||
                                                                    costEstimation[rank.provider.toLowerCase()] || {};
                                                                const services = providerData.services || providerData.breakdown || [];

                                                                if (!services.length) return null;

                                                                return (
                                                                    <details className="mt-3 group" onClick={(e) => e.stopPropagation()}>
                                                                        <div className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1 text-[10px]">
                                                                            {services.map((svc, idx) => {
                                                                                const serviceName = svc.name || svc.service || svc.service_id || 'Service';
                                                                                const cost = svc.monthly_cost ?? svc.cost ?? 0;
                                                                                const reason = svc.reasoning || svc.reason || svc.pricing_note || (cost === 0 ? 'Usage-based / Free tier' : 'Infrastructure cost');

                                                                                return (
                                                                                    <details key={idx} className="bg-white/5 rounded-lg p-2 group/svc">
                                                                                        <summary className="cursor-pointer flex justify-between items-center">
                                                                                            <span className="text-gray-300 truncate flex-1">{serviceName}</span>
                                                                                            <span className={`font-mono font-bold ml-2 ${cost > 0 ? 'text-primary' : 'text-gray-500'}`}>
                                                                                                ${typeof cost === 'number' ? cost.toFixed(2) : cost}
                                                                                            </span>
                                                                                        </summary>
                                                                                        <div className="mt-1 pt-1 border-t border-white/5 text-[9px] text-gray-500 italic">
                                                                                            💡 {reason}
                                                                                        </div>
                                                                                    </details>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </details>
                                                                );
                                                            })()}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* 🆕 WHY THIS PROVIDER? - Collapsible Dropdown */}
                                            {(() => {
                                                const recommended = (costEstimation.rankings || []).find(r => r.recommended);
                                                const selected = (costEstimation.rankings || []).find(r => r.provider === selectedProvider);
                                                const target = selected || recommended;

                                                if (!target) return null;

                                                // Provider strengths database
                                                const providerStrengths = {
                                                    'AWS': {
                                                        strengths: ['Largest service catalog', 'Most mature ML/AI services', 'Best-in-class serverless (Lambda)', 'Global infrastructure'],
                                                        bestFor: ['Enterprise workloads', 'ML/AI applications', 'Scalable architectures', 'Multi-region deployments']
                                                    },
                                                    'GCP': {
                                                        strengths: ['Cost-effective compute', 'Superior Kubernetes (GKE)', 'Advanced analytics', 'Strong ML tooling'],
                                                        bestFor: ['Data analytics', 'Machine learning', 'Container workloads', 'Startups & scale-ups']
                                                    },
                                                    'AZURE': {
                                                        strengths: ['Enterprise integration', 'Hybrid cloud leader', 'Microsoft ecosystem', 'Strong compliance'],
                                                        bestFor: ['Enterprise IT', 'Hybrid deployments', 'Microsoft stack users', 'Regulated industries']
                                                    }
                                                };

                                                const sortedByPrice = [...(costEstimation.rankings || [])].sort((a, b) => (a.monthly_cost || 0) - (b.monthly_cost || 0));
                                                const cheapest = sortedByPrice[0];
                                                const isCheapest = target.provider === cheapest?.provider;
                                                const providerName = target.provider === 'AZURE' ? 'Azure' : target.provider;
                                                const targetInfo = {
                                                    strengths: target.pros?.length > 0 ? target.pros : (providerStrengths[target.provider]?.strengths || []),
                                                    bestFor: target.best_for?.length > 0 ? target.best_for : (providerStrengths[target.provider]?.bestFor || [])
                                                };

                                                return (
                                                    <details className="group glass-panel rounded-2xl transition-all hover:border-primary/30">
                                                        <summary className="px-6 py-4 cursor-pointer flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold
                                                        ${target.provider === 'AWS' ? 'bg-[#FF9900]/20 text-[#FF9900]' :
                                                                        target.provider === 'GCP' ? 'bg-[#4285F4]/20 text-[#4285F4]' : 'bg-[#0078D4]/20 text-[#0078D4]'}`}>
                                                                    {target.provider === 'AWS' ? 'AWS' : target.provider === 'GCP' ? 'GCP' : 'AZ'}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-white">Why {providerName}?</h4>
                                                                    <p className="text-xs text-gray-400">Click to see why this provider is recommended</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                {target.recommended && (
                                                                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-bold rounded-full">
                                                                        ✓ Best Match
                                                                    </span>
                                                                )}
                                                                <ChevronDown className="text-gray-400 group-open:rotate-180 transition-transform" size={18} />
                                                            </div>
                                                        </summary>

                                                        <div className="px-6 pb-6 space-y-4 animate-fade-in">
                                                            {/* Main Explanation */}
                                                            <p className="text-sm text-gray-200 leading-relaxed">
                                                                Based on your <span className="text-primary font-semibold">{costProfile.replace('_', ' ')}</span> profile
                                                                and project requirements, <span className="text-white font-semibold">{providerName}</span> is
                                                                {isCheapest ?
                                                                    ` the most cost-effective option at ${target.formatted_cost || `$${target.monthly_cost?.toFixed(2)}/mo`}` :
                                                                    ` your best choice at ${target.formatted_cost || `$${target.monthly_cost?.toFixed(2)}/mo`}`
                                                                }.
                                                            </p>

                                                            {/* Provider Strengths */}
                                                            {(targetInfo.strengths || []).length > 0 && (
                                                                <div className="space-y-2">
                                                                    <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Why {providerName} Works For You</div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {targetInfo.strengths.slice(0, 4).map((strength, idx) => (
                                                                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                                                                                <CheckCircle2 className="text-green-400" size={14} />
                                                                                {strength}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Best For */}
                                                            {Array.isArray(targetInfo.bestFor) && targetInfo.bestFor.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 pt-2">
                                                                    {targetInfo.bestFor.slice(0, 4).map((use, idx) => (
                                                                        <span key={idx} className="px-2 py-1 bg-white/5 text-gray-400 text-[10px] rounded-full border border-white/10">
                                                                            {use}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Score Summary */}
                                                            <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                                                <div className="flex items-center gap-6 text-xs">
                                                                    <div>
                                                                        <span className="text-gray-400">Overall Score</span>
                                                                        <div className="text-lg font-bold text-primary">{target.score || target.final_score}%</div>
                                                                    </div>
                                                                    {target.cost_score && (
                                                                        <div>
                                                                            <span className="text-gray-400">Cost</span>
                                                                            <div className="text-lg font-bold text-green-400">{target.cost_score}</div>
                                                                        </div>
                                                                    )}
                                                                    {target.performance_score && (
                                                                        <div>
                                                                            <span className="text-gray-400">Performance</span>
                                                                            <div className="text-lg font-bold text-blue-400">{target.performance_score}</div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-[10px] text-gray-500 uppercase">Estimated Monthly</div>
                                                                    <div className="text-xl font-bold text-white">{target.formatted_cost || `$${target.monthly_cost?.toFixed(2)}`}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </details>
                                                );
                                            })()}

                                            {/* 🆕 CONFIDENCE DETAILS COLLAPSIBLE */}
                                            <details className="group glass-panel rounded-2xl transition-all hover:border-primary/30">
                                                <summary className="px-6 py-4 cursor-pointer flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <CheckCircle2 className="text-green-400" size={18} />
                                                        <span className="font-bold text-white">Confidence Details</span>
                                                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-bold">
                                                            {costEstimation.confidence_percentage || Math.round((costEstimation.confidence || 0) * 100)}%
                                                        </span>
                                                    </div>
                                                    <ChevronDown className="text-gray-400 group-open:rotate-180 transition-transform" size={18} />
                                                </summary>
                                                <div className="px-6 pb-6 space-y-6 animate-fade-in">
                                                    <div className="space-y-4">
                                                        <p className="text-sm text-gray-300 leading-relaxed">
                                                            Confidence is based on the <strong className="text-white">"weakest link"</strong> principle — the overall score is capped by the lowest individual factor. This ensures we never over-promise on accuracy when data is missing.
                                                        </p>

                                                        {/* 🆕 Methodology Section */}
                                                        <div className="bg-brand-500/5 rounded-2xl p-6 border border-brand-500/10">
                                                            <h5 className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                <Calculator size={12} /> Calculation Methodology
                                                            </h5>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div className="space-y-1">
                                                                    <div className="text-[11px] font-bold text-white">Infrastructure Cost</div>
                                                                    <div className="text-[10px] text-gray-400 leading-relaxed">Calculated via provider-specific heuristic modeling based on {selectedProvider}'s current regional price list for {usageProfile?.usage_profile?.scaling || 'standard'} workloads. We prioritize "On-Demand" pricing for conservatism.</div>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <div className="text-[11px] font-bold text-white">Data & Storage</div>
                                                                    <div className="text-[10px] text-gray-400 leading-relaxed">Derived from your predicted {usageProfile?.usage_profile?.data_transfer_gb?.max || 'monthly'} GB egress and object storage utilization at standard tier rates across regional zones.</div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-6 pt-6 border-t border-white/5">
                                                                <h5 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                    <BarChart3 size={12} /> Cost Breakdown Logic
                                                                </h5>
                                                                <ul className="space-y-3">
                                                                    <li className="flex gap-3">
                                                                        <div className="w-5 h-5 rounded bg-amber-500/10 flex items-center justify-center shrink-0">
                                                                            <span className="text-[10px] font-bold text-amber-500">1</span>
                                                                        </div>
                                                                        <div className="text-[11px] text-gray-300">
                                                                            <strong>Provisioning Phase:</strong> Estimates the base monthly cost of "Always-On" resources (DB instances, clusters) based on the selected performance profile.
                                                                        </div>
                                                                    </li>
                                                                    <li className="flex gap-3">
                                                                        <div className="w-5 h-5 rounded bg-amber-500/10 flex items-center justify-center shrink-0">
                                                                            <span className="text-[10px] font-bold text-amber-500">2</span>
                                                                        </div>
                                                                        <div className="text-[11px] text-gray-300">
                                                                            <strong>Utilization Phase:</strong> Calculates usage-based costs (Lambda requests, S3 egress, Data Transfer) using your monthly user and bandwidth predictions.
                                                                        </div>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="space-y-3">
                                                            {(() => {
                                                                const breakdown = costEstimation.confidence_breakdown || (costEstimation.breakdown ? {
                                                                    usage_completeness: {
                                                                        label: 'Based on input density',
                                                                        score: Math.round((costEstimation.breakdown.usage_confidence || 0.5) * 100)
                                                                    },
                                                                    pricing_method: {
                                                                        label: 'Based on provider API coverage',
                                                                        score: Math.round((costEstimation.breakdown.estimate_type_score || 0.8) * 100)
                                                                    },
                                                                    architecture_completeness: {
                                                                        label: 'Based on service definitions',
                                                                        score: Math.round((costEstimation.breakdown.architecture_score || 0.7) * 100)
                                                                    }
                                                                } : null);

                                                                if (breakdown) {
                                                                    return (
                                                                        <div className="space-y-4">
                                                                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                                                <div className="flex items-center space-x-3">
                                                                                    <Activity className="text-blue-400" size={18} />
                                                                                    <div>
                                                                                        <div className="text-sm font-bold text-white">Usage Data Completeness</div>
                                                                                        <div className="text-[10px] text-gray-500 mt-1">{breakdown.usage_completeness?.explanation || breakdown.usage_completeness?.label || 'Inferred from description'}</div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-lg font-black text-blue-400">{breakdown.usage_completeness?.score || 0}%</div>
                                                                            </div>
                                                                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                                                <div className="flex items-center space-x-3">
                                                                                    <Calculator className="text-green-400" size={18} />
                                                                                    <div>
                                                                                        <div className="text-sm font-bold text-white">Pricing Method Reliability</div>
                                                                                        <div className="text-[10px] text-gray-500 mt-1">{breakdown.pricing_method?.explanation || breakdown.pricing_method?.label || 'Heuristic Estimation'}</div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-lg font-black text-green-400">{breakdown.pricing_method?.score || 0}%</div>
                                                                            </div>
                                                                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                                                <div className="flex items-center space-x-3">
                                                                                    <Layers className="text-purple-400" size={18} />
                                                                                    <div>
                                                                                        <div className="text-sm font-bold text-white">Architecture Mapping</div>
                                                                                        <div className="text-[10px] text-gray-500 mt-1">{breakdown.architecture_completeness?.explanation || breakdown.architecture_completeness?.label || 'Pattern-based Standard'}</div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-lg font-black text-purple-400">{breakdown.architecture_completeness?.score || 0}%</div>
                                                                            </div>

                                                                            {costEstimation.confidence_explanation && Array.isArray(costEstimation.confidence_explanation) && (
                                                                                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                                                                                    {costEstimation.confidence_explanation.map((exp, idx) => (
                                                                                        <div key={idx} className="flex items-start gap-2 text-[11px] text-gray-400">
                                                                                            <Info size={12} className="text-primary mt-0.5 shrink-0" />
                                                                                            <span>{exp}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <div className="text-sm text-gray-500 italic">
                                                                            {costEstimation.confidence_explanation?.[0] || "Detailed breakdown not generated, but overall confidence is calculated."}
                                                                        </div>
                                                                    );
                                                                }
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>

                                            </details>

                                            {/* SECTION 5: COST ESTIMATE & CONFIDENCE */}
                                            <div className="space-y-4">
                                                <div className="flex items-center space-x-2">
                                                    <CreditCard className="text-green-400" size={20} />
                                                    <h3 className="text-lg font-bold text-white">Cost Details & Confidence</h3>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {/* Confidence Card */}
                                                    <div className="glass-card rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                                                        <div className="relative w-24 h-24 mb-3">
                                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2E3645" strokeWidth="4" />
                                                                <path
                                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                    fill="none"
                                                                    stroke={
                                                                        (typeof costEstimation.confidence === "number" && costEstimation.confidence > 0.8) ? "#22c55e" :
                                                                            (typeof costEstimation.confidence === "number" && costEstimation.confidence > 0.5) ? "#eab308" : "#ef4444"
                                                                    }
                                                                    strokeWidth="4"
                                                                    strokeDasharray={`${(costEstimation.confidence || 0) * 100}, 100`}
                                                                />
                                                            </svg>
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                <span className="text-xl font-bold text-white">
                                                                    {typeof costEstimation.confidence === "number" ? ((costEstimation.confidence * 100).toFixed(0)) : "0"}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                                                            <span>Confidence</span>
                                                            <div className="relative group">
                                                                <Info className="text-gray-400 cursor-help" size={12} />
                                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg w-64 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                                    {costEstimation.confidence_explanation?.join('. ') || 'Confidence based on service resolution, data quality, and estimate type.'}
                                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                                                            {costEstimation.confidence_explanation?.[0] || 'Based on architecture completeness and data quality.'}
                                                        </p>
                                                        {/* ✅ NEW: Show estimate type */}
                                                        {(costEstimation.recommended?.estimate_type || costEstimation.providers?.[selectedProvider]?.estimate_type) && (
                                                            <div className="mt-3 w-full">
                                                                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${(costEstimation.recommended?.estimate_type === 'exact' || costEstimation.providers?.[selectedProvider]?.estimate_type === 'exact')
                                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                                    }`}>
                                                                    {(costEstimation.recommended?.estimate_type === 'exact' || costEstimation.providers?.[selectedProvider]?.estimate_type === 'exact')
                                                                        ? '✅ Exact (Terraform-based)'
                                                                        : '⚠️ Estimated (Heuristic)'}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Score Card */}
                                                    <div className="glass-card rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                                                        <div className="text-3xl font-bold text-white mb-3">
                                                            {(() => {
                                                                // Find the selected provider's score from rankings
                                                                const selectedRank = costEstimation.rankings?.find(rank => rank.provider === selectedProvider);
                                                                // If not found in rankings, try to get from scenarios
                                                                if (!selectedRank?.score) {
                                                                    const scenarioResult = costEstimation.scenarios
                                                                        ? Object.values(costEstimation.scenarios)
                                                                            .map(profile => profile[selectedProvider])
                                                                            .find(result => result)
                                                                        : null;
                                                                    return scenarioResult?.score || costEstimation.recommended?.score || 'N/A';
                                                                }
                                                                return selectedRank.score;
                                                            })()}
                                                        </div>
                                                        <div className="text-sm font-bold text-white uppercase tracking-wider">% Score</div>
                                                        <p className="text-xs text-gray-400 mt-2">
                                                            {selectedProvider || 'Provider'} competitiveness
                                                        </p>
                                                    </div>

                                                    {/* Basis Card */}
                                                    <div className="col-span-1 md:col-span-2 glass-card rounded-2xl p-6">
                                                        <h4 className="text-xs text-gray-500 uppercase font-bold mb-4">Estimate Based On</h4>
                                                        <div className="grid grid-cols-3 gap-4">
                                                            <div>
                                                                <div className="text-2xl font-bold text-white">
                                                                    {usageProfile?.usage_profile?.monthly_users
                                                                        ? (typeof usageProfile.usage_profile.monthly_users === 'object'
                                                                            ? `${(usageProfile.usage_profile.monthly_users.min || 0).toLocaleString()} - ${(usageProfile.usage_profile.monthly_users.max || 0).toLocaleString()}`
                                                                            : usageProfile.usage_profile.monthly_users.toLocaleString())
                                                                        : (costEstimation?.recommendation_facts?.facts?.usage?.monthly_users
                                                                            ? (typeof costEstimation.recommendation_facts.facts.usage.monthly_users === 'object'
                                                                                ? `${(costEstimation.recommendation_facts.facts.usage.monthly_users.min || 0).toLocaleString()} - ${(costEstimation.recommendation_facts.facts.usage.monthly_users.max || 0).toLocaleString()}`
                                                                                : costEstimation.recommendation_facts.facts.usage.monthly_users.toLocaleString())
                                                                            : '5,000')}
                                                                </div>
                                                                <div className="text-xs text-gray-500">Monthly Users</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-2xl font-bold text-white">
                                                                    {usageProfile?.usage_profile?.data_transfer_gb
                                                                        ? (typeof usageProfile.usage_profile.data_transfer_gb === 'object'
                                                                            ? `${usageProfile.usage_profile.data_transfer_gb.min || 0} - ${usageProfile.usage_profile.data_transfer_gb.max || 0} GB`
                                                                            : `${usageProfile.usage_profile.data_transfer_gb} GB`)
                                                                        : (costEstimation?.recommendation_facts?.facts?.usage?.data_transfer_gb
                                                                            ? (typeof costEstimation.recommendation_facts.facts.usage.data_transfer_gb === 'object'
                                                                                ? `${costEstimation.recommendation_facts.facts.usage.data_transfer_gb.min || 0} - ${costEstimation.recommendation_facts.facts.usage.data_transfer_gb.max || 0} GB`
                                                                                : `${costEstimation.recommendation_facts.facts.usage.data_transfer_gb} GB`)
                                                                            : '50 GB')}
                                                                </div>
                                                                <div className="text-xs text-gray-500">Data Transfer</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-2xl font-bold text-white">
                                                                    {usageProfile?.usage_profile?.data_storage_gb
                                                                        ? (typeof usageProfile.usage_profile.data_storage_gb === 'object'
                                                                            ? `${usageProfile.usage_profile.data_storage_gb.min || 0} - ${usageProfile.usage_profile.data_storage_gb.max || 0} GB`
                                                                            : `${usageProfile.usage_profile.data_storage_gb} GB`)
                                                                        : (costEstimation?.recommendation_facts?.facts?.usage?.data_storage_gb
                                                                            ? (typeof costEstimation.recommendation_facts.facts.usage.data_storage_gb === 'object'
                                                                                ? `${costEstimation.recommendation_facts.facts.usage.data_storage_gb.min || 0} - ${costEstimation.recommendation_facts.facts.usage.data_storage_gb.max || 0} GB`
                                                                                : `${costEstimation.recommendation_facts.facts.usage.data_storage_gb} GB`)
                                                                            : '10 GB')}
                                                                </div>
                                                                <div className="text-xs text-gray-500">Storage</div>
                                                            </div>
                                                        </div>

                                                        {/* ✅ NEW: View Included Services Collapsible Dropdown */}
                                                        <div className="mt-6 pt-4 border-t border-white/5">
                                                            <details className="group">
                                                                <summary className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 cursor-pointer flex items-center justify-between list-none hover:text-white transition-colors">
                                                                    <div className="flex items-center">
                                                                        <ChevronDown className="text-slate-500 group-open:rotate-180 transition-transform" size={14} />
                                                                        <span>View Included Services</span>
                                                                    </div>
                                                                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                                                                        {(() => {
                                                                            // Try all data sources for count
                                                                            const recommendedServices = costEstimation.recommended?.provider === selectedProvider
                                                                                ? costEstimation.recommended.services
                                                                                : null;
                                                                            const pd = costEstimation.provider_details?.[selectedProvider] ||
                                                                                costEstimation.provider_details?.[selectedProvider?.toUpperCase()] ||
                                                                                costEstimation.provider_details?.[selectedProvider?.toLowerCase()];
                                                                            const fromDetails = pd?.services;
                                                                            const services = recommendedServices || fromDetails || [];
                                                                            if (services.length > 0) return services.length;
                                                                            // Fallback: count from infraSpec modules
                                                                            return infraSpec?.modules?.length || infraSpec?.service_classes?.required_services?.length || 0;
                                                                        })()}
                                                                    </span>
                                                                </summary>

                                                                <div className="animate-fade-in mt-3 space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                                                    {(() => {
                                                                        // 1. Try recommended services if matches selection
                                                                        if (costEstimation.recommended?.provider === selectedProvider && costEstimation.recommended.services?.length) {
                                                                            return renderServicesList(costEstimation.recommended.services);
                                                                        }

                                                                        // 2. Try provider details (Infracost structure)
                                                                        const details = costEstimation.provider_details?.[selectedProvider] ||
                                                                            costEstimation.provider_details?.[selectedProvider?.toUpperCase()] ||
                                                                            costEstimation.provider_details?.[selectedProvider?.toLowerCase()];

                                                                        if (details?.services?.length > 0) {
                                                                            return renderServicesList(details.services);
                                                                        }

                                                                        // 3. Try scenarios (Hybrid structure)
                                                                        const scenario = costEstimation.scenarios?.[costProfile] || costEstimation.scenarios?.cost_effective;
                                                                        const providerData = scenario?.[selectedProvider] ||
                                                                            scenario?.[selectedProvider?.toLowerCase()] ||
                                                                            scenario?.[selectedProvider?.toUpperCase()];

                                                                        if (providerData?.breakdown) {
                                                                            const breakdownServices = Object.entries(providerData.breakdown).map(([key, cost]) => ({
                                                                                service_id: key,
                                                                                display_name: key.replace(/_/g, ' ').toUpperCase(),
                                                                                category: 'Infrastructure',
                                                                                formatted_cost: `$${(cost || 0).toFixed(2)}`,
                                                                                monthly_cost: cost,
                                                                                icon: getServiceIcon(key)
                                                                            }));
                                                                            return renderServicesList(breakdownServices);
                                                                        }

                                                                        // 4. Try provider_details service_costs map (aggregated by service_class)
                                                                        if (details?.service_costs && Object.keys(details.service_costs).length > 0) {
                                                                            const scServices = Object.entries(details.service_costs).map(([key, cost]) => ({
                                                                                service_id: key,
                                                                                service_class: key,
                                                                                display_name: (details.selected_services?.[key]
                                                                                    ? details.selected_services[key].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                                                                                    : key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
                                                                                category: 'Infrastructure',
                                                                                monthly_cost: cost,
                                                                                formatted_cost: `$${(cost || 0).toFixed(2)}`,
                                                                                icon: getServiceIcon(key)
                                                                            }));
                                                                            return renderServicesList(scServices);
                                                                        }

                                                                        // 5. ULTIMATE FALLBACK: Build from infraSpec modules + distribute total cost
                                                                        const modules = infraSpec?.modules || [];
                                                                        const requiredServices = infraSpec?.service_classes?.required_services || [];
                                                                        const sourceList = modules.length > 0 ? modules : requiredServices;

                                                                        if (sourceList.length > 0) {
                                                                            // Get total cost for the provider from rankings
                                                                            const providerRank = costEstimation.rankings?.find(r =>
                                                                                r.provider === selectedProvider || r.provider === selectedProvider?.toUpperCase()
                                                                            );
                                                                            const totalCost = providerRank?.monthly_cost || details?.total_monthly_cost || 0;

                                                                            // Base cost weights by service category (Higher = larger share of total cost)
                                                                            const COST_WEIGHTS = {
                                                                                'computecontainer': 25, 'compute_container': 25, 'fargate': 25, 'ecs': 25,
                                                                                'computeserverless': 10, 'compute_serverless': 10, 'lambda': 10, 'functions': 10,
                                                                                'computevm': 20, 'compute_vm': 20, 'ec2': 20, 'virtual_machine': 20,
                                                                                'relationaldatabase': 35, 'relational_database': 35, 'rds': 35, 'sql': 35,
                                                                                'nosqldatabase': 18, 'nosql_database': 18, 'dynamodb': 18, 'mongodb': 18,
                                                                                'cache': 15, 'redis': 15, 'elasticache': 15,
                                                                                'objectstorage': 5, 'object_storage': 5, 's3': 5, 'storage': 5, 'bucket': 5,
                                                                                'blockstorage': 8, 'block_storage': 8, 'ebs': 8,
                                                                                'loadbalancer': 12, 'load_balancer': 12, 'alb': 12,
                                                                                'cdn': 14, 'cloudfront': 14, 'content_delivery': 14,
                                                                                'apigateway': 10, 'api_gateway': 10,
                                                                                'identityauth': 4, 'identity_auth': 4, 'cognito': 4,
                                                                                'secretsmanagement': 3, 'secrets_management': 3,
                                                                                'monitoring': 6, 'cloudwatch': 6,
                                                                                'logging': 7,
                                                                                'messagequeue': 5, 'message_queue': 5, 'sqs': 5,
                                                                                'eventbus': 5, 'event_bus': 5, 'eventbridge': 5,
                                                                                'dns': 3, 'route53': 3,
                                                                                'vpcnetworking': 3, 'vpc_networking': 3, 'networking': 3, 'vpc': 3,
                                                                                'waf': 10,
                                                                                'natgateway': 20, 'nat_gateway': 20
                                                                            };

                                                                            // Calculate weighted costs
                                                                            let totalWeight = 0;
                                                                            const serviceList = sourceList.map(svc => {
                                                                                const svcClass = svc.service_class || svc.service_id || svc.type || '';
                                                                                const normalizedClass = svcClass.toLowerCase().replace(/[^a-z0-9]/g, '');
                                                                                const weight = COST_WEIGHTS[svcClass] || COST_WEIGHTS[normalizedClass] || 5;
                                                                                totalWeight += weight;
                                                                                return { svc, svcClass, normalizedClass, weight };
                                                                            });

                                                                            const fallbackServices = serviceList.map(({ svc, svcClass, normalizedClass, weight }) => {
                                                                                const allocatedCost = totalWeight > 0 ? Math.round((weight / totalWeight) * totalCost * 100) / 100 : 0;
                                                                                return {
                                                                                    service_id: svcClass,
                                                                                    service_class: svcClass,
                                                                                    display_name: svc.service_name || svc.name || svcClass.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                                                                    cloud_service: svc.description || svc.category || 'Infrastructure',
                                                                                    category: svc.category || 'Infrastructure',
                                                                                    monthly_cost: allocatedCost,
                                                                                    formatted_cost: allocatedCost > 0 ? `$${allocatedCost.toFixed(2)}` : 'Included',
                                                                                    icon: svc.icon || getServiceIcon(svcClass),
                                                                                    reason: allocatedCost > 0 ? 'Estimated infrastructure cost' : 'Included / Free tier'
                                                                                };
                                                                            });

                                                                            // Sort: paid services first, then free/included
                                                                            fallbackServices.sort((a, b) => (b.monthly_cost || 0) - (a.monthly_cost || 0));

                                                                            return renderServicesList(fallbackServices);
                                                                        }

                                                                        return <div className="text-sm text-gray-500 italic p-4 text-center">No service breakdown available for {selectedProvider}</div>;

                                                                        function getServiceIcon(key) {
                                                                            const iconName = typeof key === 'string' ? key.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

                                                                            // Handle canonical icon strings from backend or local keys
                                                                            if (iconName === 'cloud' || iconName === 'cdn' || iconName.includes('network')) return <Cloud size={14} />;
                                                                            if (iconName.includes('database') || iconName.includes('db') || iconName.includes('sql')) return <Database size={14} />;
                                                                            if (iconName.includes('storage') || iconName.includes('folder') || iconName.includes('bucket') || iconName.includes('s3') || iconName.includes('objectstorage')) return <Folder size={14} />;
                                                                            if (iconName.includes('globe') || iconName.includes('dns')) return <Globe size={14} />;
                                                                            if (iconName.includes('server') || iconName.includes('compute') || iconName.includes('vm') || iconName.includes('cpu')) return <Server size={14} />;
                                                                            if (iconName.includes('zap') || iconName.includes('flash') || iconName.includes('event')) return <Zap size={14} />;
                                                                            if (iconName.includes('brain') || iconName.includes('ai') || iconName.includes('ml')) return <Brain size={14} />;
                                                                            if (iconName.includes('shield') || iconName.includes('waf') || iconName.includes('firewall') || iconName.includes('security')) return <Shield size={14} />;
                                                                            if (iconName.includes('lock') || iconName.includes('auth') || iconName.includes('iam')) return <Lock size={14} />;
                                                                            if (iconName.includes('harddrive') || iconName.includes('blockstorage')) return <HardDrive size={14} />;
                                                                            if (iconName.includes('activity') || iconName.includes('monitoring')) return <Activity size={14} />;
                                                                            if (iconName.includes('grid') || iconName.includes('cluster')) return <Grid size={14} />;
                                                                            if (iconName.includes('file') || iconName.includes('asset')) return <File size={14} />;
                                                                            if (iconName.includes('image')) return <Image size={14} />;
                                                                            if (iconName.includes('api') || iconName.includes('gateway') || iconName.includes('layers')) return <Layers size={14} />;

                                                                            return <Box size={14} />;
                                                                        }

                                                                        function renderServicesList(list) {
                                                                            return list.map((s, idx) => (
                                                                                <details key={idx} className="group/svc bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors overflow-hidden">
                                                                                    <summary className="flex items-center justify-between p-3 cursor-pointer list-none">
                                                                                        <div className="flex items-center space-x-3">
                                                                                            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
                                                                                                {(() => {
                                                                                                    const iconKey = s.icon || s.service_id || s.service_class || '';
                                                                                                    return typeof iconKey === 'string' ? getServiceIcon(iconKey) : iconKey;
                                                                                                })()}
                                                                                            </div>
                                                                                            <div>
                                                                                                <div className="text-sm font-medium text-white">
                                                                                                    {s.display_name || s.cloud_service || s.service_id}
                                                                                                </div>
                                                                                                <div className="text-xs text-gray-500">
                                                                                                    {s.cloud_service || s.category || 'Infrastructure'}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-4">
                                                                                            <div className="text-right">
                                                                                                <div className="text-sm font-bold text-white">
                                                                                                    {typeof s.formatted_cost === 'string' ? s.formatted_cost :
                                                                                                        `$${(typeof s.monthly_cost === 'number' ? s.monthly_cost :
                                                                                                            (typeof s.cost?.monthly === 'number' ? s.cost.monthly :
                                                                                                                (typeof s.cost === 'number' ? s.cost : 0))).toFixed(2)}`}
                                                                                                </div>
                                                                                                <div className="text-xs text-gray-500">
                                                                                                    /month
                                                                                                </div>
                                                                                            </div>
                                                                                            <ChevronDown className="text-gray-500 group-open/svc:rotate-180 transition-transform" size={14} />
                                                                                        </div>
                                                                                    </summary>
                                                                                    <div className="px-3 pb-3 pt-0">
                                                                                        <div className="pt-2 border-t border-white/5 text-xs text-gray-400 italic flex items-start gap-2">
                                                                                            <Info className="text-blue-400" size={14} />
                                                                                            <span>
                                                                                                {s.reason || s.pricing_note || s.reasoning ||
                                                                                                    (s.monthly_cost > 0 ? 'Estimated infrastructure cost based on usage.' : 'Included in free tier or usage-based pricing.')}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </details>
                                                                            ));
                                                                        }
                                                                    })()}
                                                                </div>
                                                            </details>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Recommendation Details - Collapsible with Cost */}
                                                {costEstimation?.recommendation_facts && costEstimation.recommendation_facts.provider && (
                                                    <div className="mt-4 pt-4 border-t border-amber-500/20">
                                                        <details className="group">
                                                            <summary className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-2 cursor-pointer flex items-center justify-between list-none">
                                                                <div className="flex items-center">
                                                                    <ChevronDown className="text-slate-500 group-open:rotate-180 transition-transform" size={14} />
                                                                    <span>Why {selectedProvider}?</span>
                                                                </div>
                                                                <span className="text-[10px] text-gray-500 font-normal normal-case group-open:hidden">Click to see rationale & cost</span>
                                                            </summary>

                                                            <div className="space-y-3 mt-3 animate-fade-in">
                                                                <div className="space-y-1 text-xs text-gray-300">
                                                                    {(costEstimation.recommendation_facts.pros || []).map((pro, idx) => (
                                                                        <div key={idx} className="flex items-start">
                                                                            <span className="text-green-400 mr-1">•</span>
                                                                            <span>{pro}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                                                                    <div>
                                                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Estimated Cost</div>
                                                                        <div className="text-sm font-bold text-white">
                                                                            {(() => {
                                                                                const target = costEstimation?.rankings?.find(r => r.provider === selectedProvider);
                                                                                return target?.formatted_cost || `$${target?.monthly_cost?.toFixed(2) || '0.00'}`;
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Competitiveness</div>
                                                                        <div className="text-sm font-bold text-primary">{(costEstimation.rankings?.find(r => r.provider === selectedProvider)?.score || 0)}%</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </details>
                                                    </div>
                                                )}


                                                {/* Warnings / Recommendations */}
                                                {costEstimation?.recommendation_facts?.warnings?.length > 0 && (
                                                    <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <Lightbulb className="text-yellow-500" size={14} />
                                                            <span className="text-xs font-bold text-yellow-500 uppercase">Optimization Tips</span>
                                                        </div>
                                                        <ul className="space-y-1">
                                                            {costEstimation.recommendation_facts.warnings.slice(0, 2).map((w, i) => (
                                                                <li key={i} className="text-xs text-gray-400 pl-4 relative">
                                                                    <span className="absolute left-0 top-1 w-1 h-1 rounded-full bg-yellow-500/50"></span>
                                                                    {w}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}


                                                {!isDeployed && (
                                                    <div className="flex justify-end pt-8 border-t border-white/5">
                                                        <button
                                                            onClick={() => transitionToStep('architecture')}
                                                            className="btn-premium px-10 h-14"
                                                        >
                                                            <span>Forward to Diagram</span>
                                                            <ArrowRight size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 4: REQUIREMENTS CAPTURE */}
                                    {step === 'requirements' && (
                                        <RequirementsStep
                                            workspaceId={id}
                                            infraSpec={infraSpec}
                                            costEstimation={costEstimation}
                                            onNext={() => transitionToStep('architecture')}
                                            onBack={() => transitionToStep('cost_estimation')}
                                            onRequirementsCaptured={setRequirementsData}
                                            isDeployed={isReadOnly}
                                        />
                                    )}

                                    {/* STEP 5: ARCHITECTURE DIAGRAM (Design Confirmation) */}
                                    {step === 'architecture' && (
                                        <ArchitectureStep
                                            workspaceId={id}
                                            infraSpec={infraSpec}
                                            costEstimation={costEstimation}
                                            selectedProvider={selectedProvider}
                                            selectedProfile={costProfile}
                                            usageProfile={usageProfile}
                                            requirementsData={requirementsData}
                                            architectureData={architectureData}
                                            onArchitectureDataLoaded={setArchitectureData}
                                            onInfraSpecUpdate={setInfraSpec}
                                            onDiagramImageSave={setDiagramImage}
                                            onNext={(method) => {
                                                setDeploymentMethod(method);
                                                // 🔥 FIX: Both deploy methods go to feedback FIRST
                                                transitionToStep('feedback');
                                            }}
                                            onBack={() => transitionToStep('cost_estimation')}
                                            isDeployed={isReadOnly}
                                        />
                                    )}

                                    {/* STEP: DEPLOY RESOURCES (Application) */}
                                    {step === 'deploy_resources' && (
                                        <DeployResourcesStep
                                            workspace={{
                                                id: workspaceId,
                                                project_name: projectData?.name || infraSpec?.project_name,
                                                deployment_status: isDeployed ? 'DEPLOYED' : 'PENDING',
                                                state_json: {
                                                    infraSpec,
                                                    costEstimation,
                                                    infra_outputs: infraOutputs,
                                                    connection: infraSpec?.connection || costEstimation?.connection || {}
                                                }
                                            }}
                                            selectedProvider={selectedProvider}
                                            onBack={() => transitionToStep('terraform_provision')}
                                            onUpdateWorkspace={() => handleSaveDraft(true)}
                                            onDeploySuccess={async () => {
                                                if (isMarkingDeployed) return;
                                                setIsMarkingDeployed(true);

                                                setIsDeployed(true);
                                                setIsProjectLive(true);

                                                // Persist final state with force: true
                                                handleSaveDraft(true, {
                                                    force: true,
                                                    is_deployed: true,
                                                    is_live: true,
                                                    step: 'deployment_summary'
                                                });

                                                // User flows to summary instantly
                                                transitionToStep('deployment_summary', true);
                                            }}
                                        />
                                    )}

                                    {/* STEP 5: FEEDBACK (Pre-Terraform) */}
                                    {step === 'feedback' && (
                                        <FeedbackStep
                                            workspaceId={id}
                                            costEstimation={costEstimation}
                                            selectedProvider={selectedProvider}
                                            costIntent={usageProfile?.intent}
                                            onFeedbackSubmitted={() => setFeedbackSubmitted(true)}
                                            onNext={() => transitionToStep('terraform_view')}
                                            onBack={() => transitionToStep('architecture')}
                                            isDeployed={isReadOnly}
                                            deploymentMethod={deploymentMethod}
                                        />
                                    )}



                                    {/* STEP 5: DEPLOY TERRAFORM (Infrastructure) OR CONNECT CLOUD */}
                                    {step === 'terraform_view' && (
                                        deploymentMethod === 'self' ? (
                                            <TerraformStep
                                                workspaceId={workspaceId}
                                                infraSpec={infraSpec}
                                                selectedProvider={selectedProvider}
                                                costEstimation={costEstimation}
                                                onComplete={() => {
                                                    setIsDeployed(true);
                                                    setIsProjectLive(true);
                                                    transitionToStep('deployment_summary');
                                                }}
                                                onBack={() => transitionToStep('feedback')}
                                                isDeployed={isReadOnly}
                                                onDeploy={() => {
                                                    setIsDeployed(true);
                                                    setIsProjectLive(true);
                                                }}
                                            />
                                        ) : (
                                            <DeployTerraformStep
                                                workspaceId={workspaceId}
                                                infraSpec={infraSpec}
                                                selectedProvider={selectedProvider}
                                                costEstimation={costEstimation}
                                                setConnection={setConnection}
                                                onComplete={() => transitionToStep('terraform_provision')}
                                                onBack={() => transitionToStep('feedback')}
                                                isDeployed={isReadOnly}
                                                onResetWorkspace={() => {
                                                    setIsDeployed(false);
                                                    setProvisioningState({});
                                                    setStep('terraform_view');
                                                }}
                                            />
                                        )
                                    )}

                                    {/* STEP: PROVISION INFRASTRUCTURE (Terraform Apply) */}
                                    {step === 'terraform_provision' && (
                                        <DeployInfrastructureStep
                                            workspaceId={workspaceId}
                                            selectedProvider={selectedProvider}
                                            onComplete={() => transitionToStep('deploy_resources')}
                                            onBack={() => transitionToStep('terraform_view')}
                                            userPlan={userPlan}
                                            savedState={provisioningState}
                                            onUpdateWorkspace={(newState) => {
                                                setProvisioningState(prev => {
                                                    const updated = { ...prev, ...newState };
                                                    // Trigger save in next tick to avoid reducer side-effect issues
                                                    setTimeout(() => {
                                                        console.log("[WORKSPACE] Persisting provisioning state:", updated);
                                                        handleSaveDraft(true, { provisioning: updated });
                                                    }, 0);
                                                    return updated;
                                                });
                                            }}

                                        />
                                    )}

                                    {/* Processing Cost State */}
                                    {step === 'processing_cost' && (
                                        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 animate-fade-in">
                                            <div className="relative">
                                                <div className="w-20 h-20 rounded-full border-4 border-primary/20"></div>
                                                <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xl font-semibold text-white">Analyzing Cloud Costs</p>
                                                <p className="text-gray-400 mt-2">Comparing AWS, GCP, and Azure pricing...</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP: DEPLOYMENT PROCESSING (Transition Step) */}
                                    {step === 'deployment_processing' && (
                                        <div className="flex flex-col items-center justify-center min-h-[500px] space-y-12 animate-fade-in py-20">
                                            <div className="relative">
                                                <div className="w-32 h-32 rounded-3xl border-2 border-primary/20 rotate-12 animate-pulse"></div>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-16 h-16 rounded-2xl border-4 border-transparent border-t-primary animate-spin"></div>
                                                </div>
                                                <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shadow-lg animate-bounce">
                                                    <Rocket className="text-primary" size={24} />
                                                </div>
                                            </div>

                                            <div className="text-center space-y-4 max-w-md">
                                                <h2 className="text-3xl font-extrabold text-white tracking-tight">Provisioning Infrastructure</h2>
                                                <p className="text-gray-400 leading-relaxed">
                                                    Launching your {selectedProvider} stack with optimized configurations.
                                                    This usually takes a few minutes.
                                                </p>

                                                <div className="pt-8">
                                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                        <div className="h-full bg-gradient-to-r from-blue-500 to-primary animate-progress-indefinite"></div>
                                                    </div>
                                                    <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                        <span>Initializing API</span>
                                                        <span className="text-primary animate-pulse">Running</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setIsDeployed(true);
                                                    transitionToStep('deployment_summary');
                                                }}
                                                className="text-xs text-gray-600 hover:text-gray-400 underline underline-offset-4 decoration-gray-700 mt-10"
                                            >
                                                Simulate Completion
                                            </button>
                                        </div>
                                    )}

                                    {/* STEP: DEPLOYMENT SUMMARY (Self-Deployment with Terraform Preview) */}
                                    {(step === 'deployment_summary' || step === 'deployed') && (
                                        isDeployed ? (
                                            <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-in">
                                                {/* SaaS Sub-Navigation */}
                                                <div className="flex items-center justify-center pt-2">
                                                    <div className="glass-premium p-1.5 rounded-[1.5rem] flex items-center gap-1 border border-white/5 shadow-2xl">
                                                        {[
                                                            { id: 'summary', name: 'Summary', icon: <Grid size={14} /> },
                                                            { id: 'resources', name: 'Resources', icon: <Layers size={14} />, hidden: deploymentMethod === 'self' },
                                                            { id: 'usage', name: 'Usage', icon: <Zap size={14} />, hidden: deploymentMethod === 'self' }
                                                        ].filter(t => !t.hidden).map(t => (
                                                            <button
                                                                key={t.id}
                                                                onClick={() => setActiveTab(t.id)}
                                                                className={`px-8 py-3 rounded-2xl flex items-center gap-3 text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === t.id ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                                                            >
                                                                {t.icon}
                                                                {t.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Tab Content */}
                                                <div className="animate-fade-in min-h-[600px]">
                                                    {activeTab === 'summary' && (
                                                        <DeployedSummary
                                                            workspace={{
                                                                id: workspaceId,
                                                                name: projectData?.name || infraSpec?.project_name,
                                                                deployed_at: new Date().toISOString(),
                                                                deployment_status: 'DEPLOYED',
                                                                state_json: {
                                                                    infraSpec,
                                                                    costEstimation,
                                                                    infra_outputs: infraOutputs,
                                                                    connection
                                                                }
                                                            }}
                                                            infraOutputs={infraOutputs}
                                                        />
                                                    )}

                                                    {activeTab === 'resources' && (
                                                        <div className="glass-premium rounded-[2.5rem] border border-white/5 p-12 overflow-hidden relative">
                                                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                                                <Layers size={200} />
                                                            </div>
                                                            <div className="relative z-10 space-y-10">
                                                                <div>
                                                                    <h2 className="text-3xl font-black text-white italic tracking-tight mb-2">Deployed <span className="text-brand-400">Resources</span></h2>
                                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active infrastructure components in {selectedProvider}</p>
                                                                </div>

                                                                <DeployResourcesStep
                                                                    workspace={{
                                                                        id: workspaceId,
                                                                        project_name: projectData?.name || infraSpec?.project_name,
                                                                        deployment_status: 'DEPLOYED',
                                                                        state_json: {
                                                                            infraSpec,
                                                                            costEstimation,
                                                                            infra_outputs: infraOutputs,
                                                                            connection: infraSpec?.connection || costEstimation?.connection || {}
                                                                        }
                                                                    }}
                                                                    selectedProvider={selectedProvider}
                                                                    onUpdateWorkspace={() => handleSaveDraft(true)}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {activeTab === 'usage' && (
                                                        <div className="glass-premium rounded-[2.5rem] border border-white/5 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                                                            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-6 border border-amber-500/20 shadow-lg shadow-amber-500/5 animate-pulse">
                                                                <Zap size={32} />
                                                            </div>
                                                            <h3 className="text-2xl font-black text-white italic mb-3">Live Usage Monitoring</h3>
                                                            <p className="text-slate-400 max-w-md text-sm leading-relaxed mb-8">
                                                                Cloudiverse is currently gathering real-time telemetry from your {selectedProvider} account. Detailed metrics will appear here shortly.
                                                            </p>
                                                            <div className="flex gap-4">
                                                                <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest">CPU: Gathering...</div>
                                                                <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest">Requests: 0/hr</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-8 animate-fade-in pb-20 max-w-5xl mx-auto">
                                                {/* Success Header */}
                                                <div className="text-center mb-10">
                                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-6">
                                                        <span className="material-icons text-5xl text-green-400">rocket_launch</span>
                                                    </div>
                                                    <h2 className="text-4xl font-bold text-white tracking-tight">Deployment Ready</h2>
                                                    <p className="text-gray-400 mt-3 text-lg">
                                                        Your infrastructure configuration for <span className="text-primary font-bold">{infraSpec.project_name || 'Cloudiverse Project'}</span> is complete.
                                                    </p>
                                                </div>

                                                {/* Unified Deployment Summary Box */}
                                                <div className="max-w-2xl mx-auto bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5 mb-10">
                                                    {/* Provider Section */}
                                                    <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                                                                <Box size={24} />
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Provider</div>
                                                                <div className="text-white font-bold text-lg">{selectedProvider?.toUpperCase()}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="px-3 py-1 bg-brand-500/10 text-brand-400 text-[10px] font-black rounded-full border border-brand-500/20 uppercase tracking-widest">Active</span>
                                                        </div>
                                                    </div>

                                                    {/* Region Section */}
                                                    <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center text-accent-purple">
                                                                <Globe size={24} />
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Region</div>
                                                                <div className="text-white font-bold text-lg">{infraSpec.region?.resolved_region || 'Discovery Needed'}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Cost Section */}
                                                    <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-12 h-12 rounded-xl bg-accent-green/10 flex items-center justify-center text-accent-green">
                                                                <CreditCard size={24} />
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Est. Monthly Cost</div>
                                                                <div className="text-white font-bold text-lg">
                                                                    {(() => {
                                                                        const target = costEstimation?.rankings?.find(r => r.provider === selectedProvider);
                                                                        return target?.formatted_cost || `$${target?.monthly_cost?.toFixed(2) || '0.00'}`;
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-accent-green text-[10px] font-black uppercase tracking-widest">Production Ready</div>
                                                        </div>
                                                    </div>

                                                    {/* Confidence Section */}
                                                    <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                                                                <ShieldCheck size={24} />
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">AI Confidence</div>
                                                                <div className="text-white font-bold text-lg">
                                                                    {typeof costEstimation?.confidence === "number" ? ((costEstimation.confidence * 100).toFixed(0)) : "0"}%
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer Actions */}
                                                <div className="flex justify-center items-center gap-6 pt-10 border-t border-white/5 mt-8">
                                                    <button
                                                        onClick={() => transitionToStep('terraform_view')}
                                                        className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2"
                                                    >
                                                        <ArrowLeft size={16} />
                                                        <span>Review Code</span>
                                                    </button>

                                                    <button
                                                        onClick={async () => {
                                                            if (isMarkingDeployed) return;
                                                            setIsMarkingDeployed(true);
                                                            try {
                                                                const token = localStorage.getItem('token');
                                                                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                                                                await axios.put(`${API_BASE}/api/workspaces/${id}/deploy`, {
                                                                    deployment_method: 'self',
                                                                    provider: selectedProvider
                                                                }, { headers });

                                                                toast.success('🚀 Project marked as Self-Deployed!', { duration: 4000 });
                                                                setIsDeployed(true);
                                                                setIsProjectLive(true);
                                                                handleSaveDraft(true, { force: true, is_deployed: true, is_live: true });
                                                            } catch (error) {
                                                                handleApiError(error, 'Failed to confirm deployment.');
                                                            } finally {
                                                                setIsMarkingDeployed(false);
                                                            }
                                                        }}
                                                        className="px-10 py-4 bg-gradient-to-r from-accent-green to-emerald-500 rounded-xl text-white font-black text-[12px] uppercase tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-lg shadow-accent-green/20"
                                                    >
                                                        {isMarkingDeployed ? (
                                                            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                                        ) : (
                                                            <CheckCircle2 size={18} />
                                                        )}
                                                        <span>{isMarkingDeployed ? 'Processing...' : 'Confirm Deployment'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .animate-shimmer {
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                    background-size: 200% 100%;
                    animation: shimmer 2s infinite;
                }
                @keyframes pulse-soft {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(0.98); }
                }
                .animate-pulse-soft {
                    animation: pulse-soft 2s infinite ease-in-out;
                }
            `}} />
        </div>
    );
};

export default WorkspaceCanvas;
