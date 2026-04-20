'use client';

import { useMemo } from 'react';
import { Check, ChevronLeft } from 'lucide-react';
import { SearchCombobox, type ComboboxOption } from '@/components/SearchCombobox';
import { useStore } from '@/store/store';
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

  // Per requirements: customers.csv is reused as the delivery destination master.
  const options: ComboboxOption[] = useMemo(() => {
    if (!masters) return [];
    return masters.customers.map((c) => ({
      value: `${c.customerName} 本店`,
      label: `${c.customerName} 本店`,
      sublabel: `${c.tel}`,
    }));
  }, [masters]);

  return (
    <div className="card card-pad">
      <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>納品先</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 12.5, margin: '0 0 16px' }}>
        OCRから抽出された納品先を確認してください（暫定運用: customers.csv 流用）。
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
        <label className="form-label">納品先を変更</label>
        <SearchCombobox
          value={draft.deliveryLocation}
          onChange={(v) => setDraft({ ...draft, deliveryLocation: v })}
          options={options}
          placeholder="納品先名で検索..."
          disabled={mode === 'view'}
        />
        <p style={{ marginTop: 6, fontSize: 11, color: 'var(--text-subtle)' }}>
          ※ 暫定: customers.csv の取引先名を「○○ 本店」形式で流用
        </p>
      </div>

      {mode === 'edit' && (
        <div className="flex gap-2.5" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-primary" onClick={onNext}>
            <Check className="size-3.5" /> OK（次へ）
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
            <ChevronLeft className="size-3.5" /> Step1へ戻る
          </button>
        </div>
      )}
    </div>
  );
}
