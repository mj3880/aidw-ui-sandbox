'use client';

import { SidebarNav } from './SidebarNav';
import { AuthGate } from './AuthGate';
import { useStore } from '@/store/store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const auth = useStore((s) => s.auth);
  return (
    <AuthGate>
      <div className="app-shell">
        <SidebarNav />
        <main className="app-main">
          <header className="app-header">
            <h1>AIDW HITL Mock</h1>
            <div className="breadcrumb">
              <span>{auth?.email}</span>
            </div>
          </header>
          <div className="app-body no-pad">{children}</div>
        </main>
      </div>
    </AuthGate>
  );
}
