'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { selectPendingTopN } from '@/lib/next-fax-selector';
import { formatElapsed, formatDateTime } from '@/lib/elapsed-time-formatter';
import { getCustomerName } from '@/lib/master-repository';
import { toast } from 'sonner';
import { ChevronRight, Check, FileText } from 'lucide-react';

export function PendingList() {
  const requests = useStore((s) => s.requests);
  const masters = useStore((s) => s.masters);
  const auth = useStore((s) => s.auth);
  const saveSnapshot = useStore((s) => s.saveRequestSnapshot);
  const router = useRouter();
  const [, forceTick] = useState(0);

  // Re-render every minute so 経過時間 stays fresh.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const items = useMemo(() => {
    if (!auth) return [];
    return selectPendingTopN(requests, auth.user, 10);
  }, [requests, auth]);

  const handleClick = (requestId: string) => {
    console.info('PendingList.handleClick', requestId);
    if (!auth) return;
    const target = requests.find((r) => r.requestId === requestId);
    if (!target) return;
    saveSnapshot({
      ...target,
      status: 'in_progress',
      assigneeUserId: auth.user.userId,
      assigneeTeamId: auth.user.teamId,
    });
    toast.info('ステータスを「対応中」に変更しました');
    router.push(`/fax/${requestId}`);
  };

  return (
    <section className="card">
      <div className="card-header">
        <h2>未対応の依頼（最新10件）</h2>
        <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          自分 または {auth?.user.teamId ?? '-'} 宛 · {items.length}件
        </span>
      </div>
      {items.length === 0 ? (
        <div className="empty">
          <div className="entry-icon">
            <Check className="size-5" />
          </div>
          <h3>すべての依頼に対応済みです</h3>
          <p>新しい依頼が届くとここに表示されます</p>
        </div>
      ) : (
        <table className="data">
          <thead>
            <tr>
              <th style={{ width: 110 }}>種別</th>
              <th>取引先</th>
              <th style={{ width: 180 }}>受信時刻</th>
              <th style={{ width: 120 }}>経過</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => {
              const name = masters ? getCustomerName(masters, r.customerId) : r.customerId;
              return (
                <tr
                  key={r.requestId}
                  onClick={() => handleClick(r.requestId)}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <td>
                    <span className="badge badge-neutral">
                      <FileText className="size-3" /> FAX
                    </span>
                  </td>
                  <td>
                    <div className="font-medium">{name}</div>
                    <div className="code">{r.pdfFile}</div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatDateTime(r.receivedAt)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatElapsed(r.receivedAt)}</td>
                  <td style={{ color: 'var(--text-subtle)' }}>
                    <ChevronRight className="size-3.5" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
