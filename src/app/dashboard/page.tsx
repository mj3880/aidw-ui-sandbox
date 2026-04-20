'use client';

import { useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import { useStore } from '@/store/store';
import { TopActionButtons } from './_components/TopActionButtons';
import { PendingList } from './_components/PendingList';

export default function DashboardPage() {
  const requests = useStore((s) => s.requests);
  const auth = useStore((s) => s.auth);

  const stats = useMemo(() => {
    if (!auth) return { pending: 0, inprogress: 0, done: 0 };
    const mine = requests.filter(
      (r) =>
        r.assigneeUserId === auth.user.userId ||
        r.assigneeTeamId === auth.user.teamId ||
        r.assigneeUserId === null,
    );
    return {
      pending: mine.filter((r) => r.status === 'pending').length,
      inprogress: mine.filter((r) => r.status === 'in_progress').length,
      done: mine.filter((r) => r.status === 'done').length,
    };
  }, [requests, auth]);

  const firstName = auth?.email?.split('@')[0] ?? 'guest';

  return (
    <AppShell>
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              margin: '0 0 4px',
            }}
          >
            おかえりなさい、{firstName}さん
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            本日の未対応 {stats.pending} 件 · 対応中 {stats.inprogress} 件 · 対応済 {stats.done} 件
          </p>
        </div>
        <TopActionButtons />
        <PendingList />
      </div>
    </AppShell>
  );
}
