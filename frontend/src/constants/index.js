export const APP_NAME = 'CloudPlanner AI';
export const APP_DESCRIPTION = 'Multi-Cloud AI Infrastructure Planner';

export const CLOUD_PROVIDERS = [
  { id: 'aws', name: 'Amazon Web Services', shortName: 'AWS' },
  { id: 'azure', name: 'Microsoft Azure', shortName: 'Azure' },
  { id: 'gcp', name: 'Google Cloud Platform', shortName: 'GCP' }
];

export const PROJECT_STATUSES = [
  { id: 'draft', name: 'Draft' },
  { id: 'parsed', name: 'Parsed' },
  { id: 'comparing', name: 'Comparing' },
  { id: 'generated', name: 'Generated' },
  { id: 'deployed', name: 'Deployed' }
];

export const SERVICE_CATEGORIES = [
  { id: 'compute', name: 'Compute' },
  { id: 'database', name: 'Database' },
  { id: 'storage', name: 'Storage' },
  { id: 'network', name: 'Networking' },
  { id: 'security', name: 'Security' },
  { id: 'observability', name: 'Observability' },
  { id: 'iot', name: 'IoT' },
  { id: 'ml', name: 'Machine Learning' },
  { id: 'analytics', name: 'Analytics' },
  { id: 'integration', name: 'Integration' },
  { id: 'devops', name: 'DevOps' },
  { id: 'messaging', name: 'Messaging' }
];


export const COLORS = {
  primary: '#3B82F6',
  secondary: '#2A2A3C',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#6366F1',
  dark: '#1E1E2F',
  light: '#F8FAFC'
};

export const CHART_COLORS = [
  '#3B82F6', // sky-blue
  '#22C55E', // emerald-green
  '#8B5CF6', // purple
  '#F59E0B', // amber
  '#EF4444'  // red
];

export const DEFAULT_NOTIFICATION_SETTINGS = {
  email: true,
  newsletter: false,
  security: true
};

export const DEFAULT_THEME = 'dark';
export const DEFAULT_LANGUAGE = 'en';