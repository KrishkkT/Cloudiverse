import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ArrowUpDown, Check, Cloud, Server, Database, HardDrive } from 'lucide-react';
import { toast } from 'react-toastify';

const CloudComparison = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [selectedProvider, setSelectedProvider] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Mock data for cloud services comparison
  const cloudServices = [
    {
      id: 1,
      category: 'Compute',
      icon: Server,
      aws: 'EC2 t3.medium',
      azure: 'Standard B2s',
      gcp: 'e2-medium',
      awsCost: 85,
      azureCost: 95,
      gcpCost: 78,
      awsPerformance: 85,
      azurePerformance: 88,
      gcpPerformance: 82
    },
    {
      id: 2,
      category: 'Database',
      icon: Database,
      aws: 'RDS PostgreSQL',
      azure: 'Azure PostgreSQL',
      gcp: 'Cloud SQL PostgreSQL',
      awsCost: 120,
      azureCost: 110,
      gcpCost: 105,
      awsPerformance: 90,
      azurePerformance: 87,
      gcpPerformance: 92
    },
    {
      id: 3,
      category: 'Storage',
      icon: HardDrive,
      aws: 'S3 Standard',
      azure: 'Blob Storage',
      gcp: 'Cloud Storage',
      awsCost: 45,
      azureCost: 40,
      gcpCost: 38,
      awsPerformance: 88,
      azurePerformance: 85,
      gcpPerformance: 90
    },
    {
      id: 4,
      category: 'Networking',
      icon: Cloud,
      aws: 'VPC + ELB',
      azure: 'Virtual Network',
      gcp: 'VPC Network',
      awsCost: 30,
      azureCost: 25,
      gcpCost: 28,
      awsPerformance: 82,
      azurePerformance: 80,
      gcpPerformance: 85
    }
  ];

  // Data for the cost chart
  const costChartData = cloudServices.map(service => ({
    name: service.category,
    AWS: service.awsCost,
    Azure: service.azureCost,
    GCP: service.gcpCost
  }));

  // Data for the performance chart
  const performanceChartData = cloudServices.map(service => ({
    name: service.category,
    AWS: service.awsPerformance,
    Azure: service.azurePerformance,
    GCP: service.gcpPerformance
  }));

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedServices = [...cloudServices].sort((a, b) => {
    if (!sortConfig.key) return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSelectProvider = (provider) => {
    setSelectedProvider(provider);
    toast.success(`Selected ${provider} as your cloud provider`);
  };

  const handleViewTerraform = () => {
    if (selectedProvider) {
      navigate(`/terraform/${projectId}`);
    } else {
      toast.warn('Please select a provider first');
    }
  };

  const getTotalCost = (provider) => {
    return cloudServices.reduce((total, service) => total + service[`${provider.toLowerCase()}Cost`], 0);
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold whitespace-nowrap">Cloud Comparison</h1>
          <p className="text-text-secondary mt-1 whitespace-nowrap">Compare services across cloud providers</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleViewTerraform}
            disabled={!selectedProvider}
            className={`btn flex items-center space-x-2 ${selectedProvider
                ? 'btn-primary'
                : 'btn-secondary opacity-50 cursor-not-allowed'
              }`}
          >
            <Check size={18} />
            <span>Continue with {selectedProvider || 'Provider'}</span>
          </button>
        </div>
      </div>

      {/* Provider Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: 'Amazon Web Services', id: 'aws', color: 'bg-orange-500/20 text-orange-500', total: getTotalCost('aws') },
          { name: 'Microsoft Azure', id: 'azure', color: 'bg-blue-500/20 text-blue-500', total: getTotalCost('azure') },
          { name: 'Google Cloud Platform', id: 'gcp', color: 'bg-green-500/20 text-green-500', total: getTotalCost('gcp') }
        ].map((provider) => (
          <div
            key={provider.id}
            onClick={() => handleSelectProvider(provider.name)}
            className={`card p-6 cursor-pointer transition-all ${selectedProvider === provider.name
                ? 'ring-2 ring-primary border-primary/30 scale-[1.02]'
                : 'hover:scale-[1.02]'
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">{provider.name}</h3>
                <p className="text-2xl font-bold mt-2">${provider.total}/mo</p>
                <p className="text-sm text-text-secondary mt-1">Estimated total cost</p>
              </div>
              <div className={`p-3 rounded-lg ${provider.color}`}>
                <Cloud size={24} />
              </div>
            </div>
            {selectedProvider === provider.name && (
              <div className="mt-4 pt-4 border-t border-border flex items-center text-secondary">
                <Check size={18} className="mr-2" />
                <span>Selected</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold">Cost Comparison</h2>
          </div>
          <div className="card-body h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={costChartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16181D',
                    borderColor: '#1F2937',
                    borderRadius: '0.5rem'
                  }}
                />
                <Legend />
                <Bar dataKey="AWS" fill="#3B82F6" />
                <Bar dataKey="Azure" fill="#2563EB" />
                <Bar dataKey="GCP" fill="#22C55E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold">Performance Comparison</h2>
          </div>
          <div className="card-body h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={performanceChartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16181D',
                    borderColor: '#1F2937',
                    borderRadius: '0.5rem'
                  }}
                />
                <Legend />
                <Bar dataKey="AWS" fill="#3B82F6" />
                <Bar dataKey="Azure" fill="#2563EB" />
                <Bar dataKey="GCP" fill="#22C55E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold">Detailed Service Comparison</h2>
        </div>
        <div className="card-body p-0">
          <div className="table-container">
            <table className="table">
              <thead className="table-head">
                <tr>
                  <th className="table-head-cell">Category</th>
                  <th className="table-head-cell">AWS</th>
                  <th className="table-head-cell">Azure</th>
                  <th className="table-head-cell">GCP</th>
                  <th className="table-head-cell">Cost (USD/mo)</th>
                  <th className="table-head-cell">Performance</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {sortedServices.map((service) => {
                  const Icon = service.icon;
                  return (
                    <tr key={service.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <Icon size={20} className="mr-2 text-primary" />
                          <span className="font-medium">{service.category}</span>
                        </div>
                      </td>
                      <td className="table-cell">{service.aws}</td>
                      <td className="table-cell">{service.azure}</td>
                      <td className="table-cell">{service.gcp}</td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          <span className="mr-2">${service.awsCost}</span>
                          <span className="text-text-secondary text-sm">|</span>
                          <span className="mx-2 text-text-secondary">${service.azureCost}</span>
                          <span className="text-text-secondary text-sm">|</span>
                          <span className="ml-2">${service.gcpCost}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          <span className="mr-2">{service.awsPerformance}%</span>
                          <span className="text-text-secondary text-sm">|</span>
                          <span className="mx-2 text-text-secondary">{service.azurePerformance}%</span>
                          <span className="text-text-secondary text-sm">|</span>
                          <span className="ml-2">{service.gcpPerformance}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Dock */}
      <AIDock />
    </div>
  );
};

export default CloudComparison;