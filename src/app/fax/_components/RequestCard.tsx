'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { FaxRequest } from '@/types/request';
import { STATUS_BADGE_CLASS, STATUS_LABEL } from '@/types/request';
import type { Masters } from '@/types/master';
import { useStore } from '@/store/store';
import { getCustomerName } from '@/lib/master-repository';
import { formatDateTime } from '@/lib/elapsed-time-formatter';
import { cn } from '@/lib/utils';

export function RequestCard({
  request,
  masters,
}: {
  request: FaxRequest;
  masters: Masters | null;
}) {
  const router = useRouter();
  const updateStatus = useStore((s) => s.updateRequestStatus);

  const customerName = masters ? getCustomerName(masters, request.customerId) : request.customerId;

  const handleClick = () => {
    console.info('RequestCard.handleClick', request.requestId, request.status);
    if (request.status === 'pending') {
      updateStatus(request.requestId, 'in_progress');
      toast.info('ステータスを「対応中」に変更しました');
    }
    router.push(`/fax/${request.requestId}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'w-full text-left rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition',
        request.status === 'pending' ? 'border-slate-200 hover:border-blue-400' : 'border-slate-200',
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <span
          className={cn(
            'inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold',
            STATUS_BADGE_CLASS[request.status],
          )}
        >
          {STATUS_LABEL[request.status]}
        </span>
        <span className="text-[11px] text-slate-400">{request.requestId}</span>
      </div>
      <div className="text-sm font-semibold text-slate-900 truncate" title={customerName}>
        {customerName}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-y-1 text-xs text-slate-600">
        <dt className="text-slate-400">受注日付</dt>
        <dd>{request.orderDate}</dd>
        <dt className="text-slate-400">受信時刻</dt>
        <dd>{formatDateTime(request.receivedAt)}</dd>
        <dt className="text-slate-400">荷渡日</dt>
        <dd>{request.deliveryDate}</dd>
        <dt className="text-slate-400">明細数</dt>
        <dd>{request.lineItems.length}件</dd>
        <dt className="text-slate-400">対応者</dt>
        <dd>
          {request.status === 'pending'
            ? '-'
            : request.assigneeName ?? (request.assigneeTeamId ? `${request.assigneeTeamId}（チーム）` : '-')}
        </dd>
      </dl>
    </button>
  );
}
