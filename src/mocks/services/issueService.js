import { ISSUE_TRANSITIONS, PERMISSIONS } from '../../utils/constants';
import { notFound, nowIso, respond, userName, validationError, writeAudit } from '../db';
import { assertPermission, currentMockUser } from './authService';
import { includesText, matchesLocation, restaurantSummary, withinRange } from './helpers';

function toListItem(db, issue) {
  const restaurants = issue.restaurantIds.map((id) => db.restaurants.find((r) => r.id === id));
  return {
    id: issue.id,
    title: issue.title,
    category: issue.category,
    severity: issue.severity,
    status: issue.status,
    restaurant: restaurantSummary(restaurants[0]),
    affectedRestaurantCount: restaurants.length,
    assigneeId: issue.assigneeId,
    assigneeName: issue.assigneeId ? userName(issue.assigneeId) : null,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
  };
}

function findIssue(db, id) {
  const issue = db.issues.find((i) => i.id.toLowerCase() === String(id).toLowerCase());
  if (!issue) throw notFound(`Issue ${id}`);
  return issue;
}

function touch(issue, text) {
  const at = nowIso();
  issue.updatedAt = at;
  issue.activity.push({ at, text, actor: currentMockUser().name });
}

export const issueService = {
  listIssues: (filters = {}) =>
    respond((db) =>
      db.issues
        .filter((issue) => {
          const restaurants = issue.restaurantIds.map((id) => db.restaurants.find((r) => r.id === id));
          if (filters.severity && filters.severity !== 'all' && issue.severity !== filters.severity) return false;
          if (filters.status && filters.status !== 'all' && issue.status !== filters.status) return false;
          if (filters.category && filters.category !== 'all' && issue.category !== filters.category) return false;
          if (filters.restaurantId && filters.restaurantId !== 'all' && !issue.restaurantIds.includes(filters.restaurantId)) return false;
          if (filters.assigneeId && filters.assigneeId !== 'all') {
            if (filters.assigneeId === 'unassigned' ? issue.assigneeId : issue.assigneeId !== filters.assigneeId) return false;
          }
          if ((filters.region || filters.city) && !restaurants.some((r) => matchesLocation(r, filters))) return false;
          if (filters.timeRange && !withinRange(issue.updatedAt, filters.timeRange)) return false;
          return includesText([issue.id, issue.title, issue.category, ...restaurants.map((r) => r.name)], filters.search);
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((issue) => toListItem(db, issue))
    ),

  getIssue: (id) =>
    respond((db) => {
      const issue = findIssue(db, id);
      return {
        ...issue,
        assigneeName: issue.assigneeId ? userName(issue.assigneeId) : null,
        restaurants: issue.restaurantIds.map((rid) => restaurantSummary(db.restaurants.find((r) => r.id === rid))),
        integration: issue.integrationId ? db.integrations.find((i) => i.id === issue.integrationId) : null,
        relatedOrders: issue.relatedOrderIds.map((oid) => {
          const o = db.orders.find((x) => x.id === oid);
          return o && { id: o.id, status: o.status, channel: o.channel, createdAt: o.createdAt, total: o.total };
        }).filter(Boolean),
        incidents: db.incidents.filter((inc) => inc.relatedIssueIds.includes(issue.id)).map(({ id, title, status }) => ({ id, title, status })),
        allowedTransitions: ISSUE_TRANSITIONS[issue.status] ?? [],
      };
    }),

  getOpenIssueCount: () => respond((db) => db.issues.filter((i) => i.status !== 'Resolved').length),

  updateStatus: (id, status) =>
    respond((db) => {
      assertPermission(PERMISSIONS.ISSUES_WRITE);
      const issue = findIssue(db, id);
      if (!(ISSUE_TRANSITIONS[issue.status] ?? []).includes(status)) {
        throw validationError(`Cannot change status from ${issue.status} to ${status}.`);
      }
      const from = issue.status;
      issue.status = status;
      touch(issue, `Status changed from ${from} to ${status}`);
      writeAudit({ actorId: currentMockUser().id, action: 'issue.status', resource: issue.id });
      return { id: issue.id, status: issue.status, updatedAt: issue.updatedAt };
    }),

  assign: (id, userId) =>
    respond((db) => {
      assertPermission(PERMISSIONS.ISSUES_WRITE);
      const issue = findIssue(db, id);
      if (!db.users.some((u) => u.id === userId)) throw validationError('Unknown user.');
      issue.assigneeId = userId;
      touch(issue, `Assigned to ${userName(userId)}`);
      writeAudit({ actorId: currentMockUser().id, action: 'issue.assign', resource: issue.id });
      return { id: issue.id, assigneeId: userId, assigneeName: userName(userId) };
    }),

  addNote: (id, text) =>
    respond((db) => {
      assertPermission(PERMISSIONS.ISSUES_WRITE);
      const issue = findIssue(db, id);
      const body = String(text || '').trim();
      if (!body) throw validationError('Note cannot be empty.');
      const note = { at: nowIso(), author: currentMockUser().name, text: body };
      issue.notes.push(note);
      touch(issue, 'Internal note added');
      return note;
    }),
};
