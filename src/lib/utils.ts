import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined, options?: { compact?: boolean; decimals?: number }): string {
  if (value === null || value === undefined || isNaN(value)) return '$0.00';
  const { compact = false, decimals } = options ?? {};
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: decimals ?? (compact ? 2 : 2),
    minimumFractionDigits: decimals ?? (compact ? 0 : 2),
  });
  return formatter.format(value);
}

export function formatNumber(value: number | null | undefined, compact = false): string {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 2 : 6,
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '0.00%';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatAddress(address: string, chars = 6): string {
  if (!address) return '';
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatAuthErrorMessage(message: string): string {
  const normalized = message?.toLowerCase() ?? '';

  if (normalized.includes('email') && normalized.includes('limit')) {
    return 'The email service has reached its send limit. Please try again later or configure SMTP settings in your Supabase project.';
  }

  if (normalized.includes('already registered') || normalized.includes('duplicate')) {
    return 'This email is already registered. Please sign in or reset your password.';
  }

  return message;
}
