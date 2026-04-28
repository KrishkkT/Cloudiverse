import React from 'react';
import LegalLayout, { LegalSection } from '../components/LegalLayout';
import { Lock, Eye, Database, Shield } from 'lucide-react';

const Privacy = () => {
    return (
        <LegalLayout 
            title="Privacy Policy" 
            lastUpdated="December 2024" 
            icon={Lock}
        >
            <LegalSection title="Information We Collect">
                <div className="flex items-start gap-4 mb-4">
                    <Eye className="h-5 w-5 text-brand-400 shrink-0 mt-1" />
                    <p>
                        We collect information you provide directly to us:
                    </p>
                </div>
                <ul className="space-y-2 list-disc pl-10">
                    <li>Account information (name, email, password)</li>
                    <li>Project data (infrastructure descriptions, configurations)</li>
                    <li>Usage data (features used, time spent)</li>
                    <li>Communication data (support requests, feedback)</li>
                </ul>
            </LegalSection>

            <LegalSection title="How We Use Your Information">
                <div className="flex items-start gap-4 mb-4">
                    <Database className="h-5 w-5 text-emerald-400 shrink-0 mt-1" />
                    <p>
                        Your data is used to provide a high-performance experience:
                    </p>
                </div>
                <ul className="space-y-2 list-disc pl-10">
                    <li>To provide, maintain, and improve our services</li>
                    <li>To process your transactions and send related information</li>
                    <li>To send you technical notices, updates, and support messages</li>
                    <li>To respond to your comments, questions, and requests</li>
                    <li>To analyze usage patterns and improve user experience</li>
                </ul>
            </LegalSection>

            <LegalSection title="Data Protection">
                <div className="flex items-start gap-4 mb-4">
                    <Shield className="h-5 w-5 text-blue-400 shrink-0 mt-1" />
                    <p>
                        We implement industry-standard security measures to protect your data:
                    </p>
                </div>
                <ul className="space-y-2 list-disc pl-10">
                    <li>Encryption in transit (TLS 1.3) and at rest (AES-256)</li>
                    <li>Regular security audits and penetration testing</li>
                    <li>Access controls and authentication requirements</li>
                    <li>Data backup and disaster recovery procedures</li>
                </ul>
            </LegalSection>

            <LegalSection title="Data Retention">
                <p>
                    We retain your personal information for as long as your account is active or as needed
                    to provide you services. You can request deletion of your data at any time by contacting
                    our support team or using the account deletion feature in settings.
                </p>
            </LegalSection>

            <LegalSection title="Your Rights">
                <ul className="space-y-2 list-disc pl-5">
                    <li>Access and receive a copy of your personal data</li>
                    <li>Request correction of inaccurate data</li>
                    <li>Request deletion of your data</li>
                    <li>Object to processing of your data</li>
                    <li>Export your data in a portable format</li>
                </ul>
            </LegalSection>

            <LegalSection title="Contact Us">
                <p>
                    If you have questions about this Privacy Policy, please contact us at 
                    <a href="mailto:support@cloudiverse.app" className="text-brand-400 hover:underline ml-1">
                        support@cloudiverse.app
                    </a>
                </p>
            </LegalSection>
        </LegalLayout>
    );
};

export default Privacy;
