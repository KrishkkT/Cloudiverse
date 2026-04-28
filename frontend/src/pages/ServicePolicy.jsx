import React from 'react';
import LegalLayout, { LegalSection } from '../components/LegalLayout';
import { Shield, Clock, Globe, Zap } from 'lucide-react';

const ServicePolicy = () => {
    return (
        <LegalLayout 
            title="Service Delivery Policy" 
            lastUpdated="January 2026" 
            icon={Zap}
        >
            <LegalSection title="Immediate Access">
                <div className="flex items-start gap-4 mb-4">
                    <Clock className="h-5 w-5 text-brand-400 shrink-0 mt-1" />
                    <p>
                        Upon successful payment for any Cloudiverse subscription plan (Pro or Enterprise), 
                        access to the respective features is granted <strong>immediately</strong>.
                    </p>
                </div>
                <p>
                    You will receive a confirmation email with your transaction details, and your account 
                    status will be updated instantly to reflect your new plan limits. No physical shipping is involved.
                </p>
            </LegalSection>

            <LegalSection title="Digital Delivery">
                <div className="flex items-start gap-4 mb-4">
                    <Globe className="h-5 w-5 text-emerald-400 shrink-0 mt-1" />
                    <p>
                        Cloudiverse is a SaaS (Software as a Service) platform. All services are digital and 
                        accessed directly via our web application.
                    </p>
                </div>
                <ul className="space-y-3 list-disc pl-10">
                    <li>Architecture Diagrams are rendered in-browser in real-time.</li>
                    <li>Terraform code is generated and available for download immediately.</li>
                    <li>PDF Reports are generated on-demand with no waiting period.</li>
                </ul>
            </LegalSection>

            <LegalSection title="Support & Issues">
                <div className="flex items-start gap-4 mb-4">
                    <Shield className="h-5 w-5 text-blue-400 shrink-0 mt-1" />
                    <p>
                        If you experience any delays in account upgrading after payment, please contact our 
                        support team immediately.
                    </p>
                </div>
                <p>
                    We typically resolve synchronization issues within 4-24 hours. Contact us at 
                    <a href="mailto:support@cloudiverse.app" className="text-brand-400 hover:underline ml-1">
                        support@cloudiverse.app
                    </a>.
                </p>
            </LegalSection>
        </LegalLayout>
    );
};

export default ServicePolicy;
