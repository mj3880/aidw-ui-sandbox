'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import type { Masters } from '@/types/master';
import type { FaxRequest, RequestStatus } from '@/types/request';
import { loadMasters } from '@/lib/master-repository';
import { loadRequests, persistRequest } from '@/lib/request-repository';
import type { CurrentUser } from '@/types/auth';

interface AuthState {
  email: string;
  user: CurrentUser;
}

interface StoreState {
  // Persisted
  auth: AuthState | null;

  // Runtime (not persisted)
  masters: Masters | null;
  requests: FaxRequest[];
  loaded: boolean;
  loadError: string | null;

  // Actions
  login: (email: string) => void;
  logout: () => void;
  loadAll: () => Promise<void>;
  reloadRequests: () => Promise<void>;
  updateRequestStatus: (requestId: string, status: RequestStatus) => void;
  saveRequestSnapshot: (req: FaxRequest) => void;
  getRequest: (requestId: string) => FaxRequest | undefined;
}

const DEFAULT_USER: CurrentUser = { userId: 'user-self', teamId: 'T-A' };

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      auth: null,
      masters: null,
      requests: [],
      loaded: false,
      loadError: null,

      login: (email: string) => {
        set({ auth: { email, user: DEFAULT_USER } });
      },

      logout: () => {
        set({ auth: null });
      },

      loadAll: async () => {
        try {
          console.info('store.loadAll: start');
          const [masters, requests] = await Promise.all([loadMasters(), loadRequests()]);
          set({ masters, requests, loaded: true, loadError: null });
          console.info(
            `store.loadAll: success (masters: ${masters.customers.length} customers / ${masters.products.length} products, requests: ${requests.length})`,
          );
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error('store.loadAll: failed', e);
          set({ loadError: msg, loaded: false });
          toast.error(`データ読み込みに失敗しました: ${msg}`);
        }
      },

      reloadRequests: async () => {
        try {
          const requests = await loadRequests();
          set({ requests });
        } catch (e) {
          console.error('store.reloadRequests: failed', e);
        }
      },

      updateRequestStatus: (requestId, status) => {
        const { requests } = get();
        const next = requests.map((r) => {
          if (r.requestId !== requestId) return r;
          const updated = { ...r, status };
          persistRequest(updated);
          return updated;
        });
        set({ requests: next });
      },

      saveRequestSnapshot: (req) => {
        const { requests } = get();
        persistRequest(req);
        set({ requests: requests.map((r) => (r.requestId === req.requestId ? req : r)) });
      },

      getRequest: (requestId) => {
        return get().requests.find((r) => r.requestId === requestId);
      },
    }),
    {
      name: 'aidw-ui-mock:store',
      // Only persist auth; runtime data is reloaded from public/samples on each session
      partialize: (state) => ({ auth: state.auth }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('store rehydrate failed, clearing', error);
          try {
            window.localStorage.removeItem('aidw-ui-mock:store');
          } catch {
            /* noop */
          }
        }
      },
    },
  ),
);
