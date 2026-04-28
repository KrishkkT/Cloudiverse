import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * DestroyConfirmationModal - Typed DELETE confirmation for infrastructure deletion
 * Requires user to type exactly "DELETE" to enable the confirm button
 */
const DestroyConfirmationModal = ({
    isOpen,
    onClose,
    workspaceId,
    workspaceName,
    onDestroyComplete
}) => {
    const [confirmation, setConfirmation] = useState('');
    const [status, setStatus] = useState('idle'); // idle, destroying, success, failed
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState(null);
    const [jobId, setJobId] = useState(null);
    const pollInterval = useRef(null);
    const logEndRef = useRef(null);

    const isConfirmValid = confirmation === 'DELETE';

    // Auto-scroll logs
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, []);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setConfirmation('');
            setStatus('idle');
            setLogs([]);
            setError(null);
            setJobId(null);
        }
    }, [isOpen]);

    const handleDestroy = async () => {
        if (!isConfirmValid) return;

        try {
            setStatus('destroying');
            setLogs([{ timestamp: new Date().toISOString(), message: '🚀 Initiating infrastructure destruction...' }]);

            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${API_BASE}/api/deploy/${workspaceId}/destroy`,
                { confirmation: 'DELETE' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const newJobId = res.data.jobId;
            setJobId(newJobId);
            startPolling(newJobId);

        } catch (err) {
            console.error('Destroy error:', err);
            setStatus('failed');
            setError(err.response?.data?.error || err.message);
            setLogs(prev => [...prev, {
                timestamp: new Date().toISOString(),
                message: `❌ ${err.response?.data?.error || err.message}`
            }]);
        }
    };

    const startPolling = (pollJobId) => {
        if (pollInterval.current) clearInterval(pollInterval.current);

        pollInterval.current = setInterval(async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(
                    `${API_BASE}/api/deploy/${workspaceId}/destroy/${pollJobId}/status`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const job = res.data;
                setLogs(job.logs || []);

                if (job.status === 'success') {
                    setStatus('success');
                    clearInterval(pollInterval.current);
                    // Notify parent after short delay
                    setTimeout(() => {
                        onDestroyComplete && onDestroyComplete();
                    }, 2000);
                } else if (job.status === 'failed') {
                    setStatus('failed');
                    setError(job.error);
                    clearInterval(pollInterval.current);
                }
            } catch (err) {
                console.error('Poll error:', err);
            }
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">

                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/70 transition-opacity backdrop-blur-sm"
                    onClick={status === 'idle' ? onClose : undefined}
                />

                {/* Modal Panel */}
                <div className="relative transform overflow-hidden bg-[#1a1d26] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl transition-all animate-fade-in text-left sm:my-8">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#1a1d26]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Delete Infrastructure</h2>
                                <p className="text-sm text-gray-400">{workspaceName}</p>
                            </div>
                        </div>
                        {status === 'idle' && (
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {status === 'idle' && (
                            <>
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                    <p className="text-red-400 text-sm">
                                        <strong>Warning:</strong> This will permanently delete all cloud resources
                                        created for this project, including storage buckets, CDN distributions,
                                        and any associated data.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">
                                        Type <span className="font-mono font-bold text-white bg-red-500/20 px-2 py-0.5 rounded">DELETE</span> to confirm
                                    </label>
                                    <input
                                        type="text"
                                        value={confirmation}
                                        onChange={(e) => setConfirmation(e.target.value)}
                                        placeholder="Type DELETE here"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:border-red-500 outline-none transition-colors font-mono"
                                        autoFocus
                                    />
                                </div>
                            </>
                        )}

                        {(status === 'destroying' || status === 'success' || status === 'failed') && (
                            <div className="bg-black/40 rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs space-y-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                {logs.map((log, idx) => (
                                    <div key={idx} className="text-gray-300 break-words">
                                        <span className="text-gray-600 mr-2 shrink-0">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                        <span>{log.message}</span>
                                    </div>
                                ))}
                                <div ref={logEndRef} />
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="text-center py-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                <div className="inline-block p-3 bg-green-500/20 rounded-full mb-3">
                                    <span className="material-icons text-3xl text-green-400">check_circle</span>
                                </div>
                                <p className="text-green-400 font-bold text-lg">Infrastructure Destroyed</p>
                                <p className="text-gray-400 text-sm mt-1">All resources have been removed.</p>
                            </div>
                        )}

                        {status === 'failed' && error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                <p className="text-red-400 text-sm font-bold mb-1">Error Occurred:</p>
                                <p className="text-red-300 text-sm">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer - Fixed at bottom of modal */}
                    <div className="p-6 border-t border-white/10 bg-[#1a1d26] flex justify-end gap-3 rounded-b-2xl">
                        {status === 'idle' && (
                            <>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDestroy}
                                    disabled={!isConfirmValid}
                                    className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${isConfirmValid
                                        ? 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20'
                                        : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                                        }`}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Infrastructure
                                </button>
                            </>
                        )}

                        {status === 'destroying' && (
                            <div className="flex items-center gap-3 text-yellow-400 bg-yellow-400/10 px-4 py-2 rounded-lg border border-yellow-400/20 w-full justify-center">
                                <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                <span className="font-medium animate-pulse">Destroying infrastructure...</span>
                            </div>
                        )}

                        {(status === 'success' || status === 'failed') && (
                            <button
                                onClick={onClose}
                                className="w-full px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors font-bold"
                            >
                                Close Window
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DestroyConfirmationModal;
