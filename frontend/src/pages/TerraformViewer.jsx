import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, Download, Code, Eye, FileText } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'react-toastify';
import axios from 'axios';

const TerraformViewer = () => {
  const { projectId } = useParams();
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('code'); // code, preview
  const [terraformCode, setTerraformCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [planStatus, setPlanStatus] = useState(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const { data } = await axios.get('http://localhost:5000/api/billing/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPlanStatus(data);
      } catch (e) {
        console.error("Failed to fetch plan status", e);
      }
    };
    fetchPlan();
  }, []);

  useEffect(() => {
    const fetchTerraformCode = async () => {
      try {
        // Get the workspace/project data from backend
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/workspaces/${projectId}/terraform`);

        if (response.data.success) {
          // Get the main.tf content
          const terraformProject = response.data.terraform;

          // Extract main.tf content from the project structure
          if (terraformProject && typeof terraformProject === 'object') {
            // If it's modular structure
            if (terraformProject['main.tf']) {
              setTerraformCode(terraformProject['main.tf']);
            } else {
              // Look for main.tf in nested structure
              let mainTfContent = '';
              const findMainTf = (obj) => {
                for (const [key, value] of Object.entries(obj)) {
                  if (key === 'main.tf' && typeof value === 'string') {
                    return value;
                  } else if (typeof value === 'object') {
                    const result = findMainTf(value);
                    if (result) return result;
                  }
                }
                return null;
              };

              const foundContent = findMainTf(terraformProject);
              if (foundContent) {
                setTerraformCode(foundContent);
              } else {
                // If no main.tf found, try to construct from available resources
                setTerraformCode('# Terraform code not available');
              }
            }
          } else {
            setTerraformCode(response.data.terraform || '# Terraform code not available');
          }
        } else {
          setTerraformCode('# Error: Could not fetch Terraform code');
          setError(response.data.message || 'Failed to fetch Terraform code');
        }
      } catch (err) {
        console.error('Error fetching Terraform code:', err);
        setTerraformCode('# Error: Could not fetch Terraform code');
        setError(err.message || 'Failed to fetch Terraform code');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchTerraformCode();
    } else {
      setTerraformCode('# No project ID provided');
      setLoading(false);
    }
  }, [projectId]);

  const handleCopy = () => {
    if (terraformCode) {
      navigator.clipboard.writeText(terraformCode);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (terraformCode) {
      const element = document.createElement("a");
      const file = new Blob([terraformCode], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = "main.tf";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.info('Downloading Terraform file...');
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Terraform Code</h1>
          <p className="text-text-secondary mt-1">Generated infrastructure as code</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode('code')}
            className={`btn flex items-center space-x-2 ${viewMode === 'code' ? 'btn-primary' : 'btn-secondary'
              }`}
          >
            <Code size={18} />
            <span>Code</span>
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`btn flex items-center space-x-2 ${viewMode === 'preview' ? 'btn-primary' : 'btn-secondary'
              }`}
          >
            <Eye size={18} />
            <span>Preview</span>
          </button>
          <button
            onClick={() => {
              if (planStatus?.plan !== 'pro') {
                toast.error("Upgrade to Pro to copy code");
                return;
              }
              handleCopy();
            }}
            className="btn btn-secondary flex items-center space-x-2"
            disabled={!terraformCode || loading || planStatus?.plan !== 'pro'}
          >
            <Copy size={18} />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={() => {
              if (planStatus?.plan !== 'pro') {
                toast.error("Upgrade to Pro to download");
                return;
              }
              handleDownload();
            }}
            className="btn btn-primary flex items-center space-x-2"
            disabled={!terraformCode || loading || planStatus?.plan !== 'pro'}
          >
            <Download size={18} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-lg text-text-secondary">Loading Terraform code...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-white mb-2">Error Loading Terraform</h3>
            <p className="text-text-secondary mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* File Tree */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-bold flex items-center">
                    <FileText size={20} className="mr-2" />
                    File Structure
                  </h2>
                </div>
                <div className="card-body p-0">
                  <div className="border-b border-border">
                    <div className="p-4 font-medium">terraform/
                      <div className="ml-4 mt-2 space-y-2">
                        <div className="flex items-center p-2 rounded hover:bg-surface cursor-pointer text-primary">
                          <FileText size={16} className="mr-2" />
                          main.tf
                        </div>
                        <div className="flex items-center p-2 rounded hover:bg-surface cursor-pointer">
                          <FileText size={16} className="mr-2" />
                          variables.tf
                        </div>
                        <div className="flex items-center p-2 rounded hover:bg-surface cursor-pointer">
                          <FileText size={16} className="mr-2" />
                          outputs.tf
                        </div>
                        <div className="flex items-center p-2 rounded hover:bg-surface cursor-pointer">
                          <FileText size={16} className="mr-2" />
                          providers.tf
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <button className="btn btn-secondary w-full">
                      Download ZIP
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Code Viewer */}
            <div className="lg:col-span-3">
              <div className="card relative overflow-hidden">
                <div className="card-header flex justify-between items-center">
                  <h2 className="text-xl font-bold">main.tf</h2>
                  {(!planStatus || planStatus.plan !== 'pro') && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold">PRO FEATURE</span>
                  )}
                </div>
                <div className="card-body p-0 relative min-h-[400px]">

                  {/* GATING OVERLAY */}
                  {(!planStatus || planStatus.plan !== 'pro') && (
                    <div className="absolute inset-0 z-10 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
                      <div className="bg-card border border-border p-8 rounded-xl shadow-2xl max-w-md">
                        <h3 className="text-2xl font-bold mb-4">Unlock Terraform Export</h3>
                        <p className="text-gray-400 mb-6">
                          Exporting production-ready Terraform code is available exclusively on the <span className="text-primary font-bold">Pro Plan</span>.
                        </p>
                        <button
                          onClick={() => window.location.href = '/settings?tab=billing'}
                          className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold transition-all transform hover:scale-105"
                        >
                          Upgrade to Pro
                        </button>
                      </div>
                    </div>
                  )}

                  <SyntaxHighlighter
                    language="hcl"
                    style={oneDark}
                    customStyle={{
                      backgroundColor: '#1E1E2E',
                      borderRadius: '0 0 0.75rem 0.75rem',
                      margin: 0,
                      padding: '1.5rem',
                      filter: (!planStatus || planStatus.plan !== 'pro') ? 'blur(4px)' : 'none',
                      userSelect: (!planStatus || planStatus.plan !== 'pro') ? 'none' : 'text'
                    }}
                    showLineNumbers
                  >
                    {terraformCode || '# Content hidden'}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>
          </div>

          {/* Deployment Instructions */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-bold">Deployment Instructions</h2>
            </div>
            <div className="card-body">
              <div className="prose prose-invert max-w-none">
                <h3>Prerequisites</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Install Terraform CLI (version 1.0+)</li>
                  <li>Configure AWS CLI with appropriate credentials</li>
                  <li>Ensure sufficient permissions for resource creation</li>
                </ul>

                <h3 className="mt-6">Deployment Steps</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Download the Terraform files using the Download button above</li>
                  <li>Navigate to the downloaded directory in your terminal</li>
                  <li>Initialize Terraform:
                    <pre className="bg-code-block p-4 rounded mt-2">terraform init</pre>
                  </li>
                  <li>Review the execution plan:
                    <pre className="bg-code-block p-4 rounded mt-2">terraform plan</pre>
                  </li>
                  <li>Apply the configuration:
                    <pre className="bg-code-block p-4 rounded mt-2">terraform apply</pre>
                  </li>
                </ol>

                <div className="alert alert-info mt-6">
                  <p><strong>Note:</strong> The generated Terraform code is ready for deployment but should be reviewed for security and compliance requirements before production use.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}


    </div>
  );
};

export default TerraformViewer;