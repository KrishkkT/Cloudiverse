import React, { useState, useEffect } from 'react';
import { Settings, Bell, Moon, Sun, Monitor, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const PreferencesSection = () => {
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        marketingEmails: false,
        theme: 'system' // 'light', 'dark', 'system'
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/settings', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data && res.data.preferences) {
                // Merge with defaults
                setPreferences(prev => ({ ...prev, ...res.data.preferences }));
            }
        } catch (error) {
            console.error("Failed to load preferences", error);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/settings/preferences', {
                preferences
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Preferences saved successfully");
        } catch (error) {
            toast.error("Failed to save preferences");
        } finally {
            setLoading(false);
        }
    };

    const Toggle = ({ checked, onChange }) => (
        <button
            onClick={() => onChange(!checked)}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${checked ? 'bg-brand-500' : 'bg-slate-700'
                }`}
        >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'
                }`} />
        </button>
    );

    if (initialLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="p-6 md:p-10 animate-fade-in">
            <h2 className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent mb-6 flex items-center gap-2">
                <Settings className="text-primary w-6 h-6" /> Preferences
            </h2>

            <div className="max-w-3xl space-y-6">

                {/* Notifications Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-lg">
                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-text-secondary" /> Email Notifications
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-text-primary font-medium">Deployment Alerts</p>
                                <p className="text-sm text-text-secondary">Get notified when your deployments succeed or fail.</p>
                            </div>
                            <Toggle
                                checked={preferences.emailNotifications}
                                onChange={(val) => setPreferences(prev => ({ ...prev, emailNotifications: val }))}
                            />
                        </div>
                        <div className="border-t border-border/50 my-2"></div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-text-primary font-medium">Product Updates</p>
                                <p className="text-sm text-text-secondary">Receive news about new features and improvements.</p>
                            </div>
                            <Toggle
                                checked={preferences.marketingEmails}
                                onChange={(val) => setPreferences(prev => ({ ...prev, marketingEmails: val }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Appearance Card */}
                {/* 
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-lg">
                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-text-secondary" /> Appearance
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        {['light', 'dark', 'system'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setPreferences(prev => ({ ...prev, theme: t }))}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                    preferences.theme === t 
                                    ? 'bg-primary/10 border-primary text-primary' 
                                    : 'bg-background border-border text-text-secondary hover:bg-white/5'
                                }`}
                            >
                                {t === 'light' && <Sun className="w-6 h-6" />}
                                {t === 'dark' && <Moon className="w-6 h-6" />}
                                {t === 'system' && <Monitor className="w-6 h-6" />}
                                <span className="capitalize text-sm font-medium">{t}</span>
                            </button>
                        ))}
                    </div>
                </div> 
                */}

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-3 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-all flex items-center gap-2 shadow-lg shadow-brand-500/20"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Preferences
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PreferencesSection;
