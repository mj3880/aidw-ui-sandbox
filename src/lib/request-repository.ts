import type { FaxRequest } from '@/types/request';

const URL_PATH = '/samples/requests/requests.json';
const LS_PREFIX = 'aidw-ui-mock:requests:';

/**
 * Fields that the user can edit at runtime and that are safe to override
 * via localStorage. Identity/source-of-truth fields (requestId, pdfFile,
 * receivedAt, orderDate, deliveryDate) are intentionally NOT in this list
 * so a tampered localStorage entry cannot redirect <Document file=...> to
 * an arbitrary URL or relative path.
 */
const OVERRIDABLE_FIELDS = [
  'status',
  'customerId',
  'deliveryLocation',
  'assigneeUserId',
  'assigneeTeamId',
  'lineItems',
] as const satisfies readonly (keyof FaxRequest)[];

type OverridableKey = (typeof OVERRIDABLE_FIELDS)[number];

export async function loadRequests(): Promise<FaxRequest[]> {
  const res = await fetch(URL_PATH, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch requests.json: ${res.status}`);
  }
  const base: FaxRequest[] = await res.json();
  return mergeWithLocalStorage(base);
}

function pickOverridable(raw: unknown): Partial<FaxRequest> {
  if (!raw || typeof raw !== 'object') return {};
  const source = raw as Record<string, unknown>;
  const out: Partial<FaxRequest> = {};
  for (const key of OVERRIDABLE_FIELDS) {
    if (key in source) {
      // Cast is safe: only whitelisted keys are copied. Runtime shape
      // validation is intentionally light for this prototype.
      (out as Record<OverridableKey, unknown>)[key] = source[key];
    }
  }
  return out;
}

function mergeWithLocalStorage(base: FaxRequest[]): FaxRequest[] {
  if (typeof window === 'undefined') return base;
  return base.map((req) => {
    const key = `${LS_PREFIX}${req.requestId}`;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return req;
      const override = pickOverridable(JSON.parse(raw));
      return { ...req, ...override };
    } catch (e) {
      console.warn(`request-repository: corrupted entry for ${req.requestId}, removing`, e);
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* noop */
      }
      return req;
    }
  });
}

export function persistRequest(req: FaxRequest): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${LS_PREFIX}${req.requestId}`, JSON.stringify(req));
  } catch (e) {
    console.error('persistRequest failed', e);
  }
}

export function clearAllRequestOverrides(): void {
  if (typeof window === 'undefined') return;
  const toRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(LS_PREFIX)) toRemove.push(k);
  }
  toRemove.forEach((k) => window.localStorage.removeItem(k));
}
