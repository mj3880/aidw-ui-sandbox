'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '@/store/store';
import { SearchCombobox, type ComboboxOption } from '@/components/SearchCombobox';
import { PriceDiffBadge } from '@/components/PriceDiffBadge';
import { resolveProductCandidates } from '@/lib/product-mapping-resolver';
import { computeExpectedPrice, classifyDiff, type DiffLevel } from '@/lib/price-calculator';
import { formatYen } from '@/lib/utils';
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

  const lowCount = useMemo(
    () => draft.lineItems.filter((li) => li.isLowConfidence).length,
    [draft.lineItems],
  );

  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 600 }}>明細の確認</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 12.5, margin: 0 }}>
            {showAll
              ? `全 ${draft.lineItems.length} 件`
              : `低信頼度 ${lowCount} 件 / 全 ${draft.lineItems.length} 件`}
          </p>
        </div>
        <label
          className="flex items-center gap-2 select-none cursor-pointer"
          style={{ fontSize: 12.5 }}
        >
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />
          全項目表示
        </label>
      </div>

      {visibleItems.length === 0 ? (
        <div className="empty" style={{ padding: '32px 20px' }}>
          <h3>明細はありません</h3>
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: 10 }}>
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
        </div>
      )}

      <div className="flex gap-2.5" style={{ marginTop: 18 }}>
        {mode === 'edit' && (
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            変更内容を確認 <ChevronRight className="size-3.5" />
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
          <ChevronLeft className="size-3.5" /> Step2へ戻る
        </button>
      </div>
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

  const diffLevel: DiffLevel = expected
    ? classifyDiff(item.unitPrice, expected.expectedPrice)
    : 'unknown';

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

  // 低信頼度行の枠装飾 (warn-style: bg)
  const lowConfidenceStyle: React.CSSProperties = item.isLowConfidence
    ? {
        borderLeft: '3px solid var(--warn-border)',
        background: 'var(--warn-bg-soft)',
      }
    : {};

  // 単価欄の背景（warn-style: bg）
  const priceInputStyle: React.CSSProperties = (() => {
    if (diffLevel === 'error') {
      return { background: 'var(--err-bg-soft)', borderColor: 'var(--err-border)' };
    }
    if (diffLevel === 'warning') {
      return { background: 'var(--warn-bg-soft)', borderColor: 'var(--warn-border)' };
    }
    return {};
  })();

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)',
        padding: 14,
        background: 'var(--bg-elev)',
        ...lowConfidenceStyle,
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <div className="flex items-center gap-2.5">
          <span className="code">{indexLabel}</span>
          {item.isLowConfidence && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: 'var(--warn-text)',
                background: 'var(--warn-bg)',
                padding: '2px 7px',
                borderRadius: 999,
              }}
            >
              低信頼度
            </span>
          )}
        </div>
      </div>

      {/* Product */}
      <div style={{ marginBottom: 10 }}>
        <div className="form-label" style={{ marginBottom: 4 }}>
          商品コード・商品名
        </div>
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
          placeholder="商品名・コードで部分一致検索"
          disabled={mode === 'view'}
          onQueryChange={setProductQuery}
        />
      </div>

      {/* Qty + Price */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        <div>
          <div className="form-label">個数</div>
          <input
            className="input"
            type="number"
            value={item.quantity}
            disabled={mode === 'view'}
            onChange={(e) => onUpdate({ quantity: Number(e.target.value) || 0 })}
            style={{ textAlign: 'right' }}
          />
        </div>
        <div>
          <div className="form-label">単価（円）</div>
          <input
            className="input"
            type="number"
            value={item.unitPrice}
            disabled={mode === 'view'}
            onChange={(e) => onUpdate({ unitPrice: Number(e.target.value) || 0 })}
            style={{ textAlign: 'right', ...priceInputStyle }}
          />
        </div>
      </div>

      {/* Subtotal (+ expected price indicator when available) */}
      <div
        className="flex items-center justify-between"
        style={{
          marginTop: 10,
          padding: '8px 12px',
          background: 'var(--bg-muted)',
          borderRadius: 'var(--r-sm)',
          fontSize: 12.5,
        }}
      >
        <div style={{ color: 'var(--text-muted)' }}>
          小計:{' '}
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>
            {formatYen(item.unitPrice * item.quantity)}
          </span>
        </div>
        {expected && expected.expectedPrice !== null && (
          <PriceDiffBadge level={diffLevel} expected={expected} actual={item.unitPrice} />
        )}
      </div>

      {/* All fields */}
      {showAllFields && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 6 }}>
            詳細12項目（読み取り専用）
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '4px 12px',
              fontSize: 11.5,
            }}
          >
            {ALL_FIELD_LABELS.map((label) => (
              <div key={label} className="flex justify-between">
                <span style={{ color: 'var(--text-subtle)' }}>{label}</span>
                <span style={{ color: 'var(--text-muted)' }}>-</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
