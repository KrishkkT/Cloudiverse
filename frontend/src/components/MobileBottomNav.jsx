import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, PlusCircle, Settings } from 'lucide-react';

const MobileBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-s1/95 backdrop-blur-sm border-t border-border px-6 py-2.5 flex justify-between items-center z-50 md:hidden pb-safe">
            <button
                onClick={() => navigate('/')}
                className={`flex flex-col items-center gap-0.5 transition-colors ${isActive('/') && location.pathname === '/' ? 'text-primary' : 'text-text-subtle hover:text-text-primary'}`}
            >
                <Home className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-[10px] font-medium">Home</span>
            </button>

            <button
                onClick={() => navigate('/workspaces')}
                className={`flex flex-col items-center gap-0.5 transition-colors ${location.pathname === '/workspaces' ? 'text-primary' : 'text-text-subtle hover:text-text-primary'}`}
            >
                <LayoutGrid className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-[10px] font-medium">Projects</span>
            </button>

            <div className="relative -top-4">
                <button
                    onClick={() => navigate('/workspaces/new')}
                    className="bg-primary text-white p-3.5 rounded-full shadow-lg flex items-center justify-center transform active:scale-95 transition-all"
                    style={{ boxShadow: '0 4px 16px rgba(61,127,255,0.30)' }}
                >
                    <PlusCircle className="w-6 h-6" strokeWidth={1.5} />
                </button>
            </div>

            <button
                onClick={() => navigate('/settings')}
                className={`flex flex-col items-center gap-0.5 transition-colors ${isActive('/settings') ? 'text-primary' : 'text-text-subtle hover:text-text-primary'}`}
            >
                <Settings className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-[10px] font-medium">Settings</span>
            </button>
        </div>
    );
};

export default MobileBottomNav;
