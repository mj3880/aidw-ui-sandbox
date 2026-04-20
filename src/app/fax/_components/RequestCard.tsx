'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { FaxRequest } from '@/types/request';
import { STATUS_BADGE_CLASS, STATUS_LABEL } from '@/types/request';
import type { Masters } from '@/types/master';
import { useStore } from '@/store/store';
import { getCustomerName } from '@/lib/master-repository';
import { formatDateTime } from '@/lib/elapsed-time-formatter';

const CHIP_LABEL_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  padding: '2px 8px',
  backgroundColor: 'var(--bg-elev)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-sm)',
  fontSize: 11,
  color: 'var(--text-muted)',
  whiteSpace: 'nowrap',
  flexShrink: 0,
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
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minWidth: 0,
        }}
      >
        <span className={STATUS_BADGE_CLASS[request.status]} style={{ flexShrink: 0 }}>
          <span className="dot" />
          {STATUS_LABEL[request.status]}
        </span>
        <span
          className="truncate"
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            lineHeight: 1.35,
          }}
          title={customerName}
        >
          {customerName}
        </span>
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
        <LabeledValue label="納入日" value={request.deliveryDate} />
        <LabeledValue label="受信日時" value={formatDateTime(request.receivedAt)} />
        <LabeledValue label="拠点着日" value={request.arrivalDate} />
        <LabeledValue label="対応者" value={request.status === 'pending' ? '-' : assigneeDisplay} />
        <LabeledValue label="明細" value={`${request.lineItems.length} 件`} />
        <LabeledValue label="要確認明細" value={`${lowConfidenceCount} 件`} />
      </div>
    </button>
  );
}

function LabeledValue({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        minWidth: 0,
      }}
    >
      <span style={CHIP_LABEL_STYLE}>{label}</span>
      <span className="truncate font-medium" style={{ color: 'var(--text)', minWidth: 0 }}>
        {value}
      </span>
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
