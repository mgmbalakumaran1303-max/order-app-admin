// Tiny pub/sub so independent views (e.g. the sidebar issue badge) can refresh
// after a mutation elsewhere without a global store.

const listeners = new Map();

export function subscribe(topic, fn) {
  if (!listeners.has(topic)) listeners.set(topic, new Set());
  listeners.get(topic).add(fn);
  return () => listeners.get(topic).delete(fn);
}

export function publish(topic) {
  listeners.get(topic)?.forEach((fn) => fn());
}

export const TOPICS = {
  ISSUES: 'issues',
  INCIDENTS: 'incidents',
};
