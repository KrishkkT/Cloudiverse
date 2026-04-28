import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
    ChevronDown, 
    ExternalLink, 
    Check, 
    Copy, 
    ArrowDown, 
    PartyPopper,
    CheckCircle2
} from 'lucide-react';

const DeploymentGuide = ({ provider, region, projectName, onMarkDeployed, isMarkingDeployed }) => {
    const [isExpanded, setIsExpanded] = useState(false); // Global collapse state
    const [openStep, setOpenStep] = useState(0); // Index of currently open step
    const [completedSteps, setCompletedSteps] = useState(new Set()); // Set of completed step indices

    const toggleStep = (index) => {
        setOpenStep(openStep === index ? -1 : index);
    };

    const toggleCompletion = (e, index) => {
        e.stopPropagation(); // Prevent accordion toggle
        const newCompleted = new Set(completedSteps);
        if (newCompleted.has(index)) {
            newCompleted.delete(index);
        } else {
            newCompleted.add(index);
            // Optional: Auto-advance if marking current step as complete
            if (openStep === index && index < steps.length - 1) {
                setOpenStep(index + 1);
            }
        }
        setCompletedSteps(newCompleted);
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label}`);
    };

    // --- Provider Data ---
    const providerKey = provider?.toLowerCase().replace(/\s+/g, '') || 'aws';
    const isAws = providerKey === 'aws' || providerKey.includes('amazon');
    const isAzure = providerKey === 'azure' || providerKey.includes('microsoft');
    const isGcp = providerKey === 'gcp' || providerKey.includes('google');

    const steps = [
        {
            title: isAws ? 'Create AWS Account' : isAzure ? 'Create Azure Account' : 'Create GCP Account',
            duration: '5 min',
            description: 'Ensure you have a valid cloud provider account with billing enabled.',
            links: [
                { label: isAws ? 'AWS Free Tier' : isAzure ? 'Azure Free Account' : 'GCP Free Tier', url: isAws ? 'https://aws.amazon.com/free' : isAzure ? 'https://azure.microsoft.com/free' : 'https://cloud.google.com/free' },
            ],
            commands: null
        },
        {
            title: 'Install CLI & Terraform',
            duration: '3 min',
            description: 'Install the necessary command-line tools to interact with your cloud provider and deploy infrastructure.',
            links: [
                { label: 'Terraform Download', url: 'https://www.terraform.io/downloads' },
                { label: isAws ? 'AWS CLI Guide' : isAzure ? 'Azure CLI Guide' : 'GCloud CLI Guide', url: isAws ? 'https://aws.amazon.com/cli/' : isAzure ? 'https://learn.microsoft.com/cli/azure/install-azure-cli' : 'https://cloud.google.com/sdk/docs/install' }
            ],
            commands: [
                {
                    cmd: isAws ? 'aws --version\nterraform --version' : isAzure ? 'az --version\nterraform --version' : 'gcloud --version\nterraform --version',
                    label: 'Check Versions'
                }
            ]
        },
        {
            title: 'Login & Select Region',
            duration: '2 min',
            description: 'Authenticate your CLI sessions and target the correct region.',
            links: null,
            commands: [
                {
                    cmd: isAws ?
                        `aws configure\n# Enter Access Key & Secret Key\naws configure set region ${region || 'ap-south-1'}` :
                        isAzure ?
                            `az login\naz account show` :
                            `gcloud auth application-default login\ngcloud config set project [YOUR_PROJECT_ID]`,
                    label: 'Login Commands'
                }
            ]
        },
        {
            title: 'Initialize Terraform',
            duration: '2 min',
            description: 'Prepare your working directory for the new configuration.',
            links: null,
            commands: [
                {
                    cmd: `unzip ${projectName || 'project'}-terraform.zip\ncd ${providerKey}/\nterraform init`,
                    label: 'Init Commands'
                }
            ]
        },
        {
            title: 'Deploy Infrastructure',
            duration: '3 min',
            description: 'Preview and apply the changes to your cloud environment.',
            links: null,
            commands: [
                {
                    cmd: 'terraform plan\nterraform apply',
                    label: 'Deploy Commands'
                }
            ]
        },
        {
            title: 'Verify Services',
            duration: '2 min',
            description: 'Confirm that all resources are up and running as expected.',
            links: null,
            checklist: [
                'Infrastructure created successfully (no errors)',
                'Application endpoint is reachable (if applicable)',
                'Database connection verified',
                'Resources appear in Cloud Console'
            ],
            isVerification: true
        }
    ];

    return (
        <div className="bg-[#1e1e1e] rounded-xl border border-white/5 shadow-xl overflow-hidden animate-fade-in font-sans">
            {/* --- Main Header --- */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-[#252525] px-6 py-5 border-b border-white/10 flex items-center justify-between cursor-pointer hover:bg-[#2a2a2a] transition-colors select-none"
            >
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">🚀</span>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-wide">Deployment Guide</h3>
                        <p className="text-xs text-gray-400">
                            {isExpanded ? 'Follow these steps to deploy on ' : 'Click to expand deployment steps for '}
                            <span className="text-primary font-semibold">{isAws ? 'AWS' : isAzure ? 'Azure' : 'GCP'}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    {/* Provider Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isAws ? 'bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/20' :
                        isAzure ? 'bg-[#0078D4]/10 text-[#0078D4] border border-[#0078D4]/20' :
                            'bg-[#4285F4]/10 text-[#4285F4] border border-[#4285F4]/20'
                        }`}>
                        {isAws ? 'Amazon Web Services' : isAzure ? 'Microsoft Azure' : 'Google Cloud'}
                    </div>
                    {/* External Link */}
                    <a
                        href="https://cloudiverse.app/docs"
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-white text-xs flex items-center space-x-1 transition-colors"
                    >
                        <span>Docs</span>
                        <ExternalLink size={10} />
                    </a>
                    {/* Chevron */}
                    <ChevronDown className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} size={20} />
                </div>
            </div>

            {/* --- Steps Container --- */}
            {isExpanded && (
                <div className="animate-fade-in">
                    <div className="p-6 space-y-3 bg-[#1e1e1e]">
                        {steps.map((step, index) => {
                            const isOpen = openStep === index;
                            const isCompleted = completedSteps.has(index);

                            return (
                                <div
                                    key={index}
                                    className={`rounded-lg border transition-all duration-300 overflow-hidden ${isOpen
                                        ? 'bg-[#2a2a2a] border-primary/30 shadow-lg scale-[1.01]'
                                        : 'bg-[#252525] border-white/5 hover:bg-[#2d2d2d] cursor-pointer'
                                        }`}
                                >
                                    {/* Step Header */}
                                    <div
                                        onClick={() => toggleStep(index)}
                                        className="px-5 py-4 flex items-center justify-between select-none"
                                    >
                                        <div className="flex items-center space-x-4">
                                            {/* Number Badge */}
                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold font-mono ${isOpen ? 'bg-primary text-white' : 'bg-white/10 text-gray-400'
                                                }`}>
                                                {index + 1}
                                            </div>

                                            {/* Title */}
                                            <span className={`font-medium transition-colors ${isOpen ? 'text-white' : 'text-gray-300'
                                                }`}>
                                                {step.title}
                                            </span>
                                        </div>

                                        <div className="flex items-center space-x-6">
                                            <span className="text-xs text-gray-500 font-mono">{step.duration}</span>

                                            {/* Completion Circle */}
                                            <div
                                                onClick={(e) => toggleCompletion(e, index)}
                                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer hover:scale-110 ${isCompleted
                                                    ? 'bg-green-500 border-green-500 text-black'
                                                    : 'border-gray-600 hover:border-gray-400'
                                                    }`}
                                            >
                                                {isCompleted && <Check size={14} className="font-bold" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step Content (Accordion Body) */}
                                    {isOpen && (
                                        <div className="px-5 pb-5 pt-0 animate-fade-in-down">
                                            <div className="pl-10 space-y-4">
                                                {/* Description */}
                                                <p className="text-sm text-gray-400 leading-relaxed border-l-2 border-white/10 pl-3">
                                                    {step.description}
                                                </p>

                                                {/* Links (Pills) */}
                                                {step.links && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {step.links.map((link, i) => (
                                                            <a
                                                                key={i}
                                                                href={link.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-xs text-primary transition-colors flex items-center space-x-1 border border-transparent hover:border-primary/20"
                                                            >
                                                                <span>{link.label}</span>
                                                                <ExternalLink size={10} />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Commands */}
                                                {step.commands && step.commands.map((cmdBlock, i) => (
                                                    <div key={i} className="group relative rounded-lg overflow-hidden border border-black/50 bg-[#151515]">
                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => copyToClipboard(cmdBlock.cmd, 'command')}
                                                                className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-gray-300 hover:text-white transition-colors"
                                                            >
                                                                <Copy size={12} />
                                                            </button>
                                                        </div>
                                                        <pre className="p-4 font-mono text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
                                                            {cmdBlock.cmd}
                                                        </pre>
                                                    </div>
                                                ))}

                                                {/* Verification Checklist */}
                                                {step.isVerification && step.checklist && (
                                                    <div className="bg-green-500/5 rounded-lg border border-green-500/10 p-4 space-y-2">
                                                        {step.checklist.map((item, i) => (
                                                            <label key={i} className="flex items-center space-x-3 cursor-pointer group">
                                                                <input type="checkbox" className="form-checkbox h-4 w-4 text-green-500 rounded border-gray-600 bg-black/20 focus:ring-0 focus:ring-offset-0 transition-colors" />
                                                                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{item}</span>
                                                            </label>
                                                        ))}
                                                        <div className="pt-2 mt-2">
                                                            <button
                                                                onClick={() => window.open(isAws ? 'https://console.aws.amazon.com' : isAzure ? 'https://portal.azure.com' : 'https://console.cloud.google.com', '_blank')}
                                                                className="text-xs text-green-400 hover:text-green-300 underline underline-offset-2 flex items-center space-x-1"
                                                            >
                                                                <span>Open Console</span>
                                                                <ExternalLink size={10} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Next Step Button */}
                                                {index < steps.length - 1 && (
                                                    <div className="pt-2">
                                                        <button
                                                            onClick={() => setOpenStep(index + 1)}
                                                            className="text-xs font-medium text-gray-500 hover:text-white transition-colors flex items-center space-x-1"
                                                        >
                                                            <span>Continue to next step</span>
                                                            <ArrowDown size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {completedSteps.size === steps.length && (
                        <div className="bg-green-500/10 border-t border-green-500/20 px-6 py-4 flex flex-col items-center justify-center text-center space-y-3">
                            <span className="text-green-400 text-sm font-bold flex items-center justify-center space-x-2">
                                <PartyPopper size={18} />
                                <span>All Steps Completed!</span>
                            </span>
                            <button
                                onClick={onMarkDeployed}
                                disabled={isMarkingDeployed}
                                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg transition-all flex items-center space-x-2 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isMarkingDeployed ? (
                                    <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin"></div>
                                ) : (
                                    <CheckCircle2 size={14} />
                                )}
                                <span>{isMarkingDeployed ? 'Marking...' : 'Mark as Self Deployed'}</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DeploymentGuide;
