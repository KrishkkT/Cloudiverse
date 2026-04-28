import React from 'react';
import LegalLayout, { LegalSection } from '../components/LegalLayout';
import { CheckCircle, FileCheck, Shield, Globe } from 'lucide-react';

const Compliance = () => {
    const complianceAreas = [
        {
            icon: <Shield size={24} />,
            title: "Data Protection",
            color: "text-brand-400",
            items: [
                "GDPR compliant data processing",
                "Data minimization principles",
                "Right to erasure (Right to be forgotten)",
                "Data portability support"
            ]
        },
        {
            icon: <FileCheck size={24} />,
            title: "Security Standards",
            color: "text-emerald-400",
            items: [
                "SOC 2 Type II principles",
                "ISO 27001 aligned practices",
                "Regular penetration testing",
                "Vulnerability management program"
            ]
        },
        {
            icon: <Globe size={24} />,
            title: "Regional Compliance",
            color: "text-blue-400",
            items: [
                "EU data residency options",
                "CCPA compliance for California users",
                "Cross-border data transfer safeguards",
                "Local regulatory requirements"
            ]
        }
    ];

    return (
        <LegalLayout 
            title="Compliance Standards" 
            lastUpdated="January 2025" 
            icon={CheckCircle}
        >
            <div className="grid md:grid-cols-3 gap-6 mb-12">
                {complianceAreas.map((area, index) => (
                    <div key={index} className="glass-premium p-6 rounded-[2rem] border border-white/5">
                        <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 ${area.color}`}>
                            {area.icon}
                        </div>
                        <h3 className="text-lg font-bold text-white mb-4">{area.title}</h3>
                        <ul className="space-y-3">
                            {area.items.map((item, itemIndex) => (
                                <li key={itemIndex} className="flex items-start gap-2 text-xs text-slate-400">
                                    <CheckCircle size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <LegalSection title="Our Commitments">
                <div className="space-y-8">
                    <div>
                        <h3 className="text-white font-bold mb-2">Transparency</h3>
                        <p>
                            We are transparent about how we collect, use, and share your data. Our privacy policy
                            clearly outlines our data practices, ensuring you always know how your information is handled.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-white font-bold mb-2">User Control</h3>
                        <p>
                            You have full control over your data. Export, modify, or delete your data at any time
                            through your account settings. We provide easy-to-use tools for data management.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-white font-bold mb-2">Continuous Improvement</h3>
                        <p>
                            We continuously monitor and improve our compliance posture as regulations evolve and
                            new standards emerge. Our team is dedicated to staying ahead of regulatory changes.
                        </p>
                    </div>
                </div>
            </LegalSection>

            <LegalSection title="Contact Information">
                <p>
                    For compliance inquiries, please contact 
                    <a href="mailto:support@cloudiverse.app" className="text-brand-400 hover:underline ml-1">
                        support@cloudiverse.app
                    </a>
                </p>
            </LegalSection>
        </LegalLayout>
    );
};

export default Compliance;
