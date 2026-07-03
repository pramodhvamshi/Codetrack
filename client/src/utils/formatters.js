export const formatPercentage = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '0%';
  }
  const num = Number(value);
  if (Number.isInteger(num)) {
    return `${num}%`;
  }
  return `${num.toFixed(1).replace(/\.0$/, '')}%`;
};

export const formatDisplayDate = (dateString) => {
  if (!dateString) return '—';
  
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';

  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};
