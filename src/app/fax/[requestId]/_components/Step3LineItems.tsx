'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useOcrStore } from '@/store/ocr-store';
import { getProfile } from '@/profiles';
import { SearchCombobox, type ComboboxOption } from '@/components/SearchCombobox';
import { PriceDiffBadge } from '@/components/PriceDiffBadge';
import {
  classifyDiff,
  type DiffLevel,
  type ExpectedPriceResult,
} from '@/lib/price-calculator';
import { classifyProduct, classifyPrice } from '@/lib/ocr/fax-review';
import { formatYen } from '@/lib/utils';
import { OcrBadge } from './OcrBadge';
import type { Mode, RequestDraft } from './types';
import type { LineItem } from '@/types/request';
import type { ClientProfile } from '@/types/profile';

interface Props {
  draft: RequestDraft;
  setDraft: (d: RequestDraft) => void;
  onBack: () => void;
  onConfirm: () => void;
  mode: Mode;
  showAllFields: boolean;
  onShowAllFieldsChange: (v: boolean) => void;
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

/**
 * profile.resolveExpectedPrice（number | null）を PriceDiffBadge が期待する
 * ExpectedPriceResult 形へラップ。プロファイル抽象では契約単価は絶対値のみ扱うため
 * mode='absolute' 固定、coefficient=null とする。
 */
function expectedFromProfile(
  profile: ClientProfile,
  productCode: string,
): ExpectedPriceResult {
  const price = profile.resolveExpectedPrice(productCode);
  if (price === null) {
    return { mode: 'unknown', expectedPrice: null, defaultPrice: null, coefficient: null };
  }
  return {
    mode: 'absolute',
    expectedPrice: price,
    defaultPrice: price,
    coefficient: null,
  };
}

export function Step3LineItems({
  draft,
  setDraft,
  onBack,
  onConfirm,
  mode,
  showAllFields,
  onShowAllFieldsChange,
}: Props) {
  const currentProfileId = useOcrStore((s) => s.currentProfileId);
  const profile = getProfile(currentProfileId);
  const showAll = showAllFields;
  const setShowAll = onShowAllFieldsChange;

  const productOptions = useMemo(
    () => profile.masterToComboboxOptions('product'),
    [profile],
  );

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
    <div className="card card-pad" style={{ minWidth: 0 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 600 }}>明細の確認</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 12.5, margin: 0 }}>
            {showAll
              ? `全 ${draft.lineItems.length} 件`
              : `低信頼度 ${lowCount} 件 / 全 ${draft.lineItems.length} 件`}
          </p>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 4 }}>
            候補ソース: プロファイル <strong>{profile.displayName}</strong> の
            masterSchema.product + masterSchema.price
          </div>
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
          {visibleItems.map((li) => {
            const originalIdx = draft.lineItems.findIndex(
              (x) => x.lineItemId === li.lineItemId,
            );
            return (
              <LineItemRow
                key={li.lineItemId}
                item={li}
                profile={profile}
                mode={mode}
                showAllFields={showAll}
                productOptions={productOptions}
                onUpdate={(patch) => updateItem(li.lineItemId, patch)}
                indexLabel={`#${originalIdx + 1}`}
              />
            );
          })}
        </div>
      )}

      <div className="flex gap-2.5" style={{ marginTop: 18 }}>
        {mode === 'edit' && (
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            変更内容を確認 <ChevronRight className="size-3.5" />
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          <ChevronLeft className="size-3.5" /> 戻る
        </button>
      </div>
    </div>
  );
}

interface LineItemRowProps {
  item: LineItem;
  profile: ClientProfile;
  mode: Mode;
  showAllFields: boolean;
  productOptions: ComboboxOption[];
  onUpdate: (patch: Partial<LineItem>) => void;
  indexLabel: string;
}

function LineItemRow({
  item,
  profile,
  mode,
  showAllFields,
  productOptions,
  onUpdate,
  indexLabel,
}: LineItemRowProps) {
  const expected = useMemo(
    () => expectedFromProfile(profile, item.productCode),
    [profile, item.productCode],
  );

  const diffLevel: DiffLevel = classifyDiff(item.unitPrice, expected.expectedPrice);

  const productBadge = useMemo(
    () => classifyProduct(profile, item.productCode),
    [profile, item.productCode],
  );
  const priceBadge = useMemo(
    () => classifyPrice(profile, item.productCode, item.unitPrice),
    [profile, item.productCode, item.unitPrice],
  );

  // 低信頼度行の枠装飾
  const lowConfidenceStyle: React.CSSProperties = item.isLowConfidence
    ? {
        borderLeft: '3px solid var(--warn-border)',
        background: 'var(--warn-bg-soft)',
      }
    : {};

  const priceInputStyle: React.CSSProperties = (() => {
    if (diffLevel === 'error') {
      return { background: 'var(--err-bg-soft)', borderColor: 'var(--err-border)' };
    }
    if (diffLevel === 'warning') {
      return { background: 'var(--warn-bg-soft)', borderColor: 'var(--warn-border)' };
    }
    return {};
  })();

  // 現選択中商品が候補にない場合の補完
  const displayOptions: ComboboxOption[] = useMemo(() => {
    if (item.productCode && !productOptions.some((o) => o.value === item.productCode)) {
      return [
        {
          value: item.productCode,
          label: item.productName || item.productCode,
          sublabel: `${item.productCode} / (プロファイル外)`,
        },
        ...productOptions,
      ];
    }
    return productOptions;
  }, [productOptions, item.productCode, item.productName]);

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
        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
          <div className="form-label" style={{ marginBottom: 0 }}>
            商品コード・商品名
          </div>
          <OcrBadge badge={productBadge} />
        </div>
        <SearchCombobox
          value={item.productCode}
          onChange={(v) => {
            const nextName = displayOptions.find((o) => o.value === v)?.label ?? item.productName;
            const nextPrice = profile.resolveExpectedPrice(v) ?? item.unitPrice;
            onUpdate({
              productCode: v,
              productName: nextName,
              unitPrice: nextPrice,
            });
          }}
          options={displayOptions}
          placeholder="商品名・コードで部分一致検索"
          disabled={mode === 'view'}
        />
      </div>

      {/* Qty + Price */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
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
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <div className="form-label" style={{ marginBottom: 0 }}>単価（円）</div>
            <OcrBadge badge={priceBadge} />
          </div>
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
        {expected.expectedPrice !== null && (
          <PriceDiffBadge level={diffLevel} expected={expected} actual={item.unitPrice} />
        )}
      </div>

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
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)',
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
