'use client';

// aidw-ocr-abstraction: 一覧画面
// T-010: URLクエリ ?profile={clientId} 読取 + 一覧描画（重点5項目サマリ）
// T-S01: プロファイル切替セレクタ（ProfileSelector 共用部品）

import { Suspense, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { useOcrStore } from '@/store/ocr-store';
import { getProfile, isProfileId, PROFILES } from '@/profiles';
import { validateEnvelope } from '@/lib/ocr/envelope';
import { classify, type ReviewDecision } from '@/lib/ocr/review-exclusion';
import type { OcrEnvelope } from '@/types/ocr';
import { ProfileSelector } from './_components/ProfileSelector';

interface OcrRow {
  envelope: OcrEnvelope;
  decisions: ReviewDecision[];
}

function OcrAbstractionListInner() {
  const searchParams = useSearchParams();
  const currentProfileId = useOcrStore((s) => s.currentProfileId);
  const setProfileId = useOcrStore((s) => s.setProfileId);

  // URLクエリ ?profile= がある場合は store を上書き（初期化用）
  useEffect(() => {
    const q = searchParams?.get('profile');
    if (q && isProfileId(q) && q !== currentProfileId) {
      console.info('[ocr-abstraction/list] init profile from URL query', { q });
      setProfileId(q);
    }
  }, [searchParams, currentProfileId, setProfileId]);

  const profile = getProfile(currentProfileId);

  // OCR サンプルをエンベロープへ正規化 + 分類
  const rows = useMemo<OcrRow[]>(() => {
    const out: OcrRow[] = [];
    for (const raw of profile.ocrSamples) {
      const envelope = profile.ocrSchema.toEnvelope(raw);
      const validated = validateEnvelope(envelope, `${profile.clientId}/sample`);
      if (!validated) continue;
      out.push({ envelope: validated, decisions: classify(validated, profile) });
    }
    return out;
  }, [profile]);

  return (
    <AppShell>
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                margin: '0 0 4px',
              }}
            >
              OCR抽象化 検証画面（一覧）
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
              現在: <strong>{profile.displayName}</strong> / {rows.length}件
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ProfileSelector />
            <Link href="/ocr-abstraction/settings" className="btn btn-ghost btn-sm">
              設定画面
            </Link>
          </div>
        </div>

        <div
          className="card card-pad"
          style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5 }}
        >
          <div style={{ color: 'var(--text-muted)' }}>
            利用可能なプロファイル:{' '}
            {Object.values(PROFILES)
              .map((p) => `${p.clientId}（${p.displayName}）`)
              .join(' / ')}
          </div>
          <div style={{ color: 'var(--text-subtle)' }}>
            URLクエリ <code>?profile=client-a</code> / <code>?profile=client-b</code> で切替可
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="card">
            <div className="empty">
              <h3>サンプルデータがありません</h3>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: 'var(--density-gap)',
            }}
          >
            {rows.map(({ envelope, decisions }) => {
              const excluded = decisions.filter((d: ReviewDecision) => d.outcome.kind === 'excluded').length;
              const review = decisions.length - excluded;
              const customer = envelope.items.find((i) => i.fieldKey === 'customer');
              const product = envelope.items.find((i) => i.fieldKey === 'product');
              return (
                <Link
                  key={envelope.meta.requestId}
                  href={`/ocr-abstraction/${envelope.meta.requestId}`}
                  className="card card-pad"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                    <span className="code">{envelope.meta.requestId}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                      {envelope.meta.receivedAt}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    {customer?.displayValue ?? '(不明)'}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10 }}>
                    {product?.displayValue ?? '(不明)'}
                  </div>
                  <div className="flex items-center gap-2" style={{ fontSize: 12 }}>
                    <span
                      style={{
                        background: 'var(--ok-bg, #e6f6ef)',
                        color: 'var(--ok-text, #137350)',
                        padding: '2px 8px',
                        borderRadius: 999,
                      }}
                    >
                      確定 {excluded}
                    </span>
                    <span
                      style={{
                        background: 'var(--warn-bg, #fff6e0)',
                        color: 'var(--warn-text, #8a5a00)',
                        padding: '2px 8px',
                        borderRadius: 999,
                      }}
                    >
                      要確認 {review}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function OcrAbstractionListPage() {
  // useSearchParams は Suspense 境界内で使う必要がある（App Router のルール）
  return (
    <Suspense fallback={<AppShell><div style={{ padding: 28 }}>読み込み中...</div></AppShell>}>
      <OcrAbstractionListInner />
    </Suspense>
  );
}
