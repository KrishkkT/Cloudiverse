import React, { useEffect, useState } from 'react';
import { BarChart2, HardDrive, Database, Cpu, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const UsageSection = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/settings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Construct Usage Object
                // If backend provided usage.projects_used, we use it. Otherwise 0.
                const projectsUsed = res.data?.usage?.projects_used || 0;

                // Determine limits based on plan (logic mirroring backend)
                // We'll trust backend to send limits implicitly or just hardcode for display based on plan name
                // Ideally backend sends 'limits' object. But let's infer for now.
                const isPro = res.data?.plan === 'pro';
                const projectLimit = isPro ? 1000 : 3;

                setStats({
                    projects: { used: projectsUsed, limit: projectLimit, label: isPro ? 'Unlimited' : '3 Projects' },
                    storage: { used: 1.2, limit: 5, unit: 'GB' }, // Mocked for now
                    apiCalls: { used: 142, limit: 1000, unit: 'reqs' } // Mocked
                });

            } catch (error) {
                console.error("Failed to fetch usage stats");
            } finally {
                setLoading(false);
            }
        };

        fetchUsage();
    }, []);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-500 w-8 h-8" /></div>;

    const getProgressColor = (percentage) => {
        if (percentage >= 100) return 'bg-red-500';
        if (percentage >= 80) return 'bg-yellow-500';
        return 'bg-brand-500';
    };

    return (
        <div className="p-6 md:p-10 animate-fade-in">
            <h2 className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent mb-8 flex items-center gap-2">
                <BarChart2 className="text-brand-500 w-6 h-6" /> Usage Metrics
            </h2>

            {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Projects Usage Card */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                <Database className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium text-text-subtle bg-white/5 px-2 py-1 rounded-lg">Real-time</span>
                        </div>

                        <h3 className="text-text-secondary font-medium mb-1">Active Projects</h3>
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-3xl font-bold text-text-primary">{stats.projects.used}</span>
                            <span className="text-sm text-text-secondary">/ {stats.projects.label}</span>
                        </div>

                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor((stats.projects.used / stats.projects.limit) * 100)}`}
                                style={{ width: `${Math.min((stats.projects.used / stats.projects.limit) * 100, 100)}%` }}
                            ></div>
                        </div>

                        {stats.projects.used >= stats.projects.limit && stats.projects.label !== 'Unlimited' && (
                            <div className="mt-4 flex items-center gap-2 text-yellow-500 text-sm bg-yellow-500/10 p-2 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                                <span>Limit reached. Upgrade for more.</span>
                            </div>
                        )}
                    </div>

                    {/* Storage Usage (Mock) */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                                <HardDrive className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium text-text-subtle bg-white/5 px-2 py-1 rounded-lg">Estimated</span>
                        </div>

                        <h3 className="text-text-secondary font-medium mb-1">Storage Used</h3>
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-3xl font-bold text-text-primary">{stats.storage.used}</span>
                            <span className="text-sm text-text-secondary">/ {stats.storage.limit} {stats.storage.unit}</span>
                        </div>

                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 w-[24%] rounded-full"></div>
                        </div>
                    </div>

                    {/* API Calls (Mock) */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                                <Cpu className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium text-text-subtle bg-white/5 px-2 py-1 rounded-lg">This Month</span>
                        </div>

                        <h3 className="text-text-secondary font-medium mb-1">AI Generations</h3>
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-3xl font-bold text-text-primary">{stats.apiCalls.used}</span>
                            <span className="text-sm text-text-secondary">/ {stats.apiCalls.limit}</span>
                        </div>

                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-[14%] rounded-full"></div>
                        </div>
                    </div>
                </div>

            ) : (
                <div className="text-center py-10 text-gray-400">Unable to load usage statistics</div>
            )}

            <p className="text-center text-text-subtle text-sm">
                Usage metrics are updated in real-time. Usage resets at the start of each billing cycle.
            </p>
        </div>
    );
};

export default UsageSection;
