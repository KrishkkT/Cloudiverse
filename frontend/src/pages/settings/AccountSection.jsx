import React, { useState } from 'react';
import { User, Mail, Building, Save, AlertTriangle as AlertTitle } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const AccountSection = ({ user }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        company: user?.company || ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('http://localhost:5000/api/auth/profile', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Profile updated successfully");
            setIsEditing(false);
            // Ideally update global user context here if possible, or trigger reload
            setTimeout(() => window.location.reload(), 800);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        if (confirm("DANGER: This action is permanent! Are you sure you want to delete your account?")) {
            // Call delete API
            // For now just toast as per previous logic, or implement real delete call
            toast.error("Contact support to delete account manually for now.");
        }
    };

    return (
        <div className="p-6 md:p-10 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent flex items-center gap-2">
                    <User className="text-primary w-6 h-6" /> Account Profile
                </h2>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-brand-500 border border-brand-500/20 rounded-lg text-sm font-medium transition-colors"
                    >
                        Edit Profile
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-text-secondary hover:text-white text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors flex items-center gap-2"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-6 max-w-3xl">
                {/* Profile Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Display Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle w-5 h-5" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl transition-all outline-none ${isEditing
                                        ? 'bg-slate-900 border-brand-500/50 text-white focus:ring-2 focus:ring-brand-500/20'
                                        : 'bg-white/5 border-transparent text-text-secondary cursor-not-allowed'
                                        }`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle w-5 h-5" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl transition-all outline-none ${isEditing
                                        ? 'bg-slate-900 border-brand-500/50 text-white focus:ring-2 focus:ring-brand-500/20'
                                        : 'bg-white/5 border-transparent text-text-secondary cursor-not-allowed'
                                        }`}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-text-secondary mb-2">Company / Organization</label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle w-5 h-5" />
                                <input
                                    type="text"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    placeholder="Company Name"
                                    disabled={!isEditing}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl transition-all outline-none ${isEditing
                                        ? 'bg-slate-900 border-brand-500/50 text-white focus:ring-2 focus:ring-brand-500/20'
                                        : 'bg-white/5 border-transparent text-text-secondary cursor-not-allowed'
                                        }`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10">
                    <h3 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                        <AlertTitle className="w-4 h-4" /> Danger Zone
                    </h3>
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <p className="text-sm text-text-secondary">Permanently delete your account and all associated data.</p>
                            <p className="text-xs text-text-subtle mt-1">This action cannot be undone.</p>
                        </div>
                        <button
                            onClick={handleDeleteAccount}
                            className="px-4 py-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-lg text-sm transition-colors font-medium whitespace-nowrap"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSection;
