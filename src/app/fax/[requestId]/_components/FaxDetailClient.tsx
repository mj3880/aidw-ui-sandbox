'use client';

import { useEffect, useMemo, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useStore } from '@/store/store';
import { PdfPane } from './PdfPane';
import { Step1Customer } from './Step1Customer';
import { Step2DeliveryDest } from './Step2DeliveryDest';
import { Step3LineItems } from './Step3LineItems';
import { Step4ConfirmModal } from './Step4ConfirmModal';
import { Step5Complete } from './Step5Complete';
import {
  applyDraft,
  diffRequest,
  toDraft,
  type Mode,
  type RequestDraft,
  type StepKey,
} from './types';
import type { FaxRequest } from '@/types/request';
import { STATUS_LABEL } from '@/types/request';

const BADGE_CLASS: Record<FaxRequest['status'], string> = {
  pending: 'badge badge-pending',
  in_progress: 'badge badge-inprogress',
  done: 'badge badge-completed',
};

export function FaxDetailClient({ requestId }: { requestId: string }) {
  const router = useRouter();
  const loaded = useStore((s) => s.loaded);
  const requests = useStore((s) => s.requests);
  const saveSnapshot = useStore((s) => s.saveRequestSnapshot);

  const request = useMemo(
    () => requests.find((r) => r.requestId === requestId),
    [requests, requestId],
  );

  const mode: Mode = request && request.status === 'done' ? 'view' : 'edit';

  const [step, setStep] = useState<StepKey>('step1');
  const [draft, setDraft] = useState<RequestDraft | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Initialize draft once when request becomes available.
  useEffect(() => {
    if (request && draft === null) {
      setDraft(toDraft(request));
    }
  }, [request, draft]);

  // If request not found after data is loaded, surface error.
  useEffect(() => {
    if (loaded && !request) {
      console.error('FaxDetailClient: unknown requestId', requestId);
      toast.error(`依頼が見つかりません: ${requestId}`);
      router.replace('/fax');
    }
  }, [loaded, request, requestId, router]);

  if (!loaded || !request || !draft) {
    return (
      <AppShell>
        <div className="p-8" style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          読み込み中...
        </div>
      </AppShell>
    );
  }

  const diffs = diffRequest(request, draft);

  const handleApprove = () => {
    console.info('FaxDetailClient.handleApprove', { requestId, diffs });
    const next = { ...applyDraft(request, draft), status: 'done' as const };
    saveSnapshot(next);
    setShowModal(false);
    setStep('step5');
    toast.success('承認しました');
  };

  const stepDefs: { n: number; key: StepKey; label: string }[] = [
    { n: 1, key: 'step1', label: '取引先の確認' },
    { n: 2, key: 'step2', label: '納品先の確認' },
    { n: 3, key: 'step3', label: '明細の確認' },
    { n: 4, key: 'step3', label: '変更内容の確認' }, // Step4 は Modal
    { n: 5, key: 'step5', label: '完了' },
  ];

  const currentN: number = (() => {
    if (showModal) return 4;
    if (step === 'step1') return 1;
    if (step === 'step2') return 2;
    if (step === 'step3') return 3;
    return 5;
  })();

  return (
    <AppShell>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 520px',
          height: 'calc(100vh - 60px)',
          minHeight: 0,
        }}
      >
        {/* Left: PDF */}
        <section
          style={{
            minWidth: 0,
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '14px 24px',
              background: 'var(--bg-elev)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12.5,
              color: 'var(--text-muted)',
            }}
          >
            <span className="code">原本PDF: {request.pdfFile}</span>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <PdfPane pdfUrl={`/samples/fax/${request.pdfFile}`} />
          </div>
        </section>

        {/* Right: Step UI */}
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            background: 'var(--bg)',
          }}
        >
          <div
            style={{
              padding: '14px 24px',
              background: 'var(--bg-elev)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => router.push('/fax')}
            >
              <ChevronLeft className="size-3.5" /> 一覧へ戻る
            </button>
            <div className="flex items-center gap-2.5">
              <span className={BADGE_CLASS[request.status]}>
                <span className="dot" />
                {STATUS_LABEL[request.status]}
              </span>
              {mode === 'view' && (
                <span className="text-[12.5px]" style={{ color: 'var(--text-subtle)' }}>
                  閲覧モード
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px 24px',
              display: 'grid',
              gridTemplateColumns: '160px 1fr',
              gap: 20,
              alignItems: 'start',
            }}
          >
            {/* Vertical stepper */}
            <div className="stepper-v">
              {stepDefs.map((s, i) => (
                <Fragment key={s.n}>
                  <div
                    className={[
                      'step',
                      s.n === currentN ? 'active' : '',
                      s.n < currentN ? 'done' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div className="circle">{s.n < currentN ? '✓' : s.n}</div>
                    <div className="label">{s.label}</div>
                  </div>
                  {i < stepDefs.length - 1 && (
                    <div className={`connector ${s.n < currentN ? 'done' : ''}`} />
                  )}
                </Fragment>
              ))}
            </div>

            {/* Step content */}
            <div>
              {step === 'step1' && (
                <Step1Customer
                  draft={draft}
                  setDraft={setDraft}
                  mode={mode}
                  onNext={() => setStep('step2')}
                />
              )}
              {step === 'step2' && (
                <Step2DeliveryDest
                  draft={draft}
                  setDraft={setDraft}
                  mode={mode}
                  onBack={() => setStep('step1')}
                  onNext={() => setStep('step3')}
                />
              )}
              {step === 'step3' && (
                <Step3LineItems
                  draft={draft}
                  setDraft={setDraft}
                  mode={mode}
                  onBack={() => setStep('step2')}
                  onConfirm={() => setShowModal(true)}
                />
              )}
              {step === 'step5' && <Step5Complete />}
            </div>
          </div>
        </section>
      </div>

      {showModal && mode === 'edit' && (
        <Step4ConfirmModal
          diffs={diffs}
          onCancel={() => setShowModal(false)}
          onApprove={handleApprove}
        />
      )}
    </AppShell>
  );
}
