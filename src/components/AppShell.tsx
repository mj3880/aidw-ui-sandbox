'use client';

import { SidebarNav } from './SidebarNav';
import { AuthGate } from './AuthGate';
import { useStore } from '@/store/store';
import { PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  return (
    <AuthGate>
      <div className={cn('app-shell', collapsed && 'sidebar-collapsed')}>
        <SidebarNav />
        <main className="app-main">
          {collapsed && (
            <button
              type="button"
              className="sidebar-reopen"
              aria-label="サイドバーを開く"
              onClick={toggleSidebar}
            >
              <PanelLeftOpen />
            </button>
          )}
          <div className="app-body no-pad">{children}</div>
        </main>
      </div>
    </AuthGate>
  );
}
