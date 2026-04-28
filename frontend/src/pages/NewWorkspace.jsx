import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';

const NewWorkspace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const creatingRef = React.useRef(false);

  useEffect(() => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    createWorkspaceAndRedirect();
  }, []);

  const createWorkspaceAndRedirect = async () => {
    try {
      const token = localStorage.getItem('token');

      const requestData = {
        name: 'New Project',
        description: '',
        project_data: {
          appDescription: '',
          projectName: 'New Project'
        }
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const workspace = await response.json();
        // Navigate to the newly created workspace
        navigate(`/workspaces/${workspace.id}`, { replace: true });
      } else {
        const errorData = await response.json();
        // Check for specific device limit flag
        if (errorData.deviceLimitReached) {
          setError('DEVICE_LIMIT_REACHED');
          setLoading(false);
          return;
        }
        setError(errorData.msg || errorData.message || 'Failed to create workspace');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error creating workspace:', err);
      setError('Failed to create workspace. Please try again.');
      setLoading(false);
    }
  };

  if (error) {
    if (error === 'DEVICE_LIMIT_REACHED') {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="bg-red-500/10 border border-red-500 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl shadow-red-500/20">
            <div className="bg-red-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-icons text-5xl text-red-500">block</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-wider">Access Denied</h2>
            <p className="text-red-200 text-lg mb-8 leading-relaxed">
              Security Limit Reached: Maximum 2 accounts allowed per device.<br />
              You cannot create new projects from this device.
            </p>
            <button
              onClick={() => navigate('/workspaces')}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-surface border border-border rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="text-red-500 mb-4 flex justify-center">
            <span className="material-icons text-5xl">lock</span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Limit Reached</h2>
          <p className="text-text-secondary mb-8">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/settings')}
              className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold rounded-xl transition-all shadow-lg transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <span className="material-icons text-lg">star</span> Upgrade Plan
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/workspaces')}
                className="flex-1 px-4 py-2 bg-surface hover:bg-white/5 border border-border rounded-xl text-text-secondary transition-colors"
                title="Back to Dashboard"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  createWorkspaceAndRedirect();
                }}
                className="flex-1 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-xl transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center">
        <Loader className="animate-spin text-primary mx-auto mb-4" size={48} />
        <h2 className="text-xl font-semibold text-text-primary mb-2">Creating Workspace...</h2>
        <p className="text-text-secondary">Setting up your new project</p>
      </div>
    </div>
  );
};

export default NewWorkspace;