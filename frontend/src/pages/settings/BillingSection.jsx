import React, { useState, useEffect } from 'react';
import { Check, Loader2, CreditCard, Zap, ShieldCheck, Crown } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const BillingSection = () => {
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [usage, setUsage] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchStatus();
        fetchUsage();
    }, []);

    const fetchUsage = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/billing/usage`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsage(res.data);
        } catch (error) {
            console.error("Failed to fetch usage", error);
        }
    };

    const fetchStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/billing/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load billing status");
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async () => {
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            // 1. Create Subscription at Backend
            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/billing/subscription`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 2. Open Razorpay Checkout
            const options = {
                key: data.key_id,
                subscription_id: data.subscription_id,
                name: "Cloudiverse Pro",
                description: "Upgrade to Pro Plan",
                handler: async function (response) {
                    try {
                        // 3. Verify on Backend
                        const verifyRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/billing/verify`, {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_subscription_id: response.razorpay_subscription_id,
                            razorpay_signature: response.razorpay_signature
                        }, { headers: { Authorization: `Bearer ${token}` } });

                        toast.success("Upgrade Successful! Welcome to Pro.");
                        fetchStatus(); // Refresh UI
                    } catch (err) {
                        toast.error("Payment Verification Failed.");
                    }
                },
                theme: { color: "#4285F4" }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || "Upgrade failed");
        } finally {
            setProcessing(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Are you sure? You will lose Pro features at the end of the billing period.")) return;

        try {
            setProcessing(true);
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/billing/cancel`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Subscription cancelled. Active until period end.");
            fetchStatus();
        } catch (error) {
            toast.error("Cancellation failed");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-500 w-8 h-8" /></div>;

    const isPro = (status?.plan === 'pro' && status?.status === 'active') || status?.status === 'canceled_active';

    return (
        <div className="p-6 md:p-10 animate-fade-in relative">
            <h2 className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent mb-8 flex items-center gap-2">
                <CreditCard className="text-brand-500 w-6 h-6" /> Billing & Plans
            </h2>

            {/* Current Plan Status */}
            <div className="mb-12">
                <div className={`relative overflow-hidden rounded-2xl p-8 border ${isPro
                    ? 'bg-gradient-to-br from-brand-500/20 via-primary/5 to-background border-brand-500/30 shadow-lg shadow-brand-500/10'
                    : 'bg-white/5 border-white/10'
                    }`}>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-semibold tracking-wider text-text-secondary uppercase">Current Plan</span>
                                {isPro && <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${status?.status === 'canceled_active' ? 'bg-orange-500/20 text-orange-400 border-orange-500/20' : 'bg-brand-500/20 text-brand-500 border-brand-500/20'}`}>
                                    {status?.status === 'canceled_active' ? 'CANCELLATION PENDING' : 'PRO ACTIVE'}
                                </span>}
                            </div>
                            <h3 className="text-3xl font-black text-text-brand-500 flex items-center gap-3">
                                {isPro ? 'Pro Plan' : 'Free Tier'}
                                {isPro && <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400 drop-shadow-glow" />}
                            </h3>
                            <p className="text-text-secondary mt-2">
                                {isPro
                                    ? status?.status === 'canceled_active'
                                        ? `Access expires on ${new Date(status.renewal_date).toLocaleDateString()}`
                                        : `Next billing date: ${new Date(status.renewal_date).toLocaleDateString()}`
                                    : 'Basic access for personal projects and prototypes.'}
                            </p>
                        </div>

                        {isPro && (
                            <div className="flex flex-col gap-3">
                                {status?.status === 'canceled_active' ? (
                                    <button
                                        onClick={handleUpgrade} // Allow resubscribe
                                        disabled={processing}
                                        className="px-5 py-2.5 bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 rounded-xl font-medium transition-colors text-sm"
                                    >
                                        Resubscribe
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleCancel}
                                        disabled={processing}
                                        className="px-5 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl font-medium transition-colors text-sm"
                                    >
                                        Cancel Subscription
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Background decoration */}
                    {isPro && <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-brand-500/20 blur-3xl rounded-full pointer-events-none"></div>}
                </div>
            </div>

            {/* Usage Statistics (New Request) */}
            <div className="mb-12">
                <h3 className="text-xl font-bold text-text-brand-500 mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-500" /> Usage Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-surface border border-white/5">
                        <div className="text-text-secondary text-sm mb-2">Projects Created</div>
                        <div className="text-3xl font-bold text-text-brand-500">
                            {usage?.usage?.projects || 0} <span className="text-base font-normal text-text-subtle">/ {usage?.limits?.projects === null ? '∞' : usage?.limits?.projects || 3}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${isPro ? 'bg-brand-500' : 'bg-yellow-500'}`}
                                style={{ width: `${Math.min(100, ((usage?.usage?.projects || 0) / (usage?.limits?.projects || 3)) * 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-surface border border-white/5">
                        <div className="text-text-secondary text-sm mb-2">AI Requests</div>
                        <div className="text-3xl font-bold text-text-brand-500">{usage?.usage?.ai_requests || 0}</div>
                        <div className="text-xs text-text-subtle mt-2">Total AI generations used</div>
                    </div>

                    <div className="p-6 rounded-2xl bg-surface border border-white/5">
                        <div className="text-text-secondary text-sm mb-2">Exports (TF/Reports)</div>
                        <div className="text-3xl font-bold text-text-brand-500">
                            {(usage?.usage?.terraform_exports || 0) + (usage?.usage?.report_downloads || 0)}
                        </div>
                        <div className="text-xs text-text-subtle mt-2">Total exports generated</div>
                    </div>
                </div>
            </div>

            {/* Plans Comparison */}
            {
                !isPro && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
                        {/* Free Plan */}
                        <div className="relative p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-text-brand-500">Free</h3>
                                <div className="flex items-baseline gap-1 mt-2">
                                    <span className="text-4xl font-black text-text-brand-500">₹0</span>
                                    <span className="text-text-secondary">/month</span>
                                </div>
                                <p className="text-text-subtle mt-4 text-sm">Perfect for hobbyists and learning cloud architecture.</p>
                            </div>

                            <div className="space-y-4 mb-8 flex-1">
                                {[
                                    '3 Projects Limit',
                                    'Basic Diagram Export',
                                    'Community Support',
                                    'Standard Processing'
                                ].map((feat, i) => (
                                    <div key={i} className="flex items-center gap-3 text-text-secondary">
                                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm">{feat}</span>
                                    </div>
                                ))}
                            </div>

                            <button disabled className="w-full py-3 rounded-xl bg-white/5 text-text-secondary font-semibold border border-white/10 cursor-default">
                                Current Plan
                            </button>
                        </div>

                        {/* Pro Plan */}
                        <div className="relative p-1 rounded-3xl bg-gradient-to-b from-brand-500 via-primary/50 to-purple-600 shadow-2xl shadow-brand-500/20 hover:scale-[1.02] transition-transform duration-300">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-500 to-purple-600 px-4 py-1 rounded-full text-xs font-bold text-white shadow-lg uppercase tracking-wide">
                                Most Popular
                            </div>

                            <div className="h-full bg-surface rounded-[22px] p-8 flex flex-col relative overflow-hidden">
                                {/* Shine effect */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[80px] rounded-full pointer-events-none -mr-16 -mt-16"></div>

                                <div className="mb-6 relative z-10">
                                    <h3 className="text-xl font-bold text-text-brand-500 flex items-center gap-2">
                                        Pro <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    </h3>
                                    <div className="flex items-baseline gap-1 mt-2">
                                        <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-purple-500">₹999</span>
                                        <span className="text-text-secondary">/month</span>
                                    </div>
                                    <p className="text-text-subtle mt-4 text-sm">For professionals needing full power and flexibility.</p>
                                </div>

                                <div className="space-y-4 mb-8 flex-1 relative z-10">
                                    {[
                                        'Unlimited Projects',
                                        'Terraform Code Export',
                                        'High-Res Report PDF',
                                        'Priority Support',
                                        'Advanced AI Models'
                                    ].map((feat, i) => (
                                        <div key={i} className="flex items-center gap-3 text-text-brand-500">
                                            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 flex items-center justify-center shrink-0 shadow-md shadow-brand-500/20">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                            <span className="text-sm font-medium">{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleUpgrade}
                                    disabled={processing}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white font-bold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all flex justify-center items-center gap-2 group relative z-10"
                                >
                                    {processing ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                        <>
                                            Upgrade Now <Zap className="w-4 h-4 group-hover:scale-110 transition-transform fill-white/20" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default BillingSection;
