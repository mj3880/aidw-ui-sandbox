'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useStore } from '@/store/store';
import { StatusFilter, type FilterValue } from './_components/StatusFilter';
import { RequestCard } from './_components/RequestCard';
import { List } from 'lucide-react';

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
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 20,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                margin: '0 0 4px',
              }}
            >
              FAX確認依頼一覧
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
              {filtered.length}件 / 全{requests.length}件
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <StatusFilter value={filter} onChange={setFilter} />
          <div
            className="flex items-center gap-2"
            style={{
              background: 'var(--bg-elev)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              padding: '4px 10px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <label
              htmlFor="fax-sort-key"
              style={{ fontSize: 12, color: 'var(--text-muted)' }}
            >
              並び順
            </label>
            <select
              id="fax-sort-key"
              value={sortKey}
              onChange={(e) => {
                const v = e.target.value;
                if (isSortKey(v)) setSortKey(v);
              }}
              className="select"
              style={{ width: 'auto', padding: '4px 6px', border: 'none', background: 'transparent' }}
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
              className="btn btn-ghost btn-sm"
              aria-label={sortOrder === 'asc' ? '昇順' : '降順'}
              title={sortOrder === 'asc' ? '昇順 (古い→新しい)' : '降順 (新しい→古い)'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty">
              <div className="entry-icon">
                <List className="size-5" />
              </div>
              <h3>該当する依頼はありません</h3>
              <p>フィルタ条件を変更してください</p>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 'var(--density-gap)',
            }}
          >
            {filtered.map((r) => (
              <RequestCard key={r.requestId} request={r} masters={masters} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
