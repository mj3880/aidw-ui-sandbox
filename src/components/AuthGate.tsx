'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { AlertTriangle } from 'lucide-react';

/**
 * Client-side auth guard. Redirects to /  if user is not logged in.
 * Use inside layout.tsx of authenticated routes.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const auth = useStore((s) => s.auth);
  const loaded = useStore((s) => s.loaded);
  const loadError = useStore((s) => s.loadError);
  const loadAll = useStore((s) => s.loadAll);

  useEffect(() => {
    if (!auth) {
      router.replace('/');
    }
  }, [auth, router]);

  useEffect(() => {
    if (auth && !loaded && !loadError) {
      void loadAll();
    }
  }, [auth, loaded, loadError, loadAll]);

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        リダイレクト中...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white border border-red-200 rounded-md p-6 max-w-md text-center space-y-3">
          <AlertTriangle className="size-10 text-red-500 mx-auto" />
          <h2 className="text-base font-semibold text-slate-900">データ読み込みに失敗しました</h2>
          <p className="text-xs text-slate-500 break-all">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
            className="rounded bg-blue-600 text-white text-sm px-4 py-2 font-semibold hover:bg-blue-700"
          >
            リロード
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
