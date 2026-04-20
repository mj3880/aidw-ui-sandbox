'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useStore } from '@/store/store';
import { StatusFilter, type FilterValue } from './_components/StatusFilter';
import { RequestCard } from './_components/RequestCard';

type SortKey = 'deliveryDate' | 'arrivalDate' | 'receivedAt';
type SortOrder = 'asc' | 'desc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'deliveryDate', label: '納入日' },
  { value: 'arrivalDate', label: '拠点着日' },
  { value: 'receivedAt', label: '受信日時' },
];

const isSortKey = (v: string): v is SortKey => SORT_OPTIONS.some((o) => o.value === v);

export default function FaxListPage() {
  const requests = useStore((s) => s.requests);
  const masters = useStore((s) => s.masters);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [sortKey, setSortKey] = useState<SortKey>('deliveryDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const filtered = useMemo(() => {
    const list = filter === 'all' ? requests : requests.filter((r) => r.status === filter);
    return [...list].sort((a, b) =>
      sortOrder === 'asc'
        ? a[sortKey].localeCompare(b[sortKey])
        : b[sortKey].localeCompare(a[sortKey]),
    );
  }, [requests, filter, sortKey, sortOrder]);

  return (
    <AppShell>
      <div className="p-6 space-y-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">FAX確認依頼一覧</h1>
          <div className="text-xs text-slate-500">{filtered.length}件 / 全{requests.length}件</div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <StatusFilter value={filter} onChange={setFilter} />
          <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 shadow-sm">
            <label htmlFor="fax-sort-key" className="text-xs text-slate-500">並び順</label>
            <select
              id="fax-sort-key"
              value={sortKey}
              onChange={(e) => {
                const v = e.target.value;
                if (isSortKey(v)) setSortKey(v);
              }}
              className="text-sm bg-transparent focus:outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSortOrder((p) => (p === 'asc' ? 'desc' : 'asc'))}
              className="rounded px-2 py-0.5 text-sm text-slate-700 hover:bg-slate-100"
              aria-label={sortOrder === 'asc' ? '昇順' : '降順'}
              title={sortOrder === 'asc' ? '昇順 (古い→新しい)' : '降順 (新しい→古い)'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
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
