'use client';

import { SidebarNav } from './SidebarNav';
import { AuthGate } from './AuthGate';
import { useStore } from '@/store/store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const auth = useStore((s) => s.auth);
  return (
    <AuthGate>
      <div className="min-h-screen flex">
        <SidebarNav />
        <main className="flex-1 min-w-0 flex flex-col">
          <header className="h-12 border-b border-slate-200 bg-white px-4 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700">AIDW HITL Mock</div>
            <div className="text-xs text-slate-500">{auth?.email}</div>
          </header>
          <div className="flex-1 min-w-0 overflow-auto">{children}</div>
        </main>
      </div>
    </AuthGate>
  );
}
