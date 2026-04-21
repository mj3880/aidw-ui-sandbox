'use client';

import { useEffect, useMemo, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useStore } from '@/store/store';
import { useOcrStore } from '@/store/ocr-store';
import { getProfile } from '@/profiles';
import { ProfileSelector } from '@/app/ocr-abstraction/_components/ProfileSelector';
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
import { STATUS_BADGE_CLASS, STATUS_LABEL } from '@/types/request';

const RIGHT_PANEL_WIDTH = 520;

const EDIT_STEP_DEFS: { n: number; label: string }[] = [
  { n: 1, label: '取引先の確認' },
  { n: 2, label: '納品先の確認' },
  { n: 3, label: '明細の確認' },
  { n: 4, label: '変更内容の確認' }, // Step4 は Modal
  { n: 5, label: '完了' },
];

// view モード（status==='done'）では全ステップ完了済み扱い。到達不能な中間ステップを描画する意味がないので簡略化。
const VIEW_STEP_DEFS: { n: number; label: string }[] = [
  { n: 1, label: '取引先の確認' },
  { n: 2, label: '納品先の確認' },
  { n: 3, label: '明細の確認' },
  { n: 5, label: '完了' },
];

export function FaxDetailClient({ requestId }: { requestId: string }) {
  const router = useRouter();
  const loaded = useStore((s) => s.loaded);
  const requests = useStore((s) => s.requests);
  const masters = useStore((s) => s.masters);
  const saveSnapshot = useStore((s) => s.saveRequestSnapshot);
  const auth = useStore((s) => s.auth);
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const currentProfileId = useOcrStore((s) => s.currentProfileId);
  const ocrProfile = getProfile(currentProfileId);

  const request = useMemo(
    () => requests.find((r) => r.requestId === requestId),
    [requests, requestId],
  );

  const isAssignedToMe = auth != null && request != null && request.assigneeUserId === auth.user.userId;
  const mode: Mode =
    request && (request.status === 'done' || (request.status === 'in_progress' && !isAssignedToMe))
      ? 'view'
      : 'edit';

  const [step, setStep] = useState<StepKey>('step1');
  const [draft, setDraft] = useState<RequestDraft | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);

  // Initialize draft once when request becomes available.
  useEffect(() => {
    if (request && draft === null) {
      setDraft(toDraft(request));
    }
  }, [request, draft]);

  // プロファイル切替時は編集バッファを破棄し step1 に戻す（design.md §追補）。
  // localStorage の承認済みスナップショットは破棄しない（§4.4）。
  useEffect(() => {
    console.info('FaxDetailClient: profile changed, reset draft + step', {
      requestId,
      currentProfileId,
    });
    setDraft(null);
    setStep('step1');
    setShowModal(false);
    // 次回 request 再参照時に再び draft が生成される
  }, [currentProfileId, requestId]);

  // If request not found after data is loaded, surface error.
  useEffect(() => {
    if (loaded && !request) {
      console.error('FaxDetailClient: unknown requestId', requestId);
      toast.error(`依頼が見つかりません: ${requestId}`);
      router.replace('/fax');
    }
  }, [loaded, request, requestId, router]);

  const currentN = useMemo<number>(() => {
    if (mode === 'view') return 5;
    if (showModal) return 4;
    if (step === 'step1') return 1;
    if (step === 'step2') return 2;
    if (step === 'step3') return 3;
    return 5;
  }, [mode, step, showModal]);

  if (!loaded || !request || !draft) {
    return (
      <AppShell>
        <div className="p-8" style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          読み込み中...
        </div>
      </AppShell>
    );
  }

  const diffs = diffRequest(
    request,
    draft,
    masters ? { customers: masters.customers, products: masters.products } : undefined,
  );

  const handleApprove = () => {
    console.info('FaxDetailClient.handleApprove', { requestId, diffs });
    const next = { ...applyDraft(request, draft), status: 'done' as const };
    saveSnapshot(next);
    setShowModal(false);
    setStep('step5');
    toast.success('承認しました');
  };

  // 承認完了画面（step5）は節目としてフルステッパー（Step4含む5段）で表示する。
  // 閲覧モード（done/他担当 in_progress）で Step1〜3 を辿る場合のみ Step4 を省いた簡略版。
  const stepDefs = mode === 'edit' || step === 'step5' ? EDIT_STEP_DEFS : VIEW_STEP_DEFS;

  return (
    <AppShell>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${RIGHT_PANEL_WIDTH}px 1fr`,
          height: 'calc(100vh - 60px)',
          minHeight: 0,
        }}
      >
        {/* Left: Step UI */}
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            background: 'var(--bg)',
            borderRight: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              padding: '14px 24px',
              paddingLeft: sidebarCollapsed ? 60 : 24,
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
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                style={{
                  padding: '1px 8px',
                  borderRadius: 999,
                  background: 'var(--bg-muted)',
                  border: '1px solid var(--border)',
                  fontSize: 11.5,
                  color: 'var(--text-subtle)',
                  whiteSpace: 'nowrap',
                }}
              >
                プロファイル: {ocrProfile.displayName}
              </span>
              <ProfileSelector compact />
              {request.status === 'in_progress' && auth && request.assigneeUserId !== auth.user.userId && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    const next = {
                      ...request,
                      assigneeUserId: auth.user.userId,
                      assigneeTeamId: auth.user.teamId,
                    };
                    saveSnapshot(next);
                    toast.success('担当を自分に変更しました');
                  }}
                >
                  自分が担当
                </button>
              )}
              {request.status === 'in_progress' && (
                <span className="text-[12.5px]" style={{ color: 'var(--text-subtle)' }}>
                  担当: {formatAssignee(request.assigneeUserId, request.assigneeTeamId, auth?.user.userId)}
                </span>
              )}
              <span className={STATUS_BADGE_CLASS[request.status]}>
                <span className="dot" />
                {STATUS_LABEL[request.status]}
              </span>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
            {mode === 'view' && step !== 'step5' && (
              <div style={{ marginBottom: 12 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: 'var(--bg-elev)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--text-muted)',
                    }}
                  />
                  閲覧モード
                </span>
              </div>
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  step === 'step3' && showAllFields ? 'minmax(0, 1fr)' : '116px minmax(0, 1fr)',
                gap: 14,
                alignItems: 'start',
                minWidth: 0,
              }}
            >
            {/* Vertical stepper (全項目表示時は非表示で明細領域を拡張) */}
            {!(step === 'step3' && showAllFields) && (
              <div className="stepper-v">
                {stepDefs.map((s, i) => {
                  const allDone = mode === 'view' && step === 'step5';
                  const isDone = allDone || s.n < currentN;
                  const isActive = !allDone && s.n === currentN;
                  return (
                    <Fragment key={s.n}>
                      <div
                        className={[
                          'step',
                          isActive ? 'active' : '',
                          isDone ? 'done' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <div className="circle">{isDone ? '✓' : s.n}</div>
                        <div className="label">{s.label}</div>
                      </div>
                      {i < stepDefs.length - 1 && (
                        <div className={`connector ${isDone ? 'done' : ''}`} />
                      )}
                    </Fragment>
                  );
                })}
              </div>
            )}

            {/* Step content */}
            <div style={{ minWidth: 0 }}>
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
                  showAllFields={showAllFields}
                  onShowAllFieldsChange={setShowAllFields}
                />
              )}
              {step === 'step5' && <Step5Complete />}
            </div>
            </div>
          </div>
        </section>

        {/* Right: PDF */}
        <section
          style={{
            minWidth: 0,
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
