import { CITY_POSTCODE_PREFIXES } from '../data/seed';
import { notFound, respond, validationError } from '../db';
import { restaurantSummary } from './helpers';

const cityForPostcode = (postcode) =>
  Object.entries(CITY_POSTCODE_PREFIXES).find(([, prefixes]) => prefixes.some((p) => postcode.startsWith(p)))?.[0];

// Deterministic pseudo-distance between a postcode and a restaurant. Stands in
// for a real geocoding + routing provider in mock mode.
function mockDistanceKm(postcode, restaurantId) {
  let h = 0;
  for (const ch of `${postcode}${restaurantId}`) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return Math.round((0.6 + (h / 997) * 10.4) * 10) / 10;
}

export const deliveryZoneService = {
  listZones: ({ restaurantId } = {}) =>
    respond((db) =>
      db.deliveryZones
        .filter((z) => !restaurantId || z.restaurantId === restaurantId)
        .map((z) => ({ ...z, restaurant: restaurantSummary(db.restaurants.find((r) => r.id === z.restaurantId)) }))
    ),

  testAddress: ({ restaurantId, address }) =>
    respond((db) => {
      const restaurant = db.restaurants.find((r) => r.id === restaurantId);
      if (!restaurant) throw notFound(`Restaurant ${restaurantId}`);
      const text = String(address || '').trim();
      if (!text) throw validationError('Enter a delivery address.');
      const postcode = text.match(/\b(\d{5})\b/)?.[1];
      if (!postcode || text.replace(postcode, '').trim().length < 3) {
        throw validationError('The address could not be recognised. Include the street and a 5-digit postal code.', { field: 'address' });
      }
      const city = cityForPostcode(postcode);
      if (!city) {
        throw validationError(`Postal code ${postcode} is not in a supported service area.`, { field: 'address' });
      }
      const zones = db.deliveryZones.filter((z) => z.restaurantId === restaurant.id);
      const base = { restaurant: restaurantSummary(restaurant), address: text, postcode, zones };
      if (city !== restaurant.city) {
        return { ...base, covered: false, distanceKm: null, zone: null, reason: `The address is in ${city}; ${restaurant.name} only delivers within ${restaurant.city}.` };
      }
      const distanceKm = mockDistanceKm(postcode, restaurant.id);
      const zone = zones.find((z) => distanceKm >= z.minKm && distanceKm < z.maxKm);
      if (!zone) {
        const maxKm = Math.max(...zones.map((z) => z.maxKm));
        return { ...base, covered: false, distanceKm, zone: null, reason: `The address is ${distanceKm} km away, beyond the outermost zone (${maxKm} km).` };
      }
      if (!zone.active) {
        return { ...base, covered: false, distanceKm, zone, reason: `The address falls in ${zone.name}, but that zone is inactive.` };
      }
      if (restaurant.status === 'Offline') {
        return { ...base, covered: false, distanceKm, zone, reason: `${restaurant.name} is offline, so no zones are currently accepting orders.` };
      }
      return { ...base, covered: true, distanceKm, zone, reason: null };
    }),
};
