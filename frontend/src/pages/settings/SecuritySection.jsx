import React, { useState } from 'react';
import { Shield, Key, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const SecuritySection = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            return toast.error("New passwords do not match");
        }
        if (formData.newPassword.length < 6) {
            return toast.error("Password must be at least 6 characters");
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/auth/update-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Password updated successfully");
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-10 animate-fade-in max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent mb-8 flex items-center gap-2">
                <Shield className="text-brand-500 w-6 h-6" /> Security Settings
            </h2>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Change Password</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Ensure your account is using a long, random password to stay secure. We highly recommend utilizing a password manager to generate and store your passwords.
                    </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all outline-none"
                                    placeholder="Enter current password"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all outline-none"
                                    placeholder="Enter new password (min. 6 chars)"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all outline-none"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 mt-6 border-t border-white/5">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-all flex items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                            Update Password
                        </button>
                    </div>
                </form>
            </div>

            <div className="mt-8 p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-yellow-500 font-semibold text-sm">Security Tip</h4>
                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                        Avoid using the same password across multiple services. Choosing a strong, unique password helps keep your cloud infrastructure secure.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SecuritySection;
