'use client';

import { useMemo } from 'react';
import { Check, ChevronLeft } from 'lucide-react';
import { SearchCombobox, type ComboboxOption } from '@/components/SearchCombobox';
import { useStore } from '@/store/store';
import { DELIVERY_LOCATIONS } from '@/lib/delivery-locations';
import type { Mode, RequestDraft } from './types';

interface Props {
  draft: RequestDraft;
  setDraft: (d: RequestDraft) => void;
  onBack: () => void;
  onNext: () => void;
  mode: Mode;
}

export function Step2DeliveryDest({ draft, setDraft, onBack, onNext, mode }: Props) {
  const masters = useStore((s) => s.masters);

  const options: ComboboxOption[] = useMemo(
    () => DELIVERY_LOCATIONS.map((name) => ({ value: name, label: name })),
    [],
  );

  const customer = masters?.customers.find((c) => c.customerId === draft.customerId);

  return (
    <div className="card card-pad">
      <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>納品先</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 12.5, margin: '0 0 16px' }}>
        OCRから抽出された納品先を確認してください。
      </p>

      <div
        style={{
          padding: 14,
          background: 'var(--bg-muted)',
          borderRadius: 'var(--r-sm)',
          marginBottom: 14,
        }}
      >
        <div style={{ color: 'var(--text-subtle)', fontSize: 12.5 }}>OCR抽出</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{draft.deliveryLocation}</div>
      </div>

      <div>
        {customer && (
          <div
            style={{
              padding: '8px 12px',
              marginBottom: 8,
              background: 'var(--bg-muted)',
              borderRadius: 'var(--r-sm)',
              fontSize: 12.5,
            }}
          >
            <span style={{ color: 'var(--text-subtle)', marginRight: 8 }}>取引先</span>
            <span style={{ fontWeight: 600 }}>
              {customer.customerId} {customer.customerName}
            </span>
          </div>
        )}
        <label className="form-label">納品先を変更</label>
        <SearchCombobox
          value={draft.deliveryLocation}
          onChange={(v) => setDraft({ ...draft, deliveryLocation: v })}
          options={options}
          placeholder="納品先名で検索..."
          disabled={mode === 'view'}
        />
      </div>

      {mode === 'edit' && (
        <div className="flex gap-2.5" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-primary" onClick={onNext}>
            <Check className="size-3.5" /> OK（次へ）
          </button>
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            <ChevronLeft className="size-3.5" /> 戻る
          </button>
        </div>
      )}
    </div>
  );
}
