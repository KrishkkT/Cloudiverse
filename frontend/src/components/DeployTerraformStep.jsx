import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
    Check, 
    Cloud, 
    ArrowRight, 
    Link2Off, 
    ChevronDown, 
    Trash2, 
    AlertTriangle, 
    RefreshCw, 
    ChevronUp, 
    Settings, 
    Lock,
    Zap,
    ShieldCheck,
    ExternalLink
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

const DeployTerraformStep = ({
    workspaceId,
    infraSpec,
    selectedProvider,
    setConnection,
    onComplete,
    onBack,
    isDeployed,
    onResetWorkspace
}) => {
    // ─── STATE ───────────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true);

    // Connection State
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [connectionData, setConnectionData] = useState(null);
    const [awsSetup, setAwsSetup] = useState({ url: '', externalId: '', accountId: '' });
    const [azureTenantId, setAzureTenantId] = useState('');
    const [showAzureAdvanced, setShowAzureAdvanced] = useState(false);

    // AWS Manual Verification State
    const [awsAccountId, setAwsAccountId] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    // Saved Connection State
    const [savedConnection, setSavedConnection] = useState(null);
    const [isApplyingSaved, setIsApplyingSaved] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    const pollInterval = useRef(null);
    const hasInitialized = useRef(false);
    const verifyFailCount = useRef(0);

    // Reset refs and check status on mount/navigation
    useEffect(() => {
        hasInitialized.current = false;
        if (workspaceId && selectedProvider) {
            if (isDeployed) {
                console.log('[DeployTerraformStep] Workspace already deployed, skipping connection check');
                setConnectionStatus('connected');
                setLoading(false);
                return;
            }
            console.log('[DeployTerraformStep] Component mounted, checking for saved connection...');
            checkForSavedConnection();
        }
        return () => stopPolling();
    }, [workspaceId, selectedProvider]);

    // ─── CHECK FOR SAVED USER CONNECTION ──────────────────────────────────────────
    const checkForSavedConnection = async () => {
        try {
            const token = localStorage.getItem('token');
            const providerKey = selectedProvider?.toLowerCase() || 'aws';
            const wsRes = await axios.get(`${API_BASE}/workspaces/${workspaceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const existingConn = wsRes.data.state_json?.connection;

            if (existingConn?.status === 'connected' && existingConn.provider?.toLowerCase() === providerKey) {
                console.log('[DeployTerraformStep] Workspace already connected with matching provider');
                setConnectionStatus('connected');
                setConnectionData(existingConn);
                if (setConnection) setConnection(existingConn);
                setLoading(false);
                ensureTerraformGenerated();
                return;
            } else if (existingConn?.status === 'connected') {
                console.log('[DeployTerraformStep] Workspace connected to different provider:', existingConn.provider);
            }

            const savedRes = await axios.get(`${API_BASE}/cloud/connections/${providerKey}`, {
                params: { workspace_id: workspaceId },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (savedRes.data?.connection) {
                setSavedConnection(savedRes.data.connection);
                console.log('[DeployTerraformStep] Found saved connection, auto-applying...');
                await applySavedConnection(savedRes.data.connection);
            } else {
                console.log('[DeployTerraformStep] No saved connection found');
                setLoading(false);
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                console.error('[DeployTerraformStep] Error checking saved connection:', err);
            }
            setLoading(false);
        }
    };

    const applySavedConnection = async (conn) => {
        setIsApplyingSaved(true);
        try {
            const token = localStorage.getItem('token');
            const providerKey = selectedProvider?.toLowerCase() || 'aws';
            await axios.post(`${API_BASE}/cloud/${providerKey}/apply-saved`, {
                workspace_id: workspaceId,
                connection_id: conn._id || conn.id
            }, { headers: { Authorization: `Bearer ${token}` } });

            setConnectionStatus('connected');
            setConnectionData(conn);
            if (setConnection) setConnection({ ...conn, status: 'connected' });
            toast.success(`${providerKey.toUpperCase()} connection restored!`);
            ensureTerraformGenerated();
        } catch (err) {
            console.error('[DeployTerraformStep] Failed to apply saved connection:', err);
            toast.error("Could not auto-apply saved connection. Please connect manually.");
            setLoading(false);
        } finally {
            setIsApplyingSaved(false);
        }
    };

    const checkConnectionStatus = async (isInitialCall = false) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE}/cloud/status/${workspaceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('[DeployTerraformStep] Connection check:', {
                status: res.data?.status,
                provider: res.data?.provider,
                expected: selectedProvider
            });

            if (res.data?.status === 'connected') {
                setConnectionStatus('connected');
                setConnectionData(res.data);
                if (setConnection) setConnection(res.data);
                stopPolling();

                if (res.data.provider?.toLowerCase() !== selectedProvider?.toLowerCase()) {
                    console.log('[DeployTerraformStep] Connection established/restored, re-running Terraform generation...');
                    ensureTerraformGenerated();
                }
            } else {
                setConnectionStatus('disconnected');
            }

            if (isInitialCall && !hasInitialized.current) {
                hasInitialized.current = true;
                ensureTerraformGenerated();
            } else if (isInitialCall) {
                setLoading(false);
            }
        } catch (err) {
            console.error("Status check failed", err);
            if (isInitialCall) setLoading(false);
        }
    };

    const handleAwsVerify = async () => {
        if (!awsAccountId || awsAccountId.length < 12) {
            toast.error("Please enter a valid AWS Account ID");
            return;
        }
        if (connectionStatus === 'connected') return; // Already connected, skip
        setIsVerifying(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE}/cloud/aws/verify`, {
                workspace_id: workspaceId,
                external_id: awsSetup.externalId,
                account_id: awsAccountId
            }, { headers: { Authorization: `Bearer ${token}` } });

            // Immediately mark as connected to stop all polling
            setConnectionStatus('connected');
            const connData = res.data?.connection || { provider: 'aws', status: 'connected', account_id: awsAccountId };
            setConnectionData(connData);
            if (setConnection) setConnection({ ...connData, status: 'connected' });
            
            // 🔥 KILL POLLING IMMEDIATELY
            verifyFailCount.current = 999; 
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
                pollInterval.current = null;
            }

            toast.success("AWS Connection Verified!");
            ensureTerraformGenerated();
        } catch (err) {
            verifyFailCount.current += 1;
            const errorDetail = err.response?.data?.error || err.response?.data?.msg || err.message;
            console.error(`Verification failed (attempt ${verifyFailCount.current}):`, errorDetail);
            if (verifyFailCount.current <= 1) {
                toast.error("Verification failed: " + errorDetail);
            }
        } finally {
            setIsVerifying(false);
        }
    };

    // Auto-verify polling - only runs when disconnected with valid account ID
    useEffect(() => {
        let interval;
        const isReadyToVerify = !isDeployed && awsSetup.url && awsAccountId.length === 12 && connectionStatus !== 'connected' && verifyFailCount.current < 3;
        
        if (isReadyToVerify) {
            console.log("[DeployTerraformStep] Starting auto-verification loop...");
            interval = setInterval(() => {
                // Double check status before firing to avoid loop
                if (connectionStatus === 'connected' || verifyFailCount.current >= 3 || isVerifying) {
                    return;
                }
                handleAwsVerify();
            }, 5000);
        }
        
        return () => {
            if (interval) {
                console.log("[DeployTerraformStep] Clearing verification loop");
                clearInterval(interval);
            }
        };
    }, [awsSetup.url, awsAccountId, connectionStatus, isDeployed, isVerifying]);

    const handleConnect = async () => {
        try {
            const token = localStorage.getItem('token');
            const providerKey = selectedProvider?.toLowerCase() || 'aws';
            const res = await axios.post(`${API_BASE}/cloud/${providerKey}/connect`,
                {
                    workspace_id: workspaceId,
                    tenant_id: providerKey === 'azure' ? azureTenantId : undefined
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (providerKey === 'aws') {
                setAwsSetup({
                    url: res.data.url,
                    externalId: res.data.extra.externalId,
                    accountId: res.data.extra.accountId
                });
            } else if (res.data.url) {
                window.open(res.data.url, 'CloudAuth', 'width=600,height=700');
                startPollingConnection();
            }
        } catch (err) {
            toast.error("Failed to initiate connection. Please try again.");
        }
    };

    const startPollingConnection = () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
        pollInterval.current = setInterval(checkConnectionStatus, 3000);
    };

    const stopPolling = () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
    };

    const handleDisconnect = async (deleteStack = false) => {
        const providerKey = selectedProvider?.toLowerCase() || connectionData?.provider || 'aws';
        const message = deleteStack
            ? `⚠️ PERMANENT ACTION: This will delete the CloudFormation stack from your AWS account and remove all saved connection data. Are you sure?`
            : `Disconnect from ${providerKey.toUpperCase()}? You can reconnect using your saved credentials.`;

        if (!window.confirm(message)) return;

        setIsDisconnecting(true);
        try {
            const token = localStorage.getItem('token');

            // Clear workspace connection
            await axios.post(`${API_BASE}/cloud/${providerKey}/disconnect`, {
                workspace_id: workspaceId,
                deleteStack: deleteStack
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (deleteStack) {
                await axios.delete(`${API_BASE}/cloud/connections/${providerKey}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setConnectionStatus('disconnected');
            setConnectionData(null);
            setSavedConnection(null);
            setAwsSetup({ url: '', externalId: '', accountId: '' });
            setAwsAccountId('');
            if (setConnection) setConnection(null);
            if (onResetWorkspace) onResetWorkspace();

            toast.success(deleteStack ? "Fully disconnected and stack deleted" : "Disconnected successfully");
        } catch (err) {
            console.error("Disconnect error:", err);
            toast.error("Failed to disconnect: " + (err.response?.data?.error || err.message));
        } finally {
            setIsDisconnecting(false);
        }
    };

    const ensureTerraformGenerated = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE}/workflow/terraform`, {
                workspace_id: workspaceId,
                infraSpec: infraSpec,
                provider: selectedProvider,
                profile: 'standard',
                project_name: infraSpec.project_name || 'cloudiverse-project'
            }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
            console.error("Terraform generation warning:", err);
        } finally {
            setLoading(false);
        }
    };

    // ─── RENDER ──────────────────────────────────────────────────────────────────

    const isConnected = connectionStatus === 'connected';
    const providerKey = selectedProvider?.toLowerCase() || 'aws';

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-6 animate-fade-in">
            <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-brand-500/10 border-t-brand-500 animate-spin" />
                <Cloud className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-brand-400 animate-pulse" />
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                {isApplyingSaved ? 'Restoring saved connection...' : 'Initializing deployment context...'}
            </p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto pb-24 animate-fade-in space-y-10">

            {/* ── CONNECTION CARD ─────────────────────────────────────────── */}
            <div className={`glass-premium rounded-[2.5rem] border overflow-hidden shadow-2xl transition-all duration-500 ${isConnected ? 'border-emerald-500/30 shadow-emerald-500/5' : 'border-white/5'}`}>
                {/* Card Header */}
                <div className="px-10 py-10 border-b border-white/5 bg-gradient-to-r from-brand-500/10 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-700 shadow-lg ${isConnected ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10' : 'bg-brand-500/20 text-brand-400 border-brand-500/30 shadow-brand-500/10'}`}>
                            {isConnected ? <Check size={32} /> : <Cloud size={32} />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic tracking-tight">Cloud <span className="text-brand-400">Connection</span></h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                {isConnected ? `Securely Linked to ${providerKey.toUpperCase()}` : 'Link your cloud environment to proceed'}
                            </p>
                        </div>
                    </div>
                    {isConnected ? (
                        <div className="flex flex-col items-end gap-1">
                            <span className="px-5 py-2 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/20 uppercase tracking-widest flex items-center gap-2 shadow-inner">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                Connection Active
                            </span>
                        </div>
                    ) : (
                        <span className="px-5 py-2 bg-amber-500/10 text-amber-400 text-[10px] font-black rounded-full border border-amber-500/20 uppercase tracking-widest animate-pulse">
                            Action Required
                        </span>
                    )}
                </div>

                {/* Card Body */}
                <div className="p-10">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Provider Icon */}
                        <div className="flex-shrink-0">
                            <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center transition-all ${isConnected ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/[0.02] border-white/10'}`}>
                                {providerKey === 'aws' ? (
                                    <span className="text-[#FF9900] font-black text-2xl">AWS</span>
                                ) : providerKey === 'gcp' ? (
                                    <span className="text-[#4285F4] font-black text-2xl">GCP</span>
                                ) : (
                                    <span className="text-[#0078D4] font-black text-2xl">AZ</span>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-6">
                            {isConnected ? (
                                /* ─── CONNECTED STATE ─── */
                                <div className="space-y-6">
                                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                        <div className="flex items-center gap-3 mb-3">
                                            <ShieldCheck size={18} className="text-emerald-400" />
                                            <span className="text-sm font-bold text-emerald-400">Secure Connection Active</span>
                                        </div>
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            Your {providerKey.toUpperCase()} account is securely linked. Cloudiverse has read-limited access to provision infrastructure.
                                        </p>
                                        {connectionData?.account_id && (
                                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                                <span className="font-black uppercase tracking-widest">Account:</span>
                                                <code className="bg-white/5 px-2 py-1 rounded font-mono">{connectionData.account_id}</code>
                                            </div>
                                        )}
                                    </div>

                                    {/* Disconnect Options */}
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => handleDisconnect(false)}
                                            disabled={isDisconnecting || isDeployed}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <Link2Off size={14} /> Disconnect
                                        </button>
                                        {providerKey === 'aws' && (
                                            <button
                                                onClick={() => handleDisconnect(true)}
                                                disabled={isDisconnecting || isDeployed}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 size={14} /> Delete Stack & Disconnect
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* ─── DISCONNECTED STATE ─── */
                                <div className="space-y-6">
                                    {/* Saved Connection Notice */}
                                    {savedConnection && (
                                        <div className="p-5 bg-brand-500/5 border border-brand-500/10 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Zap size={18} className="text-brand-400" />
                                                <div>
                                                    <p className="text-sm font-bold text-white">Saved connection found</p>
                                                    <p className="text-xs text-slate-500">Account: {savedConnection.account_id || 'Unknown'}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => applySavedConnection(savedConnection)}
                                                disabled={isApplyingSaved}
                                                className="btn-premium px-6 h-10 text-xs"
                                            >
                                                {isApplyingSaved ? 'Applying...' : 'Reconnect'}
                                            </button>
                                        </div>
                                    )}

                                    {/* AWS CloudFormation Flow */}
                                    {providerKey === 'aws' && !awsSetup.url && (
                                        <div className="space-y-4">
                                            <p className="text-slate-400 text-sm leading-relaxed">
                                                Click below to open the AWS CloudFormation console. This creates a secure IAM role that grants Cloudiverse read-limited access to your account.
                                            </p>
                                            <button
                                                onClick={handleConnect}
                                                className="group relative px-10 h-16 bg-brand-500 rounded-2xl text-white font-black text-[12px] uppercase tracking-widest flex items-center gap-3 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.5)] active:scale-95 overflow-hidden"
                                            >
                                                {/* Shimmer Effect */}
                                                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                                
                                                <Cloud size={20} className="group-hover:rotate-12 transition-transform duration-500" />
                                                <span className="relative z-10">Connect {selectedProvider}</span>
                                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-500" />
                                            </button>
                                        </div>
                                    )}

                                    {/* AWS Stack Launched - Waiting for Verification */}
                                    {providerKey === 'aws' && awsSetup.url && (
                                        <div className="space-y-6">
                                            {/* Step 1: Open CloudFormation */}
                                            <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-black">1</div>
                                                    <h4 className="font-bold text-white">Launch CloudFormation Stack</h4>
                                                </div>
                                                <a
                                                    href={awsSetup.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#FF9900] to-[#FFB74D] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-[0_15px_30px_-10px_rgba(255,153,0,0.4)] transition-all hover:-translate-y-0.5 active:translate-y-0"
                                                >
                                                    <ExternalLink size={16} className="group-hover:rotate-12 transition-transform" /> 
                                                    <span>Launch Stack in Console</span>
                                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                                </a>
                                            </div>

                                            {/* Step 2: Enter Account ID */}
                                            <div className="p-8 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-[2rem] space-y-5 relative overflow-hidden group/step2">
                                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/step2:opacity-10 transition-opacity">
                                                    <ShieldCheck size={120} />
                                                </div>
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-sm font-black shadow-lg">2</div>
                                                    <h4 className="text-lg font-bold text-white italic">Verify Connection</h4>
                                                </div>
                                                <div className="space-y-4 relative z-10">
                                                    <p className="text-sm text-slate-400 leading-relaxed">
                                                        Enter your <strong className="text-white">12-digit AWS Account ID</strong> to verify the link. 
                                                    </p>
                                                    <div className="p-4 bg-brand-500/5 border border-brand-500/10 rounded-xl">
                                                        <p className="text-[11px] text-brand-300 leading-relaxed">
                                                            💡 <strong>Already have the stack?</strong> If you've created the "CloudiverseConnector" stack before, simply enter your Account ID below to instantly reconnect.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="pt-4">
                                                    <h4 className="text-sm font-bold text-white mb-2">Enter AWS Account ID</h4>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed -mt-1">
                                                    If the CloudFormation stack was already created in your AWS account from a previous session, just enter your 12-digit Account ID below — no need to re-create the stack.
                                                </p>
                                                <div className="flex gap-3">
                                                    <input
                                                        type="text"
                                                        value={awsAccountId}
                                                        onChange={(e) => setAwsAccountId(e.target.value.replace(/\D/g, '').slice(0, 12))}
                                                        placeholder="123456789012"
                                                        maxLength={12}
                                                        className="flex-1 px-6 py-4 bg-white/[0.02] border border-white/10 rounded-2xl text-white font-mono text-lg focus:border-brand-500/30 outline-none transition-all"
                                                    />
                                                    <button
                                                        onClick={handleAwsVerify}
                                                        disabled={isVerifying || awsAccountId.length < 12 || connectionStatus === 'connected'}
                                                        className="btn-premium px-8 h-auto disabled:opacity-30"
                                                    >
                                                        {isVerifying ? (
                                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <span>Verify</span>
                                                        )}
                                                    </button>
                                                </div>
                                                {awsAccountId.length === 12 && connectionStatus !== 'connected' && (
                                                    <p className="text-xs text-brand-400 animate-pulse flex items-center gap-2">
                                                        <RefreshCw size={12} className="animate-spin" /> Auto-verifying connection...
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* GCP / Azure Flow */}
                                    {providerKey !== 'aws' && (
                                        <div className="space-y-4">
                                            <p className="text-slate-400 text-sm leading-relaxed">
                                                Authenticate with {providerKey.toUpperCase()} via OAuth. A secure popup will open for authorization.
                                            </p>
                                            <button
                                                onClick={handleConnect}
                                                className="btn-premium px-10 h-14"
                                            >
                                                <Cloud size={18} />
                                                <span>Connect {selectedProvider}</span>
                                            </button>

                                            {/* Azure Tenant ID Override */}
                                            {providerKey === 'azure' && (
                                                <div className="mt-2">
                                                    <button
                                                        onClick={() => setShowAzureAdvanced(!showAzureAdvanced)}
                                                        className="text-xs text-slate-500 hover:text-white transition flex items-center gap-1"
                                                    >
                                                        {showAzureAdvanced ? <ChevronUp size={14} /> : <Settings size={14} />}
                                                        {showAzureAdvanced ? 'Hide Advanced Settings' : 'Using a Personal Account? Click here'}
                                                    </button>

                                                    {showAzureAdvanced && (
                                                        <div className="mt-3 p-5 bg-white/[0.02] border border-white/10 rounded-2xl animate-fade-in space-y-3">
                                                            <label className="block text-[10px] font-black text-brand-400 uppercase tracking-widest">Azure Tenant ID (GUID)</label>
                                                            <input
                                                                type="text"
                                                                value={azureTenantId}
                                                                onChange={(e) => setAzureTenantId(e.target.value)}
                                                                placeholder="e.g. 12345678-abcd-1234-abcd-1234567890ab"
                                                                className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-white focus:border-brand-500/30 outline-none transition-all"
                                                            />
                                                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                                                Personal accounts often require a specific Tenant ID.
                                                                Find it in your <a href="https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">Azure Portal</a>.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <p className="text-xs text-slate-600 flex items-center gap-2 pt-2">
                                        <Lock size={12} />
                                        Cloudiverse uses secure, read-limited access. You can revoke permissions anytime.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── PROCEED BUTTON (Only when connected and NOT already deployed) ─────────────────────── */}
            {isConnected && !isDeployed && (
                <div className="flex items-center justify-between pt-4">
                    <button
                        onClick={onBack}
                        className="px-6 py-3 rounded-xl bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <ArrowRight size={14} className="rotate-180" /> Back
                    </button>
                    <button
                        onClick={onComplete}
                        className="btn-premium px-12 h-16"
                    >
                        <span>Proceed to Provision</span>
                        <ArrowRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default DeployTerraformStep;
