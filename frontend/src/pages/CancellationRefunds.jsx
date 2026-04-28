import React from 'react';
import LegalLayout, { LegalSection } from '../components/LegalLayout';
import { DollarSign, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

const CancellationRefunds = () => {
    return (
        <LegalLayout 
            title="Cancellations & Refunds" 
            lastUpdated="January 2026" 
            icon={DollarSign}
        >
            <LegalSection title="Cancellation Policy">
                <div className="flex items-start gap-4 mb-4">
                    <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-1" />
                    <p>
                        You may cancel your subscription at any time via the <strong>Settings &gt; Billing</strong> page.
                    </p>
                </div>
                <p>
                    Upon cancellation, your subscription will remain active until the end of the current billing period. 
                    After this period, your account will automatically downgrade to the Free Tier, and you will lose 
                    access to premium features like unlimited projects and Terraform exports.
                </p>
            </LegalSection>

            <LegalSection title="Refund Policy">
                <div className="flex items-start gap-4 mb-4">
                    <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-1" />
                    <p>
                        <strong>Cloudiverse generally acts on a strict no-refund policy</strong> due to the digital 
                        nature of our services and immediate allocation of compute resources.
                    </p>
                </div>
                <p className="mb-4">
                    However, we review refund requests on a case-by-case basis under the following circumstances:
                </p>
                <ul className="space-y-3 list-disc pl-10">
                    <li>Duplicate charges due to a confirmed system error.</li>
                    <li>Service unavailability exceeding our SLA (24+ hours of unexpected downtime).</li>
                    <li>Requests made within 24 hours of purchase if no premium resources (Generations/Exports) were utilized.</li>
                </ul>
            </LegalSection>

            <LegalSection title="How to Request">
                <div className="flex items-start gap-4 mb-4">
                    <RefreshCw className="h-5 w-5 text-brand-400 shrink-0 mt-1" />
                    <p>
                        To request a refund or raise a billing dispute, please contact our dedicated billing team.
                    </p>
                </div>
                <p>
                    Email us at <a href="mailto:billing@cloudiverse.app" className="text-brand-400 hover:underline">billing@cloudiverse.app</a> with your 
                    transaction ID and a brief explanation. Our team reviews all requests within 3-5 business days.
                </p>
            </LegalSection>
        </LegalLayout>
    );
};

export default CancellationRefunds;
