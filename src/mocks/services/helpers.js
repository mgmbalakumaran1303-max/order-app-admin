import { regionOfCity, timeRangeHours } from '../../utils/constants';

export const includesText = (haystack, needle) =>
  !needle || haystack.some((value) => String(value ?? '').toLowerCase().includes(needle.trim().toLowerCase()));

export function matchesLocation(restaurant, { region, city } = {}) {
  if (region && region !== 'all' && regionOfCity(restaurant.city) !== region) return false;
  if (city && city !== 'all' && restaurant.city !== city) return false;
  return true;
}

export function withinRange(iso, timeRange) {
  if (!timeRange) return true;
  return Date.now() - new Date(iso).getTime() <= timeRangeHours(timeRange) * 3600000;
}

export const restaurantSummary = (r) => (r ? { id: r.id, name: r.name, city: r.city, status: r.status } : null);
