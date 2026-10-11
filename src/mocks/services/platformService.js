import { PERMISSIONS } from '../../utils/constants';
import { notFound, nowIso, respond, userName, writeAudit } from '../db';
import { assertPermission, currentMockUser } from './authService';

export const platformService = {
  getOverview: () =>
    respond((db) => {
      assertPermission(PERMISSIONS.PLATFORM_READ);
      return {
        release: db.platform.release,
        queues: db.platform.queues,
        queueDepth: db.platform.queues.reduce((s, q) => s + q.depth, 0),
        failedJobs: db.platform.jobs.filter((j) => j.status === 'Failed').length,
      };
    }),

  listFeatureFlags: ({ environment } = {}) =>
    respond((db) => {
      assertPermission(PERMISSIONS.PLATFORM_READ);
      return db.platform.featureFlags
        .filter((f) => !environment || environment === 'all' || f.environment === environment)
        .map((f) => ({ ...f, modifiedByName: userName(f.modifiedBy) }));
    }),

  setFeatureFlag: (key, enabled) =>
    respond((db) => {
      assertPermission(PERMISSIONS.PLATFORM_WRITE);
      const flag = db.platform.featureFlags.find((f) => f.key === key);
      if (!flag) throw notFound(`Feature flag ${key}`);
      Object.assign(flag, { enabled, modifiedBy: currentMockUser().id, modifiedAt: nowIso() });
      writeAudit({ actorId: currentMockUser().id, action: 'feature_flag.update', resource: key });
      return { ...flag, modifiedByName: userName(flag.modifiedBy) };
    }),

  listJobs: ({ status, environment } = {}) =>
    respond((db) => {
      assertPermission(PERMISSIONS.PLATFORM_READ);
      return db.platform.jobs.filter(
        (j) => (!status || status === 'all' || j.status === status) && (!environment || environment === 'all' || j.environment === environment)
      );
    }),
};
