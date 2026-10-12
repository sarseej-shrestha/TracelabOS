import type { Database } from '../../../packages/database/src/adapter.ts';

export type Resource =
  'mutations' | 'identities' | 'authentication' | 'uploads';
export type ResourcePolicies = Record<
  Resource,
  { daily: number; lifetime?: number }
>;
export const publicDemoBudgets: ResourcePolicies = {
  mutations: { daily: 2000, lifetime: 50000 },
  identities: { daily: 100, lifetime: 1000 },
  authentication: { daily: 500 },
  uploads: { daily: 20, lifetime: 128 },
};
const dayMs = 86400000;
export function validatePolicies(policies: ResourcePolicies) {
  for (const resource of Object.keys(publicDemoBudgets) as Resource[]) {
    const policy = policies[resource];
    if (
      !policy ||
      !Number.isSafeInteger(policy.daily) ||
      policy.daily < 0 ||
      (policy.lifetime !== undefined &&
        (!Number.isSafeInteger(policy.lifetime) || policy.lifetime < 0))
    )
      throw new Error('Invalid resource budget configuration');
  }
}
export class ResourceLimit extends Error {
  constructor(
    readonly resource: Resource,
    readonly retryAt: number | null,
  ) {
    super(retryAt === null ? 'DEMO_CAPACITY_REACHED' : 'DEMO_DAILY_LIMIT');
  }
  get explanation() {
    if (this.resource === 'uploads')
      return 'Photo processing is paused for this demo. You can still enter mathematical steps manually.';
    return this.retryAt === null
      ? 'This demo has reached its capacity. Existing records remain available to signed-in users; new work needs an operator capacity review.'
      : 'This demo has reached its daily allowance. Existing records remain available to signed-in users. Please try again after midnight UTC.';
  }
}
export function requestResources(
  method: string,
  path: string,
): Partial<Record<Resource, number>> {
  if (
    ['GET', 'HEAD', 'OPTIONS'].includes(method) ||
    path === '/api/auth/logout'
  )
    return {};
  const resources: Partial<Record<Resource, number>> = { mutations: 1 };
  if (method === 'POST') {
    if (path === '/api/demo') resources.identities = 2;
    if (path === '/api/auth/register') resources.identities = 1;
    if (['/api/auth/register', '/api/auth/login'].includes(path))
      resources.authentication = 1;
    if (/^\/api\/submissions\/[^/]+\/image$/.test(path)) resources.uploads = 1;
  }
  return resources;
}
/** Commit separately BEFORE request work: failures/restarts never refund expensive attempts. */
export async function reserveResources(
  db: Database,
  resources: Partial<Record<Resource, number>>,
  policies: ResourcePolicies,
  now = Date.now(),
) {
  validatePolicies(policies);
  if (!Number.isSafeInteger(now) || now < 0)
    throw new Error('Invalid budget clock');
  const day = Math.floor(now / dayMs);
  const entries = Object.entries(resources) as [Resource, number][];
  if (!entries.length) return;
  await db.transaction(async () => {
    // Stable lock order also permits future removal of the shared demo write lock.
    for (const [resource, units] of entries.sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      const policy = policies[resource];
      if (!policy || !Number.isSafeInteger(units) || units <= 0)
        throw new Error('Invalid budget reservation');
      const lifetime = policy.lifetime ?? Number.MAX_SAFE_INTEGER;
      if (units > lifetime) throw new ResourceLimit(resource, null);
      if (units > policy.daily)
        throw new ResourceLimit(resource, (day + 1) * dayMs);
      const reserved = await db
        .prepare(
          `
        INSERT INTO resource_budgets(resource,day,day_used,total_used) VALUES(?,?,?,?)
        ON CONFLICT(resource) DO UPDATE SET
          day=excluded.day,
          day_used=CASE WHEN resource_budgets.day<excluded.day THEN excluded.day_used ELSE resource_budgets.day_used+excluded.day_used END,
          total_used=resource_budgets.total_used+excluded.total_used
        WHERE resource_budgets.day<=excluded.day
          AND resource_budgets.total_used<=?
          AND CASE WHEN resource_budgets.day<excluded.day THEN 0 ELSE resource_budgets.day_used END<=?
        RETURNING resource
      `,
        )
        .get(
          resource,
          day,
          units,
          units,
          lifetime - units,
          policy.daily - units,
        );
      if (!reserved) {
        const current = await db
          .prepare(
            'SELECT day,total_used FROM resource_budgets WHERE resource=?',
          )
          .get(resource);
        const exhausted = Number(current?.total_used) > lifetime - units;
        throw new ResourceLimit(
          resource,
          exhausted ? null : (Math.max(day, Number(current?.day)) + 1) * dayMs,
        );
      }
    }
  });
}
