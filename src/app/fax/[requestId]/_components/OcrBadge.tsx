'use client';

// aidw-ocr-abstraction: /fax/[requestId] 内の OCR lookup バッジ表示
// T-A05 / T-A06: none/multi/unique すべて編集可能にした上で、
// バッジのみ「確定」「要人間確認」を残す。

import type { FieldBadge } from '@/lib/ocr/fax-review';

export function OcrBadge({ badge }: { badge: FieldBadge }) {
  if (badge.kind === 'unknown') return null;
  const style: React.CSSProperties =
    badge.kind === 'excluded'
      ? {
          background: 'var(--ok-bg, #e6f6ef)',
          color: 'var(--ok-text, #137350)',
        }
      : {
          background: 'var(--warn-bg, #fff6e0)',
          color: 'var(--warn-text, #8a5a00)',
        };

  return (
    <span
      title={badge.detail}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {badge.label}
    </span>
  );
}
