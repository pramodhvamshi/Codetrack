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
