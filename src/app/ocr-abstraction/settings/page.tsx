'use client';

// aidw-ocr-abstraction: 設定画面（T-A02）
// FR-M-6 / FR-M-7 / AC-M-6 / AC-M-7
//
// 画面構成:
//  - 上部: プロファイル切替セレクタ（ProfileSelector 共用部品）
//  - 中段: マスタ構造4ブロック（customer / deliveryLocation / product / price）
//          各ブロック: キー一覧表 + 代表値1件JSON
//  - 下段: OCR後データ構造（rawShape JSON + 正規化後 OcrEnvelope JSON の対比）

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useOcrStore } from '@/store/ocr-store';
import { getProfile } from '@/profiles';
import { validateEnvelope } from '@/lib/ocr/envelope';
import { ProfileSelector } from '../_components/ProfileSelector';

type MasterBlockKey = 'customer' | 'deliveryLocation' | 'product' | 'price';

const MASTER_BLOCK_LABEL: Record<MasterBlockKey, string> = {
  customer: '取引先 (customer)',
  deliveryLocation: '納品先 (deliveryLocation)',
  product: '商品 (product)',
  price: '価格 (price)',
};

function toArrayMaster(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') return [v];
  return [];
}

function extractKeys(sample: unknown): string[] {
  if (!sample || typeof sample !== 'object') return [];
  return Object.keys(sample as Record<string, unknown>);
}

export default function OcrAbstractionSettingsPage() {
  const currentProfileId = useOcrStore((s) => s.currentProfileId);
  const profile = getProfile(currentProfileId);

  const blocks: MasterBlockKey[] = ['customer', 'deliveryLocation', 'product', 'price'];

  const rawShape = profile.ocrSchema.rawShape;
  const firstSample = profile.ocrSamples[0];
  const envelope = firstSample ? profile.ocrSchema.toEnvelope(firstSample) : null;
  const validatedEnvelope = envelope
    ? validateEnvelope(envelope, `${profile.clientId}/settings`)
    : null;

  return (
    <AppShell>
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link href="/ocr-abstraction" className="btn btn-ghost btn-sm">
            <ChevronLeft className="size-3.5" /> 一覧へ戻る
          </Link>
          <ProfileSelector />
        </div>

        <div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              margin: '0 0 4px',
            }}
          >
            OCR抽象化 設定画面
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
            現在プロファイル: <strong>{profile.displayName}</strong> (
            <code>{profile.clientId}</code>)
          </p>
        </div>

        {/* マスタ構造可視化 */}
        <section className="flex flex-col" style={{ gap: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            マスタ構造（masterSchema）
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 12.5, margin: 0 }}>
            4ブロックそれぞれで (a) キー一覧 + (b) 代表値1件JSON を表示します。
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: 14,
            }}
          >
            {blocks.map((key) => {
              const items = toArrayMaster(profile.masterSchema[key]);
              const first = items[0];
              const keys = extractKeys(first);
              return (
                <div key={key} className="card card-pad">
                  <div style={{ marginBottom: 8 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                      {MASTER_BLOCK_LABEL[key]}
                    </h4>
                    <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 2 }}>
                      件数: {items.length} / 代表値はindex=0のもの
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div className="form-label" style={{ marginBottom: 4 }}>
                      (a) キー一覧
                    </div>
                    {keys.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
                        （キー取得不可）
                      </div>
                    ) : (
                      <div
                        className="flex flex-wrap gap-1"
                        style={{ fontSize: 11.5 }}
                      >
                        {keys.map((k) => (
                          <code
                            key={k}
                            style={{
                              background: 'var(--bg-muted)',
                              padding: '2px 7px',
                              borderRadius: 4,
                            }}
                          >
                            {k}
                          </code>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="form-label" style={{ marginBottom: 4 }}>
                      (b) 代表値1件 (JSON)
                    </div>
                    <pre
                      className="code"
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        margin: 0,
                        padding: 10,
                        background: 'var(--bg-muted)',
                        borderRadius: 6,
                        fontSize: 11.5,
                        maxHeight: 260,
                        overflow: 'auto',
                      }}
                    >
                      {first ? JSON.stringify(first, null, 2) : '(empty)'}
                    </pre>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* OCR後データ構造可視化 */}
        <section className="flex flex-col" style={{ gap: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            OCR後データ構造（rawShape → OcrEnvelope）
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 12.5, margin: 0 }}>
            左: プロファイル固有の rawShape。右: toEnvelope() による共通エンベロープ正規化後。
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: 14,
            }}
          >
            <div className="card card-pad">
              <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>
                rawShape（プロファイル固有）
              </h4>
              <div
                style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginBottom: 6 }}
              >
                ocrSchema.rawShape（サンプル先頭1件）
              </div>
              <pre
                className="code"
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                  padding: 10,
                  background: 'var(--bg-muted)',
                  borderRadius: 6,
                  fontSize: 11.5,
                  maxHeight: 360,
                  overflow: 'auto',
                }}
              >
                {JSON.stringify(rawShape, null, 2)}
              </pre>
            </div>

            <div className="card card-pad">
              <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>
                OcrEnvelope（共通エンベロープ）
              </h4>
              <div
                style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginBottom: 6 }}
              >
                toEnvelope(rawShape) の結果
              </div>
              <pre
                className="code"
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                  padding: 10,
                  background: 'var(--bg-muted)',
                  borderRadius: 6,
                  fontSize: 11.5,
                  maxHeight: 360,
                  overflow: 'auto',
                }}
              >
                {validatedEnvelope
                  ? JSON.stringify(validatedEnvelope, null, 2)
                  : '(envelope validation failed)'}
              </pre>
            </div>
          </div>
        </section>

        <div
          className="card card-pad"
          style={{ fontSize: 12, color: 'var(--text-subtle)' }}
        >
          この画面は可視化専用です。プロファイル切替のみ可能で、マスタ・OCR内容は変更できません。
        </div>
      </div>
    </AppShell>
  );
}
