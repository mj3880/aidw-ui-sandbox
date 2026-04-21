'use client';

// aidw-ocr-abstraction: 詳細画面
// T-011: 重点5項目詳細 + 要確認/確定分岐 + none/multi の「要人間確認」バッジ表示
// T-S02: 除外トレース展開 UI（matchedKey / matchedValue を inline 表示）
// 備考: /ocr-abstraction/* は既存 MVP 既定挙動（表示のみ・編集不可）を維持する（design.md §追補）

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useOcrStore } from '@/store/ocr-store';
import { getProfile } from '@/profiles';
import { validateEnvelope } from '@/lib/ocr/envelope';
import { classify, type ReviewDecision } from '@/lib/ocr/review-exclusion';
import type { FocusFieldKey } from '@/types/ocr';
import type { LookupResult } from '@/lib/ocr/lookup';
import { ProfileSelector } from '../_components/ProfileSelector';

const FOCUS_ORDER: ReadonlyArray<FocusFieldKey> = [
  'customer',
  'deliveryLocation',
  'product',
  'quantity',
  'price',
];

const FOCUS_LABEL: Record<FocusFieldKey, string> = {
  customer: '取引先',
  deliveryLocation: '納品先',
  product: '商品',
  quantity: '個数',
  price: '価格',
};

export function OcrAbstractionDetailClient({ requestId }: { requestId: string }) {
  const router = useRouter();
  const currentProfileId = useOcrStore((s) => s.currentProfileId);
  const profile = getProfile(currentProfileId);

  const matched = useMemo(() => {
    for (const raw of profile.ocrSamples) {
      const env = profile.ocrSchema.toEnvelope(raw);
      const validated = validateEnvelope(env, `${profile.clientId}/detail`);
      if (!validated) continue;
      if (validated.meta.requestId === requestId) {
        return { envelope: validated, decisions: classify(validated, profile) };
      }
    }
    return null;
  }, [profile, requestId]);

  if (!matched) {
    return (
      <AppShell>
        <div style={{ padding: 28 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => router.push('/ocr-abstraction')}
            style={{ marginBottom: 14 }}
          >
            <ChevronLeft className="size-3.5" /> 一覧へ戻る
          </button>
          <div className="card card-pad">
            <h3 style={{ margin: 0, fontSize: 16 }}>依頼が見つかりません</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '6px 0 0' }}>
              現在のプロファイル <strong>{profile.displayName}</strong> に requestId{' '}
              <code>{requestId}</code> は存在しません。プロファイルを切替えて再度お試しください。
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  const { envelope, decisions } = matched;
  const decisionByKey = new Map<FocusFieldKey, ReviewDecision>();
  for (const d of decisions) decisionByKey.set(d.fieldKey, d);

  return (
    <AppShell>
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => router.push('/ocr-abstraction')}
          >
            <ChevronLeft className="size-3.5" /> 一覧へ戻る
          </button>
          <ProfileSelector />
        </div>

        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              margin: '0 0 4px',
            }}
          >
            確認詳細: {envelope.meta.requestId}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
            プロファイル: <strong>{profile.displayName}</strong> / 受信:{' '}
            {envelope.meta.receivedAt}
          </p>
        </div>

        <div className="card card-pad">
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>
            重点5項目（focusFields）
          </h3>
          <div className="flex flex-col" style={{ gap: 10 }}>
            {FOCUS_ORDER.map((key) => {
              const d = decisionByKey.get(key);
              if (!d) {
                return (
                  <FocusRow
                    key={key}
                    label={FOCUS_LABEL[key]}
                    value="(OCR抽出なし)"
                    badge="review"
                    badgeText="要人間確認"
                    reason={null}
                  />
                );
              }
              const { item, outcome } = d;
              const isExcluded = outcome.kind === 'excluded';
              const reason = outcome.reason;
              return (
                <FocusRow
                  key={key}
                  label={FOCUS_LABEL[key]}
                  value={item.displayValue}
                  badge={isExcluded ? 'excluded' : 'review'}
                  badgeText={
                    isExcluded
                      ? '確定'
                      : reason.kind === 'multi'
                        ? '要人間確認（複数候補）'
                        : reason.kind === 'none'
                          ? '要人間確認（該当なし）'
                          : '要人間確認'
                  }
                  reason={reason}
                />
              );
            })}
          </div>
        </div>

        <div className="card card-pad" style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
          ※ `/ocr-abstraction/*` は抽象レイヤー単体検証用の表示のみ画面。`none`/`multi` 項目は編集不可（design.md §UI設計 既定挙動）。
        </div>
      </div>
    </AppShell>
  );
}

interface FocusRowProps {
  label: string;
  value: string;
  badge: 'excluded' | 'review';
  badgeText: string;
  reason: LookupResult<unknown> | null;
}

function FocusRow({ label, value, badge, badgeText, reason }: FocusRowProps) {
  const [open, setOpen] = useState(false);
  const isExcluded = badge === 'excluded';
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)',
        padding: 12,
        background: isExcluded ? 'var(--bg-muted)' : 'var(--bg-elev)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{label}</div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginTop: 2,
              color: isExcluded ? 'var(--text-muted)' : 'var(--text)',
            }}
          >
            {value}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 10px',
              borderRadius: 999,
              background: isExcluded ? 'var(--ok-bg, #e6f6ef)' : 'var(--warn-bg, #fff6e0)',
              color: isExcluded ? 'var(--ok-text, #137350)' : 'var(--warn-text, #8a5a00)',
              whiteSpace: 'nowrap',
            }}
          >
            {badgeText}
          </span>
          {reason && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setOpen((v) => !v)}
              aria-label="トレース展開"
            >
              {open ? '閉じる' : '詳細'}
            </button>
          )}
        </div>
      </div>

      {open && reason && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div>
            <span style={{ color: 'var(--text-subtle)' }}>結果:</span>{' '}
            <code>{reason.kind}</code>
          </div>
          {reason.kind === 'unique' && (
            <>
              <div>
                <span style={{ color: 'var(--text-subtle)' }}>matchedKey:</span>{' '}
                <code>{reason.matchedKey}</code>
              </div>
              <div>
                <span style={{ color: 'var(--text-subtle)' }}>matchedValue:</span>{' '}
                <code>{reason.matchedValue}</code>
              </div>
              <div>
                <span style={{ color: 'var(--text-subtle)' }}>value:</span>
                <pre
                  className="code"
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: '4px 0 0',
                    padding: 8,
                    background: 'var(--bg-muted)',
                    borderRadius: 4,
                  }}
                >
                  {JSON.stringify(reason.value, null, 2)}
                </pre>
              </div>
            </>
          )}
          {reason.kind === 'multi' && (
            <div>
              <span style={{ color: 'var(--text-subtle)' }}>candidates:</span>
              <pre
                className="code"
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: '4px 0 0',
                  padding: 8,
                  background: 'var(--bg-muted)',
                  borderRadius: 4,
                }}
              >
                {JSON.stringify(reason.candidates, null, 2)}
              </pre>
            </div>
          )}
          {reason.kind === 'none' && (
            <div style={{ color: 'var(--text-subtle)' }}>
              マスタに該当なし（人手入力が必要）
            </div>
          )}
        </div>
      )}
    </div>
  );
}

