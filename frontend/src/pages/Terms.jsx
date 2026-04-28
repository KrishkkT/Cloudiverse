import React from 'react';
import LegalLayout, { LegalSection } from '../components/LegalLayout';
import { FileText } from 'lucide-react';

const Terms = () => {
    return (
        <LegalLayout 
            title="Terms of Service" 
            lastUpdated="December 2024" 
            icon={FileText}
        >
            <LegalSection title="1. Acceptance of Terms">
                <p>
                    By accessing and using Cloudiverse Architect ("the Service"), you accept and agree to be bound
                    by the terms and provision of this agreement. If you do not agree to abide by these terms,
                    please do not use this service.
                </p>
            </LegalSection>

            <LegalSection title="2. Description of Service">
                <p>
                    Cloudiverse Architect provides cloud infrastructure design, cost estimation, and Terraform
                    code generation services. The Service allows users to design multi-cloud architectures
                    using natural language descriptions and export deployment-ready infrastructure code.
                </p>
            </LegalSection>

            <LegalSection title="3. User Responsibilities">
                <ul className="space-y-3 list-disc pl-5">
                    <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                    <li>You agree not to use the Service for any unlawful purpose.</li>
                    <li>You are responsible for reviewing and validating generated infrastructure code before deployment.</li>
                    <li>You agree not to attempt to gain unauthorized access to the Service or its systems.</li>
                </ul>
            </LegalSection>

            <LegalSection title="4. Intellectual Property">
                <p>
                    The Service and its original content, features, and functionality are owned by Cloudiverse
                    and are protected by international copyright, trademark, patent, trade secret, and other
                    intellectual property laws. Infrastructure designs and code you create using the Service
                    remain your property.
                </p>
            </LegalSection>

            <LegalSection title="5. Limitation of Liability">
                <p>
                    Cloudiverse shall not be liable for any indirect, incidental, special, consequential,
                    or punitive damages resulting from your use of or inability to use the Service.
                    Cost estimates are provided for informational purposes and may not reflect actual
                    cloud provider charges.
                </p>
            </LegalSection>

            <LegalSection title="6. Changes to Terms">
                <p>
                    We reserve the right to modify or replace these Terms at any time. If a revision is
                    material, we will provide at least 30 days' notice prior to any new terms taking effect.
                </p>
            </LegalSection>

            <LegalSection title="7. Contact Information">
                <p>
                    If you have any questions about these Terms, please contact us at 
                    <a href="mailto:support@cloudiverse.app" className="text-brand-400 hover:underline ml-1">
                        support@cloudiverse.app
                    </a>.
                </p>
            </LegalSection>
        </LegalLayout>
    );
};

export default Terms;
