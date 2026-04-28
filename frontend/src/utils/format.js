export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncate = (str, length = 50) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

export const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'text-emerald-green';
    case 'pending':
      return 'text-amber-400';
    case 'completed':
      return 'text-sky-blue';
    case 'cancelled':
      return 'text-red-500';
    default:
      return 'text-off-white/70';
  }
};

export const getStatusBadge = (status) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'badge-success';
    case 'pending':
      return 'badge-warning';
    case 'completed':
      return 'badge-primary';
    case 'cancelled':
      return 'badge-danger';
    default:
      return 'badge-secondary';
  }
};