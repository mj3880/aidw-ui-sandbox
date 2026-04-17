'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { selectNextPendingFax } from '@/lib/next-fax-selector';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function Step5Complete() {
  const router = useRouter();
  const auth = useStore((s) => s.auth);
  const requests = useStore((s) => s.requests);
  const updateStatus = useStore((s) => s.updateRequestStatus);

  const handleNext = () => {
    if (!auth) return;
    const next = selectNextPendingFax(requests, auth.user);
    if (!next) {
      toast.info('スコープ内に未対応の依頼はありません');
      router.push('/fax');
      return;
    }
    updateStatus(next.requestId, 'in_progress');
    router.push(`/fax/${next.requestId}`);
  };

  return (
    <div className="p-6 space-y-6 flex flex-col items-center text-center">
      <CheckCircle2 className="size-16 text-emerald-500" />
      <div>
        <h2 className="text-xl font-bold text-slate-900">承認が完了しました</h2>
        <p className="text-sm text-slate-500 mt-1">この依頼は「対応済み」として保存されました</p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleNext}
          className="rounded-md bg-blue-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-blue-700"
        >
          次のFAXへ
        </button>
        <button
          type="button"
          onClick={() => router.push('/fax')}
          className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          一覧へ戻る
        </button>
      </div>
    </div>
  );
}
