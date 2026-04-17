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
    return <span className="text-xs text-slate-400">期待単価不明</span>;
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

  const badgeClass = cn(
    'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold',
    level === 'error' && 'bg-red-100 text-red-700',
    level === 'warning' && 'bg-yellow-100 text-yellow-800',
    level === 'ok' && 'bg-emerald-100 text-emerald-700',
    level === 'unknown' && 'bg-slate-100 text-slate-600',
  );

  const sign = diff > 0 ? '+' : '';
  return (
    <div className="flex flex-col text-xs text-slate-600">
      <span className="truncate">{baseDescription}</span>
      <span className={badgeClass}>
        差分 {sign}¥{Math.abs(diff).toLocaleString()} ({sign}
        {pct}%)
      </span>
    </div>
  );
}
