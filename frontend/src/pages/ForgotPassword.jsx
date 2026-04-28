import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { KeyRound, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import AuthHeader from '../components/AuthHeader';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/forgot-password`, { email });
            toast.success('OTP sent to your email!');
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (newPassword.length < 6) {
                toast.error("Password must be at least 6 characters.");
                setLoading(false);
                return;
            }

            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/reset-password`, {
                email,
                otp,
                newPassword
            });
            toast.success('Password reset successfully! Please login.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-void relative overflow-hidden">
            {/* Subtle radial glow */}
            <div className="absolute inset-0 hero-glow pointer-events-none" />

            <AuthHeader />

            <div className="relative z-10 pt-[72px] min-h-screen flex flex-col items-center justify-center px-4 pb-12">
                <div className="w-full max-w-[440px] bg-s1 border border-border rounded-xl p-8 lg:p-10 animate-fade-in-up"
                  style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.50)' }}>

                    <div className="text-center mb-8">
                        <div className="w-12 h-12 rounded-lg bg-primary-dim flex items-center justify-center mx-auto mb-4">
                            <KeyRound className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-[22px] font-semibold text-text-primary tracking-[-0.3px]">Reset password</h2>
                        <p className="text-[14px] text-text-secondary mt-2">
                            {step === 1 ? 'Enter your email to receive an OTP.' : 'Enter the OTP sent to your email.'}
                        </p>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleSendOTP} className="flex flex-col gap-5">
                            <div>
                                <label className="form-label">Email address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="form-input"
                                    placeholder="name@company.com"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full py-3 disabled:opacity-60"
                            >
                                {loading ? 'Sending...' : 'Send OTP'}
                                {!loading && <Send className="w-4 h-4" />}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                            <div>
                                <label className="form-label">OTP code</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="form-input text-center tracking-[0.5em] text-lg font-mono uppercase"
                                    placeholder="123456"
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">New password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="form-input"
                                    placeholder="New password"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full py-3 disabled:opacity-60"
                            >
                                {loading ? 'Resetting...' : 'Reset password'}
                                {!loading && <CheckCircle2 className="w-4 h-4" />}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-border text-center">
                        <Link to="/login" className="text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-2">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
