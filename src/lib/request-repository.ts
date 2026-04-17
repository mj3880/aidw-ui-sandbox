import type { FaxRequest } from '@/types/request';

const URL_PATH = '/samples/requests/requests.json';
const LS_PREFIX = 'aidw-ui-mock:requests:';

export async function loadRequests(): Promise<FaxRequest[]> {
  const res = await fetch(URL_PATH, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch requests.json: ${res.status}`);
  }
  const base: FaxRequest[] = await res.json();
  return mergeWithLocalStorage(base);
}

function mergeWithLocalStorage(base: FaxRequest[]): FaxRequest[] {
  if (typeof window === 'undefined') return base;
  return base.map((req) => {
    const key = `${LS_PREFIX}${req.requestId}`;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return req;
      const override = JSON.parse(raw) as Partial<FaxRequest>;
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
