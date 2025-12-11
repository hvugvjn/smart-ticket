/**
 * currency.ts
 * INR currency formatting utilities
 */

export function formatINR(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

export function formatINRCompact(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (numAmount >= 100000) {
    return `₹${(numAmount / 100000).toFixed(1)}L`;
  } else if (numAmount >= 1000) {
    return `₹${(numAmount / 1000).toFixed(1)}K`;
  }
  return formatINR(numAmount);
}
