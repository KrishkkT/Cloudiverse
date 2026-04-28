import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Github, RefreshCw, CheckCircle, ChevronRight, Search } from 'lucide-react';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const GitHubRepoSelector = ({ onSelect, selectedRepo }) => {
    const [status, setStatus] = useState('loading'); // loading, unconnected, connected
    const [repos, setRepos] = useState([]);
    const [account, setAccount] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRepos();

        // Listen for OAuth success from popup
        const handleMessage = (event) => {
            if (event.data?.type === 'GITHUB_CONNECTED') {
                setStatus('loading');
                toast.success("GitHub connected successfully!");
                // Small delay to ensure DB transaction is fully finalized
                setTimeout(() => fetchRepos(), 500);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const fetchRepos = async () => {
        setStatus('loading'); // Ensure setStatus('loading') is called at the start of fetchRepos.
        console.log("[GITHUB] Fetching repos and account info...");
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Fetch account info and repos in parallel
            const [reposRes, accountRes] = await Promise.all([
                axios.get(`${API_BASE}/api/github/repos`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_BASE}/api/github/account`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            console.log("[GITHUB] Successfully fetched account:", accountRes.data.account_name);
            setRepos(reposRes.data);
            setAccount(accountRes.data);
            setStatus('connected');
        } catch (err) {
            console.warn("[GITHUB] Connection check response:", err.response?.status);
            setStatus('unconnected');
            if (err.response?.status !== 404) {
                console.error("[GITHUB] Error fetching GitHub data:", err.response?.data || err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = () => {
        const token = localStorage.getItem('token');
        const url = `${API_BASE}/api/github/connect?token=${token}`;
        window.open(url, 'GitHubAuth', 'width=600,height=700');
    };

    const handleDisconnect = async () => {
        if (!window.confirm("Disconnect your GitHub account?")) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE}/api/github`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("GitHub account disconnected");
            setRepos([]);
            setAccount(null);
            setStatus('unconnected');
        } catch (err) {
            console.error("Failed to disconnect", err);
            toast.error("Failed to disconnect GitHub account");
        }
    };

    const filteredRepos = repos.filter(r =>
        r.full_name.toLowerCase().includes(search.toLowerCase())
    );

    if (status === 'loading' && !repos.length) {
        return (
            <div className="flex items-center justify-center p-8 bg-white/5 border border-white/10 rounded-xl">
                <RefreshCw className="w-6 h-6 text-primary animate-spin" />
            </div>
        );
    }

    if (status === 'unconnected') {
        return (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center animate-fade-in">
                <Github className="w-12 h-12 text-text-subtle mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Connect GitHub</h3>
                <p className="text-sm text-text-secondary mb-6">Connect your GitHub account to deploy directly from your repositories.</p>
                <button
                    onClick={handleConnect}
                    className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition flex items-center gap-2 mx-auto"
                >
                    <Github className="w-5 h-5" />
                    Connect GitHub
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden animate-fade-in">
            {/* Account Header */}
            <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {account?.account_avatar && (
                        <img src={account.account_avatar} alt="Avatar" className="w-6 h-6 rounded-full border border-white/20" />
                    )}
                    <span className="text-xs font-medium text-white">Connected as <span className="text-primary">{account?.account_name}</span></span>
                </div>
                <button
                    onClick={handleDisconnect}
                    className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                >
                    <span className="material-icons text-xs">logout</span>
                    Disconnect
                </button>
            </div>

            <div className="p-4 border-b border-white/10 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search repositories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-primary/50 transition-all"
                    />
                </div>
                <button
                    onClick={fetchRepos}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-subtle hover:text-white"
                    disabled={loading}
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {filteredRepos.length === 0 ? (
                    <div className="p-8 text-center text-text-subtle text-sm">
                        No repositories found.
                    </div>
                ) : (
                    filteredRepos.map(repo => (
                        <div
                            key={repo.id}
                            onClick={() => onSelect(repo)}
                            className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${selectedRepo?.id === repo.id ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-white/5'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Github className="w-4 h-4 text-text-subtle" />
                                <div>
                                    <div className="text-sm font-medium text-white">{repo.full_name}</div>
                                    <div className="text-xs text-text-subtle capitalize">{repo.language || 'No language data'}</div>
                                </div>
                            </div>
                            {selectedRepo?.id === repo.id ? (
                                <CheckCircle className="w-5 h-5 text-primary" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-text-subtle" />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default GitHubRepoSelector;
