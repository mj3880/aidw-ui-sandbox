'use client';

import { AppShell } from '@/components/AppShell';
import { TopActionButtons } from './_components/TopActionButtons';
import { PendingList } from './_components/PendingList';

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-6xl">
        <div>
          <h1 className="text-xl font-bold text-slate-900">ダッシュボード</h1>
          <p className="text-sm text-slate-500">未対応の確認業務を俯瞰できます</p>
        </div>
        <TopActionButtons />
        <PendingList />
      </div>
    </AppShell>
  );
}
