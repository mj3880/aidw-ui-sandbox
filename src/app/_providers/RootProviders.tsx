'use client';

import { Toaster, toast } from 'sonner';
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

  const handleToastClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-sonner-toast]')) {
      toast.dismiss();
    }
  };

  return (
    <>
      {children}
      <div onClick={handleToastClick}>
        <Toaster
          richColors
          position="bottom-right"
          toastOptions={{ className: 'cursor-pointer' }}
        />
      </div>
    </>
  );
}
