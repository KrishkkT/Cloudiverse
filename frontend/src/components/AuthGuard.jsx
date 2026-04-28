import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

export const AuthGuard = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center relative overflow-hidden">
                {/* Abstract Background bits to match Auth UI */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px]" />
                </div>

                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="relative">
                        <Loader className="w-12 h-12 text-primary animate-spin" />
                        <div className="absolute inset-0 blur-lg bg-primary/20 animate-pulse rounded-full" />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-bold text-white tracking-tight">Authenticating</h2>
                        <p className="text-gray-400 text-sm animate-pulse">Securing your workspace...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        // Redirect to login but save the current location to redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default AuthGuard;
