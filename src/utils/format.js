import { STALE_AFTER_MINUTES } from '../config/env';

const numberFmt = new Intl.NumberFormat('en-US');
const currencyFmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

export const formatNumber = (n) => (n === null || n === undefined ? '—' : numberFmt.format(n));
export const formatCurrency = (n) => (n === null || n === undefined ? '—' : currencyFmt.format(n));
export const formatPercent = (n, digits = 0) => (n === null || n === undefined ? '—' : `${Number(n).toFixed(digits)}%`);
export const formatMinutes = (n) => (n === null || n === undefined ? '—' : `${n} min`);

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function minutesSince(iso) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

export function formatRelative(iso) {
  if (!iso) return '—';
  const m = minutesSince(iso);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  return `${d} d ago`;
}

export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export const isStale = (iso, thresholdMinutes = STALE_AFTER_MINUTES) => Boolean(iso) && minutesSince(iso) > thresholdMinutes;

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

export function percentChange(current, previous) {
  if (!previous || current === null || current === undefined) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Date plus time with seconds, for event logs. */
export function formatTimestamp(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, ${formatTime(iso)}`;
}
