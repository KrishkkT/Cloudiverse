import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Building, Save, Trash2, Loader } from 'lucide-react';

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: ''
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        company: user.company || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile(formData);
      if (result.success) {
        alert('Profile updated successfully!');
      } else {
        alert(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        logout();
        navigate('/');
        alert('Account deleted successfully');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-primary mx-auto mb-4" size={32} />
          <p className="text-text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Profile Settings</h1>
            <p className="text-text-secondary">Manage your account information</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center mb-6">
            <div className="bg-primary/10 p-3 rounded-full mr-4">
              <User className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{user.name || 'User'}</h2>
              <p className="text-text-secondary">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-slate-200"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-text-subtle" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-text-primary mb-2">
                  Company
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-text-subtle" />
                  </div>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full pl-10 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex items-center px-6 py-2.5"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={16} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-500 mb-2">Danger Zone</h3>
          <p className="text-text-secondary mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="btn btn-danger flex items-center px-4 py-2.5"
          >
            {deleting ? (
              <>
                <Loader className="animate-spin mr-2" size={16} />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2" size={16} />
                Delete Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;