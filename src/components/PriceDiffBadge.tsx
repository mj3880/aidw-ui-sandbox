'use client';

import type { DiffLevel, ExpectedPriceResult } from '@/lib/price-calculator';
import { cn } from '@/lib/utils';

interface Props {
  level: DiffLevel;
  expected: ExpectedPriceResult;
  actual: number;
}

export function PriceDiffBadge({ level, expected, actual }: Props) {
  if (expected.expectedPrice === null) {
    return <span className="text-subtle text-[11px]">期待単価不明</span>;
  }
  const diff = actual - expected.expectedPrice;
  const pct = ((diff / expected.expectedPrice) * 100).toFixed(1);

  const baseDescription = (() => {
    if (expected.mode === 'coefficient' && expected.coefficient !== null && expected.defaultPrice !== null) {
      return `デフォルト¥${expected.defaultPrice.toLocaleString()} × ${expected.coefficient} = ¥${expected.expectedPrice.toLocaleString()}`;
    }
    if (expected.mode === 'absolute') {
      return `取引先固定 ¥${expected.expectedPrice.toLocaleString()}`;
    }
    return `デフォルト ¥${expected.expectedPrice.toLocaleString()}`;
  })();

  const badgeStyle: React.CSSProperties = (() => {
    if (level === 'error') {
      return { background: 'var(--err-bg)', color: 'var(--err-text)' };
    }
    if (level === 'warning') {
      return { background: 'var(--warn-bg)', color: 'var(--warn-text)' };
    }
    if (level === 'ok') {
      return { background: 'var(--status-completed-bg)', color: 'var(--status-completed)' };
    }
    return { background: 'var(--bg-muted)', color: 'var(--text-muted)' };
  })();

  const sign = diff > 0 ? '+' : '';
  return (
    <div className="flex flex-col gap-0.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
      <span className="truncate">{baseDescription}</span>
      <span
        className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-semibold')}
        style={badgeStyle}
      >
        差分 {sign}¥{Math.abs(diff).toLocaleString()} ({sign}
        {pct}%)
      </span>
    </div>
  );
}
