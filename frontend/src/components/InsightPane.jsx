import React from 'react';
import { Lightbulb, AlertTriangle, Info } from 'lucide-react';

const DesignReasoning = ({ activeStep }) => {
  // Mock design reasoning data based on active step
  const getReasoning = () => {
    switch (activeStep) {
      case 'problem-definition':
        return [
          {
            type: 'info',
            title: 'Traffic assumptions inferred automatically',
            content: 'System detected expected scale patterns from your brief.'
          },
          {
            type: 'recommendation',
            title: 'Secure-by-default architecture enforced',
            content: 'All generated designs include baseline security measures.'
          }
        ];
      case 'infraspec':
        return [
          {
            type: 'info',
            title: 'Two design variants will be generated',
            content: 'Cost-efficient and performance-optimized options will be created.'
          },
          {
            type: 'recommendation',
            title: 'Provider-neutral decisions until comparison',
            content: 'Technology choices remain portable across cloud providers.'
          }
        ];
      case 'variants':
        return [
          {
            type: 'info',
            title: 'Variant generation in progress',
            content: 'Creating two distinct architectural approaches based on your requirements.'
          },
          {
            type: 'recommendation',
            title: 'Trade-off analysis prepared',
            content: 'Detailed cost vs performance evaluation ready for review.'
          }
        ];
      case 'comparison':
        return [
          {
            type: 'info',
            title: 'Multi-cloud analysis complete',
            content: 'Provider-specific optimizations calculated for both variants.'
          },
          {
            type: 'recommendation',
            title: 'Decision matrix generated',
            content: 'Clear guidance on optimal provider for your workload.'
          }
        ];
      case 'diagrams':
        return [
          {
            type: 'info',
            title: 'Architecture visualization rendered',
            content: 'Interactive diagram reflects all design decisions made.'
          },
          {
            type: 'recommendation',
            title: 'Export-ready for presentations',
            content: 'Professional diagrams suitable for stakeholder review.'
          }
        ];
      case 'terraform':
        return [
          {
            type: 'info',
            title: 'Deterministic code generation',
            content: 'Terraform reflects exact InfraSpec with no ambiguity.'
          },
          {
            type: 'recommendation',
            title: 'Production-ready validation passed',
            content: 'Code meets industry best practices and security standards.'
          }
        ];
      default:
        return [
          {
            type: 'info',
            title: 'Design reasoning in progress',
            content: 'System continuously analyzing architectural decisions.'
          }
        ];
    }
  };

  const reasoning = getReasoning();

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={20} className="text-warning" />;
      case 'recommendation':
        return <Lightbulb size={20} className="text-primary" />;
      default:
        return <Info size={20} className="text-secondary" />;
    }
  };

  const getIconBgColor = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-warning/20';
      case 'recommendation':
        return 'bg-primary/20';
      default:
        return 'bg-secondary/20';
    }
  };

  return (
    <div className="w-80 bg-surface border-l border-border flex flex-col max-xl:hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary flex items-center">
            <div className="p-1.5 rounded-md bg-primary/20 mr-2">
              <Lightbulb size={20} className="text-primary" />
            </div>
            Design Reasoning
          </h2>
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
        </div>
        <p className="text-xs text-text-subtle mt-1">Continuous architectural analysis</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {reasoning.length > 0 ? (
          reasoning.map((item, index) => (
            <div 
              key={index}
              className="bg-elevated rounded-lg p-4 border border-border shadow-sm hover:shadow-md transition-shadow duration-200 animate-pulse-slow"
            >
              <div className="flex items-start">
                <div className={`p-2 rounded-lg ${getIconBgColor(item.type)}`}>
                  {getIcon(item.type)}
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-text-primary">{item.title}</h3>
                  <p className="text-text-secondary text-sm mt-1">{item.content}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Info size={32} className="text-text-subtle mx-auto mb-3" />
            <p className="text-text-secondary">
              No design reasoning available for this step
            </p>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-border text-center">
        <p className="text-xs text-text-subtle italic">
          Continuous architectural analysis
        </p>
      </div>
    </div>
  );
};

export default DesignReasoning;