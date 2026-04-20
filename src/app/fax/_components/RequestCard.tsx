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
  const auth = useStore((s) => s.auth);

  const customerName = masters ? getCustomerName(masters, request.customerId) : request.customerId;
  const assigneeDisplay = formatAssignee(request.assigneeUserId, request.assigneeTeamId, auth?.user.userId);
  const lowConfidenceCount = request.lineItems.filter((l) => l.isLowConfidence).length;

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
      <div className="flex items-center gap-3 mb-1">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap',
            STATUS_BADGE_CLASS[request.status],
          )}
        >
          {STATUS_LABEL[request.status]}
        </span>
        <div className="text-lg font-bold text-slate-900 truncate" title={customerName}>
          {customerName}
        </div>
      </div>
      <div className="text-xs text-slate-500 mb-3 truncate" title={request.deliveryLocation}>
        {request.deliveryLocation}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <dt className="inline-block bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded">納入日</dt>
          <dd>{request.deliveryDate}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="inline-block bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded">受信日時</dt>
          <dd>{formatDateTime(request.receivedAt)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="inline-block bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded">拠点着日</dt>
          <dd>{request.arrivalDate}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="inline-block bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded">対応者</dt>
          <dd>{request.status === 'pending' ? '-' : assigneeDisplay}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="inline-block bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded">明細</dt>
          <dd>{request.lineItems.length}件</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="inline-block bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded">要確認明細</dt>
          <dd>{lowConfidenceCount}件</dd>
        </div>
      </dl>
    </button>
  );
}

/** Derive a short human-readable assignee label from userId/teamId. */
function formatAssignee(
  assigneeUserId: string | null,
  assigneeTeamId: string | null,
  selfUserId: string | undefined,
): string {
  if (assigneeUserId) {
    if (selfUserId && assigneeUserId === selfUserId) return '自分';
    return assigneeUserId;
  }
  if (assigneeTeamId) return `${assigneeTeamId}（チーム）`;
  return '-';
}
