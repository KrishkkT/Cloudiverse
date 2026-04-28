import { useEffect, useState } from "react";

export default function CaptchaGate({ onVerified }) {
    const [rayId] = useState(() => Math.random().toString(36).substring(2, 11).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase());

    useEffect(() => {
        // Load Turnstile script once
        if (!document.getElementById("cf-turnstile-script")) {
            const script = document.createElement("script");
            script.id = "cf-turnstile-script";
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        }

        // Callback Cloudflare calls after success
        window.onTurnstileSuccess = function (token) {
            onVerified(token);
        };
    }, [onVerified]);

    return (
        <div className="fixed inset-0 bg-[#0f111a] flex flex-col z-[9999] font-sans selection:bg-orange-500/30 overflow-y-auto">
            <div className="flex-1 flex flex-col justify-center">
                <div className="w-full max-w-[1400px] mx-auto px-6 md:px-16 py-20 animate-fade-in-up">
                    <div className="flex flex-col items-start text-left mb-10">
                        <h1 className="text-[34px] md:text-[48px] font-medium text-white mb-8 tracking-tight leading-tight">
                            Verify you are human
                        </h1>
                        <p className="text-[16px] md:text-[18px] text-[#9ca3af] leading-relaxed max-w-2xl">
                            Verifying you are human. This may take a few seconds.
                        </p>
                    </div>

                    <div className="flex justify-start mb-16 min-h-[65px]">
                        <div
                            className="cf-turnstile"
                            data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                            data-callback="onTurnstileSuccess"
                            data-theme="dark"
                        ></div>
                    </div>

                    <div className="text-[14px] md:text-[15px] text-[#6b7280] space-y-6 border-t border-white/5 pt-12">
                        <p className="leading-relaxed max-w-2xl">
                            Cloudiverse needs to review the security of your connection.
                        </p>
                        
                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 text-[13px] font-mono text-[#4b5563] pt-6">
                            <div className="flex items-center gap-3">
                                <span className="font-sans uppercase text-[11px] tracking-widest font-black opacity-40">Ray ID:</span>
                                <span className="text-white/30">{rayId}</span>
                            </div>
                            <span className="hidden md:inline opacity-20">•</span>
                            <div className="flex items-center gap-2">
                                <span className="font-sans">Performance & security by</span>
                                <a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer" className="font-bold text-white/40 hover:text-orange-500 transition-colors">Cloudflare</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
