'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Check, List } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/store/store';
import { selectNextPendingFax } from '@/lib/next-fax-selector';

export function Step5Complete() {
  const router = useRouter();
  const auth = useStore((s) => s.auth);
  const requests = useStore((s) => s.requests);
  const saveSnapshot = useStore((s) => s.saveRequestSnapshot);

  const handleNext = () => {
    if (!auth) return;
    const next = selectNextPendingFax(requests, auth.user);
    if (!next) {
      toast.info('スコープ内に未対応の依頼はありません');
      router.push('/fax');
      return;
    }
    saveSnapshot({
      ...next,
      status: 'in_progress',
      assigneeUserId: auth.user.userId,
      assigneeTeamId: auth.user.teamId,
    });
    toast.info('ステータスを「対応中」に変更しました');
    router.push(`/fax/${next.requestId}`);
  };

  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: '50%',
          background: 'var(--status-completed-bg)',
          color: 'var(--status-completed)',
          display: 'grid',
          placeItems: 'center',
          margin: '0 auto 18px',
        }}
      >
        <Check className="size-8" />
      </div>
      <h2
        style={{
          margin: '0 0 8px',
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: '-0.01em',
        }}
      >
        承認が完了しました
      </h2>
      <p
        style={{
          color: 'var(--text-muted)',
          margin: '0 0 24px',
          fontSize: 14,
        }}
      >
        この依頼は「対応済み」として記録されました。
        <br />
        続けて次の依頼を処理できます。
      </p>
      <div className="flex gap-2.5 justify-center">
        <button type="button" onClick={handleNext} className="btn btn-primary btn-lg">
          次のFAXへ <ArrowRight className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => router.push('/fax')}
          className="btn btn-secondary btn-lg"
        >
          <List className="size-3.5" /> 一覧へ
        </button>
      </div>
    </div>
  );
}
