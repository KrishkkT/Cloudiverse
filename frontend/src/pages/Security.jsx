import React from 'react';
import LegalLayout, { LegalSection } from '../components/LegalLayout';
import { Shield, Lock, Eye, Server, Key, AlertTriangle, CheckCircle } from 'lucide-react';

const Security = () => {
    const securityFeatures = [
        {
            icon: <Lock size={24} />,
            title: "Encryption",
            color: "text-brand-400",
            description: "All data is encrypted using AES-256 at rest and TLS 1.3 in transit."
        },
        {
            icon: <Key size={24} />,
            title: "Authentication",
            color: "text-emerald-400",
            description: "JWT-based authentication with secure password hashing using bcrypt."
        },
        {
            icon: <Server size={24} />,
            title: "Infrastructure",
            color: "text-blue-400",
            description: "Hosted on enterprise-grade cloud infrastructure with regular updates."
        },
        {
            icon: <Eye size={24} />,
            title: "Access Controls",
            color: "text-purple-400",
            description: "Role-based access control with principle of least privilege."
        }
    ];

    return (
        <LegalLayout 
            title="Security Architecture" 
            lastUpdated="January 2025" 
            icon={Shield}
        >
            <div className="grid md:grid-cols-2 gap-6 mb-12">
                {securityFeatures.map((feature, index) => (
                    <div key={index} className="glass-premium p-8 rounded-[2rem] border border-white/5">
                        <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 ${feature.color}`}>
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                ))}
            </div>

            <LegalSection title="Security Best Practices">
                <ul className="space-y-4">
                    {[
                        "Regular security audits and vulnerability assessments",
                        "Automated security scanning of all code deployments",
                        "Employee security training and awareness programs",
                        "Incident response plan and 24/7 monitoring",
                        "Regular backup and disaster recovery testing"
                    ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-300">
                            <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </LegalSection>

            <div className="mt-8 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] p-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                        <AlertTriangle size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Report a Vulnerability</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    If you discover a security vulnerability, please report it responsibly to our security team. 
                    We take all reports seriously and aim to respond within 24 hours.
                </p>
                <a 
                    href="mailto:support@cloudiverse.app" 
                    className="inline-flex items-center gap-2 text-amber-400 font-bold hover:underline"
                >
                    <span>support@cloudiverse.app</span>
                </a>
            </div>
        </LegalLayout>
    );
};

export default Security;
