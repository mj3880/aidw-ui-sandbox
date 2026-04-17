'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import { useStore } from '@/store/store';
import { PdfPane } from './PdfPane';
import { Step1Customer } from './Step1Customer';
import { Step2DeliveryDest } from './Step2DeliveryDest';
import { Step3LineItems } from './Step3LineItems';
import { Step4ConfirmModal } from './Step4ConfirmModal';
import { Step5Complete } from './Step5Complete';
import { applyDraft, diffRequest, toDraft, type Mode, type RequestDraft, type StepKey } from './types';

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
        <div className="p-8 text-sm text-slate-500">読み込み中...</div>
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

  return (
    <AppShell>
      <div className="h-[calc(100vh-3rem)] flex">
        <section className="w-1/2 border-r border-slate-200 flex flex-col">
          <div className="px-4 py-2 border-b border-slate-200 bg-white text-xs text-slate-500 flex items-center justify-between">
            <span>原本PDF: {request.pdfFile}</span>
            {mode === 'view' && (
              <span className="inline-flex items-center rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5">
                閲覧モード
              </span>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <PdfPane pdfUrl={`/samples/fax/${request.pdfFile}`} />
          </div>
        </section>

        <section className="w-1/2 flex flex-col bg-white overflow-hidden">
          <StepperHeader step={step} mode={mode} />
          <div className="flex-1 min-h-0 overflow-auto">
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

function StepperHeader({ step, mode }: { step: StepKey; mode: Mode }) {
  const steps: { key: StepKey; label: string }[] = [
    { key: 'step1', label: '1. 取引先' },
    { key: 'step2', label: '2. 納品先' },
    { key: 'step3', label: '3. 明細' },
  ];
  if (mode === 'edit') {
    steps.push({ key: 'step5', label: '4. 完了' });
  }
  const currentIndex = steps.findIndex((s) => s.key === step);
  return (
    <div className="border-b border-slate-200 px-4 py-2 flex items-center gap-2 text-xs">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <span
            className={
              i === currentIndex
                ? 'rounded-full bg-blue-600 text-white px-2 py-0.5 font-semibold'
                : i < currentIndex
                ? 'rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5'
                : 'rounded-full bg-slate-100 text-slate-500 px-2 py-0.5'
            }
          >
            {s.label}
          </span>
          {i < steps.length - 1 && <span className="text-slate-300">›</span>}
        </div>
      ))}
    </div>
  );
}
