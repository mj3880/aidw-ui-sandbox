'use client';

import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { useStore } from '@/store/store';

export function RootProviders({ children }: { children: React.ReactNode }) {
  const loadAll = useStore((s) => s.loadAll);
  const loaded = useStore((s) => s.loaded);

  useEffect(() => {
    if (!loaded) {
      void loadAll();
    }
  }, [loaded, loadAll]);

  return (
    <>
      {children}
      <Toaster richColors position="top-right" />
    </>
  );
}
