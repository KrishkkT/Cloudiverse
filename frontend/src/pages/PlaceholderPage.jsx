import React from 'react';
import { Construction } from 'lucide-react';

const PlaceholderPage = ({ title, description }) => {
    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-24 h-24 rounded-full bg-brand-500/10 flex items-center justify-center mb-6">
                <Construction className="w-12 h-12 text-brand-500" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight text-center">{title}</h1>
            <p className="text-slate-400 text-center max-w-md">
                {description || "This feature is currently under active development. Check back soon for updates!"}
            </p>
        </div>
    );
};

export default PlaceholderPage;
