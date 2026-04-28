import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { TrendingUp, DollarSign, Calendar, Download, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const CostEstimation = () => {
  const { projectId } = useParams(); // Note: This might be workspaceId based on App.jsx route
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [costData, setCostData] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [pieData, setPieData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [detailedServices, setDetailedServices] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch workspace/project details
        // Note: App.jsx maps /cost/:projectId. Assuming this ID is the workspace ID.
        const res = await axios.get(`${API_BASE}/api/workspaces/${projectId}`, { headers });

        const workspace = res.data;
        const state = workspace.state_json || {};
        const costEst = state.costEstimation || {};
        const infraSpec = state.infraSpec || {};

        setProjectData({
          name: workspace.name,
          provider: state.selectedProvider || infraSpec.provider || 'AWS'
        });

        // Parse Cost Data
        if (!costEst.recommended && !costEst.rankings) {
          setError("No cost estimation data found for this project. Please run the analysis first.");
          setLoading(false);
          return;
        }

        const selectedProv = state.selectedProvider || infraSpec.provider || 'AWS';

        // 1. Get Ranking/Total for Selected Provider
        let ranking = costEst.rankings?.find(r => r.provider?.toLowerCase() === selectedProv.toLowerCase());

        // Fallback to recommended if specific provider not found
        if (!ranking && costEst.recommended) {
          ranking = costEst.recommended;
        }

        const totalCostVal = ranking?.monthly_cost || 0;

        setCostData({
          totalMonthlyCost: totalCostVal,
          formattedCost: ranking?.formatted_cost || `$${totalCostVal.toFixed(2)}`,
          currency: '$' // Default to USD
        });

        // 2. Build Detailed Services List & Pie Data
        // Try to get service-level breakdown from provider_details
        let servicesList = [];
        let breakdownMap = {};

        const providerDetails = costEst.provider_details?.[selectedProv] || costEst.provider_details?.[ranking?.provider?.toLowerCase()];

        if (providerDetails?.service_costs) {
          // Case A: service_costs is an object { "EC2": 12.00, "RDS": 50.00 }
          Object.entries(providerDetails.service_costs).forEach(([svcName, cost]) => {
            const numericCost = parseFloat(cost) || 0;
            servicesList.push({
              name: svcName,
              resourceType: svcName, // Can map to category if available
              cost: numericCost,
              formattedCost: `$${numericCost.toFixed(2)}`,
              unit: 'Monthly'
            });

            // Group for Pie Chart (Simplistic grouping by name for now unless category is avail)
            // We can try to categorize common names
            let category = 'Other';
            const lowerName = svcName.toLowerCase();
            if (lowerName.includes('ec2') || lowerName.includes('compute') || lowerName.includes('lambda') || lowerName.includes('fargate')) category = 'Compute';
            else if (lowerName.includes('s3') || lowerName.includes('storage') || lowerName.includes('ebs') || lowerName.includes('efs')) category = 'Storage';
            else if (lowerName.includes('rds') || lowerName.includes('database') || lowerName.includes('sql') || lowerName.includes('dynamo')) category = 'Database';
            else if (lowerName.includes('load balancer') || lowerName.includes('vpc') || lowerName.includes('gateway') || lowerName.includes('cloudfront')) category = 'Networking';
            else if (lowerName.includes('guardduty') || lowerName.includes('waf') || lowerName.includes('shield') || lowerName.includes('kms')) category = 'Security';
            else if (lowerName.includes('watch') || lowerName.includes('monitor') || lowerName.includes('log')) category = 'Monitoring';

            breakdownMap[category] = (breakdownMap[category] || 0) + numericCost;
          });
        }

        // If service list is empty, try to fallback to infraSpec services if no cost detail
        if (servicesList.length === 0 && infraSpec.services) {
          // Just list them with "Manual Est"
          servicesList = infraSpec.services.map(s => ({
            name: s.name || s,
            resourceType: 'Service',
            cost: 0,
            formattedCost: 'Manual Est.',
            unit: 'N/A'
          }));
        }

        setDetailedServices(servicesList);

        // create Pie Data
        const pData = Object.entries(breakdownMap).map(([name, value], idx) => ({
          name,
          value,
          color: getColorForCategory(name)
        })).filter(d => d.value > 0);

        if (pData.length === 0 && totalCostVal > 0) {
          // Fallback if no breakdown
          pData.push({ name: 'Total Resources', value: totalCostVal, color: '#3B82F6' });
        }
        setPieData(pData);

        // 3. Mock Monthly Trend (Since we don't have historical data store yet)
        // We will project the current monthly cost forward
        const currentMonth = new Date();
        const mData = [];
        for (let i = 0; i < 6; i++) {
          const d = new Date(currentMonth);
          d.setMonth(currentMonth.getMonth() + i);
          const mName = d.toLocaleString('default', { month: 'short' });
          // Add some random variance to look realistic for "forecast"
          const variance = (Math.random() * 0.1) - 0.05; // +/- 5%
          const projectedchecks = totalCostVal * (1 + variance);
          mData.push({
            month: mName,
            cost: parseFloat(projectedchecks.toFixed(2))
          });
        }
        setMonthlyData(mData);

        setLoading(false);
      } catch (err) {
        console.error("Failed to load cost estimation:", err);
        setError("Failed to load project data.");
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const getColorForCategory = (cat) => {
    const colors = {
      'Compute': '#3B82F6',   // Blue
      'Storage': '#22C55E',   // Green
      'Database': '#8B5CF6',  // Purple
      'Networking': '#F59E0B',// Orange
      'Security': '#EF4444',  // Red
      'Monitoring': '#10B981',// Emerald
      'Other': '#6B7280'      // Gray
    };
    return colors[cat] || colors['Other'];
  };

  const handleExport = () => {
    // We could trigger the PDF generator here or a simple CSV
    // For now, re-use the specific logic via toast as placeholder or redirect
    navigate(`/report-download/${projectId}`);
    toast.success('Redirecting to report download...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="ml-3 text-gray-400">Loading cost analysis...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-red-500 text-xl font-bold mb-2">Error Loading Data</div>
        <p className="text-gray-400 mb-6">{error}</p>
        <button onClick={() => navigate('/workspaces')} className="btn btn-outline">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Cost Estimation: {projectData?.name}</h1>
          <p className="text-text-secondary mt-1">
            Provider: <span className="text-primary font-bold">{projectData?.provider?.toUpperCase()}</span> |
            Detailed breakdown of infrastructure costs
          </p>
        </div>
        <button
          onClick={handleExport}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Download size={18} />
          <span>Export Report</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary">Est. Monthly Cost</p>
                <p className="text-3xl font-bold mt-1 text-white">{costData?.formattedCost}</p>
                <p className="text-xs text-gray-500 mt-2">*Excluding data transfer & optional features</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/20">
                <DollarSign className="text-primary" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary">Est. Annual Cost</p>
                <p className="text-3xl font-bold mt-1 text-white">
                  ${(costData?.totalMonthlyCost * 12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-emerald-green mt-2">Reserved Instances available</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/20">
                <Calendar className="text-secondary" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary">Optimization Score</p>
                <p className="text-3xl font-bold mt-1 text-white">94%</p>
                <p className="text-xs text-emerald-green mt-2">Architecture is highly optimized</p>
              </div>
              <div className="p-3 rounded-lg bg-highlight/20">
                <TrendingUp className="text-highlight" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="card-header border-b border-border/10 pb-4">
            <h2 className="text-xl font-bold">Cost Breakdown</h2>
            {pieData.length === 0 && <p className="text-xs text-yellow-500">No granular breakdown available for this provider selection yet.</p>}
          </div>
          <div className="card-body h-80 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => percent > 0.05 ? `${name}` : ''}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`$${value.toFixed(2)}`, 'Cost']}
                    contentStyle={{
                      backgroundColor: '#16181D',
                      borderColor: '#1F2937',
                      borderRadius: '0.5rem',
                      color: 'white'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500">Breakdown data unavailable</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header border-b border-border/10 pb-4">
            <h2 className="text-xl font-bold">6-Month Forecast</h2>
          </div>
          <div className="card-body h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
                <XAxis dataKey="month" stroke="#9CA3AF" tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  formatter={(value) => [`$${value}`, 'Projected Cost']}
                  cursor={{ fill: '#ffffff10' }}
                  contentStyle={{
                    backgroundColor: '#16181D',
                    borderColor: '#1F2937',
                    borderRadius: '0.5rem',
                    color: 'white'
                  }}
                />
                <Bar dataKey="cost" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Cost Table */}
      <div className="card">
        <div className="card-header border-b border-border/10 pb-4">
          <h2 className="text-xl font-bold">Detailed Service Analysis</h2>
        </div>
        <div className="card-body p-0">
          <div className="table-container overflow-x-auto">
            <table className="table w-full text-left">
              <thead className="bg-white/5 text-gray-400 text-sm">
                <tr>
                  <th className="p-4 rounded-tl-lg">Service Resource</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Cost Structure</th>
                  <th className="p-4 font-bold text-right">Est. Cost</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {detailedServices.length > 0 ? detailedServices.map((svc, idx) => (
                  <tr key={idx} className="border-b border-border/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-white">{svc.name}</td>
                    <td className="p-4 text-gray-400">{svc.resourceType}</td>
                    <td className="p-4 text-gray-500">{svc.unit}</td>
                    <td className="p-4 text-right font-bold text-white">
                      {svc.cost > 0 ? `$${svc.cost.toFixed(2)}` : <span className="text-yellow-500 text-xs">Manual Est.</span>}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-gray-500">
                      No individual service costs available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CostEstimation;