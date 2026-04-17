'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import { SearchCombobox, type ComboboxOption } from '@/components/SearchCombobox';
import { PriceDiffBadge } from '@/components/PriceDiffBadge';
import { resolveProductCandidates } from '@/lib/product-mapping-resolver';
import { computeExpectedPrice, classifyDiff } from '@/lib/price-calculator';
import { cn, formatYen } from '@/lib/utils';
import type { Mode, RequestDraft } from './types';
import type { LineItem } from '@/types/request';

interface Props {
  draft: RequestDraft;
  setDraft: (d: RequestDraft) => void;
  onBack: () => void;
  onConfirm: () => void;
  mode: Mode;
}

const ALL_FIELD_LABELS = [
  '得意先',
  'パターン',
  '売上日付',
  '輸出区分',
  '受注日付',
  '検索日付',
  '課',
  '新規取引コード',
  '納品区分',
  '売上種類',
  '課税区分',
  '開発ルート',
];

export function Step3LineItems({ draft, setDraft, onBack, onConfirm, mode }: Props) {
  const [showAll, setShowAll] = useState(false);

  const visibleItems = useMemo(() => {
    if (showAll) return draft.lineItems;
    const lows = draft.lineItems.filter((li) => li.isLowConfidence);
    return lows.length > 0 ? lows : draft.lineItems;
  }, [draft.lineItems, showAll]);

  const updateItem = (lineItemId: string, patch: Partial<LineItem>) => {
    setDraft({
      ...draft,
      lineItems: draft.lineItems.map((li) =>
        li.lineItemId === lineItemId ? { ...li, ...patch } : li,
      ),
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Step 3: 明細の確認</h2>
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          ← Step2に戻る
        </button>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {showAll
            ? `全 ${draft.lineItems.length} 件の明細を表示中（低信頼度行は黄色背景）`
            : `OCR信頼度が低い明細のみ表示中（${visibleItems.length} / ${draft.lineItems.length} 件）`}
        </p>
        <label className="inline-flex items-center gap-2 text-xs text-slate-700 select-none">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="size-4"
          />
          全項目表示（12項目展開）
        </label>
      </div>

      <ul className="space-y-2">
        {visibleItems.map((li, idx) => (
          <LineItemRow
            key={li.lineItemId}
            item={li}
            customerId={draft.customerId}
            mode={mode}
            showAllFields={showAll}
            onUpdate={(patch) => updateItem(li.lineItemId, patch)}
            indexLabel={`#${idx + 1}`}
          />
        ))}
      </ul>

      {mode === 'edit' && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700"
          >
            すべて確認 / モーダルへ
          </button>
        </div>
      )}
    </div>
  );
}

interface LineItemRowProps {
  item: LineItem;
  customerId: string;
  mode: Mode;
  showAllFields: boolean;
  onUpdate: (patch: Partial<LineItem>) => void;
  indexLabel: string;
}

function LineItemRow({
  item,
  customerId,
  mode,
  showAllFields,
  onUpdate,
  indexLabel,
}: LineItemRowProps) {
  const masters = useStore((s) => s.masters);
  const [productQuery, setProductQuery] = useState('');

  const expected = useMemo(() => {
    if (!masters) return null;
    return computeExpectedPrice(
      customerId,
      item.productCode,
      masters.customerPrices,
      masters.defaultPrices,
    );
  }, [customerId, item.productCode, masters]);

  const diffLevel = expected ? classifyDiff(item.unitPrice, expected.expectedPrice) : 'unknown';

  const productOptions: ComboboxOption[] = useMemo(() => {
    if (!masters) return [];
    const ranked = resolveProductCandidates(
      productQuery,
      customerId,
      masters.products,
      masters.productMappings,
      50,
    );
    return ranked.map(({ product, source }) => ({
      value: product.productCode,
      label: product.productName,
      sublabel: `${product.productCode} / ${product.origin || '-'}`,
      badge:
        source === 'customer-manual' || source === 'customer-auto'
          ? '取引先別'
          : source === 'generic-manual' || source === 'generic-auto'
          ? '汎用'
          : undefined,
    }));
  }, [productQuery, customerId, masters]);

  return (
    <li
      className={cn(
        'rounded-md border bg-white p-3 space-y-2',
        item.isLowConfidence
          ? 'bg-yellow-50 border border-slate-200 border-l-4 border-l-yellow-500'
          : 'border-slate-200',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-500">{indexLabel}</div>
        {item.isLowConfidence && (
          <span className="inline-flex items-center rounded bg-yellow-200 text-yellow-900 text-[10px] font-semibold px-1.5 py-0.5">
            低信頼度
          </span>
        )}
      </div>

      <div className="grid grid-cols-12 gap-2 items-start">
        <div className="col-span-6">
          <label className="block text-[11px] text-slate-500 mb-0.5">商品</label>
          {showAllFields || mode === 'edit' ? (
            <SearchCombobox
              value={item.productCode}
              onChange={(v) =>
                onUpdate({
                  productCode: v,
                  productName:
                    masters?.products.find((p) => p.productCode === v)?.productName ??
                    item.productName,
                })
              }
              options={productOptions}
              placeholder="商品名 / コードで検索"
              disabled={mode === 'view'}
              onQueryChange={setProductQuery}
            />
          ) : (
            <div className="text-sm font-medium">
              {item.productName}
              <span className="ml-2 text-xs text-slate-400">({item.productCode})</span>
            </div>
          )}
        </div>
        <div className="col-span-2">
          <label className="block text-[11px] text-slate-500 mb-0.5">個数</label>
          <input
            type="number"
            value={item.quantity}
            disabled={mode === 'view'}
            onChange={(e) => onUpdate({ quantity: Number(e.target.value) || 0 })}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm text-right disabled:bg-slate-50"
          />
        </div>
        <div className="col-span-4">
          <label className="block text-[11px] text-slate-500 mb-0.5">単価</label>
          <input
            type="number"
            value={item.unitPrice}
            disabled={mode === 'view'}
            onChange={(e) => onUpdate({ unitPrice: Number(e.target.value) || 0 })}
            className={cn(
              'w-full rounded border px-2 py-1.5 text-sm text-right disabled:bg-slate-50',
              diffLevel === 'error' ? 'bg-red-50 border-red-300' : '',
              diffLevel === 'warning' ? 'bg-yellow-50 border-yellow-300' : '',
              diffLevel === 'ok' || diffLevel === 'unknown' ? 'border-slate-300' : '',
            )}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600">
        <div className="text-slate-500">
          小計: <span className="text-slate-900 font-semibold">{formatYen(item.unitPrice * item.quantity)}</span>
        </div>
        {expected && <PriceDiffBadge level={diffLevel} expected={expected} actual={item.unitPrice} />}
      </div>

      {showAllFields && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <div className="text-[11px] text-slate-400 mb-1">詳細12項目（読み取り専用）</div>
          <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[11px]">
            {ALL_FIELD_LABELS.map((label) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-700">-</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}
