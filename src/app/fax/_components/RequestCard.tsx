'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { FaxRequest } from '@/types/request';
import { STATUS_LABEL } from '@/types/request';
import type { Masters } from '@/types/master';
import { useStore } from '@/store/store';
import { getCustomerName } from '@/lib/master-repository';
import { formatDateTime } from '@/lib/elapsed-time-formatter';

const BADGE_CLASS: Record<FaxRequest['status'], string> = {
  pending: 'badge badge-pending',
  in_progress: 'badge badge-inprogress',
  done: 'badge badge-completed',
};

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
      className="card w-full text-left"
      style={{
        padding: 'var(--density-pad-y) var(--density-pad-x)',
        cursor: 'pointer',
        transition: 'transform 0.12s, box-shadow 0.12s, border-color 0.12s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = 'var(--border-strong)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = '';
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <span className={BADGE_CLASS[request.status]}>
          <span className="dot" />
          {STATUS_LABEL[request.status]}
        </span>
        <span className="code truncate" title={request.pdfFile}>
          {request.pdfFile}
        </span>
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          lineHeight: 1.35,
        }}
        className="truncate"
        title={customerName}
      >
        {customerName}
      </div>
      <div
        className="truncate"
        style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}
        title={request.deliveryLocation}
      >
        {request.deliveryLocation}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginTop: 14,
          fontSize: 12.5,
        }}
      >
        <KV label="納入日" value={request.deliveryDate} />
        <KV label="受信日時" value={formatDateTime(request.receivedAt)} />
        <KV label="拠点着日" value={request.arrivalDate} />
        <KV label="対応者" value={request.status === 'pending' ? '-' : assigneeDisplay} />
        <KV label="明細" value={`${request.lineItems.length} 件`} />
        <KV label="要確認明細" value={`${lowConfidenceCount} 件`} />
      </div>
    </button>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{label}</div>
      <div className="font-medium" style={{ color: 'var(--text)' }}>
        {value}
      </div>
    </div>
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
