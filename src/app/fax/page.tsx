'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useStore } from '@/store/store';
import { StatusFilter, type FilterValue } from './_components/StatusFilter';
import { RequestCard } from './_components/RequestCard';

export default function FaxListPage() {
  const requests = useStore((s) => s.requests);
  const masters = useStore((s) => s.masters);
  const [filter, setFilter] = useState<FilterValue>('all');

  const filtered = useMemo(() => {
    const list = filter === 'all' ? requests : requests.filter((r) => r.status === filter);
    return [...list].sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
  }, [requests, filter]);

  return (
    <AppShell>
      <div className="p-6 space-y-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">FAX確認依頼一覧</h1>
          <div className="text-xs text-slate-500">{filtered.length}件 / 全{requests.length}件</div>
        </div>
        <StatusFilter value={filter} onChange={setFilter} />
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-md p-10 text-center text-sm text-slate-500">
            該当する依頼はありません
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((r) => (
              <li key={r.requestId}>
                <RequestCard request={r} masters={masters} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
