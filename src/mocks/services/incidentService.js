import { INCIDENT_TRANSITIONS, PERMISSIONS, SEVERITIES } from '../../utils/constants';
import { getDb, notFound, nowIso, respond, userName, validationError, writeAudit } from '../db';
import { assertPermission, currentMockUser } from './authService';
import { includesText, restaurantSummary } from './helpers';

function findIncident(db, id) {
  const inc = db.incidents.find((i) => i.id.toLowerCase() === String(id).toLowerCase());
  if (!inc) throw notFound(`Incident ${id}`);
  return inc;
}

const enrich = (db, inc) => ({
  ...inc,
  ownerName: inc.ownerId ? userName(inc.ownerId) : null,
  restaurants: inc.restaurantIds.map((id) => restaurantSummary(db.restaurants.find((r) => r.id === id))),
  allowedTransitions: INCIDENT_TRANSITIONS[inc.status] ?? [],
});

function log(inc, text) {
  inc.updatedAt = nowIso();
  inc.history.push({ at: inc.updatedAt, text, actor: currentMockUser().name });
}

export const incidentService = {
  listIncidents: ({ status, severity, search } = {}) =>
    respond((db) =>
      db.incidents
        .filter((i) => (!status || status === 'all' || (status === 'active' ? i.status !== 'Resolved' : i.status === status))
          && (!severity || severity === 'all' || i.severity === severity)
          && includesText([i.id, i.title, ...i.affectedServices], search))
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .map((i) => enrich(db, i))
    ),

  getIncident: (id) =>
    respond((db) => {
      const inc = findIncident(db, id);
      return {
        ...enrich(db, inc),
        relatedIssues: inc.relatedIssueIds.map((iid) => db.issues.find((x) => x.id === iid)).filter(Boolean)
          .map(({ id: iid, title, severity, status }) => ({ id: iid, title, severity, status })),
      };
    }),

  createIncident: (input) =>
    respond((db) => {
      assertPermission(PERMISSIONS.INCIDENTS_WRITE);
      const errors = {};
      if (!String(input.title || '').trim()) errors.title = 'Incident title is required.';
      if (!SEVERITIES.includes(input.severity)) errors.severity = 'Select a severity.';
      if (Object.keys(errors).length) throw validationError('Please fix the highlighted fields.', errors);
      db.seq.incident += 1;
      const at = nowIso();
      const inc = {
        id: `INC-${db.seq.incident}`,
        title: input.title.trim(),
        description: String(input.description || '').trim(),
        severity: input.severity,
        status: 'Investigating',
        category: input.category || null,
        affectedServices: input.category ? [input.category] : [],
        restaurantIds: input.restaurantId ? [input.restaurantId] : [],
        ownerId: input.ownerId || null,
        relatedIssueIds: input.relatedIssueId ? [input.relatedIssueId] : [],
        startedAt: at,
        updatedAt: at,
        resolvedAt: null,
        history: [{ at, text: 'Incident opened', actor: currentMockUser().name }],
      };
      db.incidents.unshift(inc);
      writeAudit({ actorId: currentMockUser().id, action: 'incident.create', resource: inc.id });
      return enrich(db, inc);
    }),

  updateStatus: (id, status) =>
    respond((db) => {
      assertPermission(PERMISSIONS.INCIDENTS_WRITE);
      const inc = findIncident(db, id);
      if (!(INCIDENT_TRANSITIONS[inc.status] ?? []).includes(status)) throw validationError(`Cannot move from ${inc.status} to ${status}.`);
      const from = inc.status;
      inc.status = status;
      if (status === 'Resolved') inc.resolvedAt = nowIso();
      log(inc, `Status changed from ${from} to ${status}`);
      writeAudit({ actorId: currentMockUser().id, action: 'incident.update', resource: inc.id });
      return enrich(getDb(), inc);
    }),

  assignOwner: (id, userId) =>
    respond((db) => {
      assertPermission(PERMISSIONS.INCIDENTS_WRITE);
      const inc = findIncident(db, id);
      if (!db.users.some((u) => u.id === userId)) throw validationError('Unknown user.');
      inc.ownerId = userId;
      log(inc, `Owner set to ${userName(userId)}`);
      writeAudit({ actorId: currentMockUser().id, action: 'incident.update', resource: inc.id });
      return enrich(db, inc);
    }),
};
