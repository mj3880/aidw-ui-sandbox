'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { selectPendingTopN } from '@/lib/next-fax-selector';
import { formatElapsed, formatDateTime } from '@/lib/elapsed-time-formatter';
import { getCustomerName } from '@/lib/master-repository';
import { toast } from 'sonner';

export function PendingList() {
  const requests = useStore((s) => s.requests);
  const masters = useStore((s) => s.masters);
  const auth = useStore((s) => s.auth);
  const updateStatus = useStore((s) => s.updateRequestStatus);
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
    updateStatus(requestId, 'in_progress');
    toast.info('ステータスを「対応中」に変更しました');
    router.push(`/fax/${requestId}`);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">
          自分宛て・チーム宛ての未対応依頼（最新10件）
        </h2>
        <span className="text-xs text-slate-500">{items.length}件</span>
      </div>
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">未対応依頼はありません</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((r) => (
              <li key={r.requestId}>
                <button
                  type="button"
                  onClick={() => handleClick(r.requestId)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left"
                >
                  <span className="inline-flex items-center rounded bg-blue-100 text-blue-800 text-[11px] font-semibold px-2 py-0.5 w-14 justify-center">
                    FAX
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {masters ? getCustomerName(masters, r.customerId) : r.customerId}
                    </div>
                    <div className="text-xs text-slate-500">
                      受信: {formatDateTime(r.receivedAt)}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 shrink-0">
                    {formatElapsed(r.receivedAt)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
