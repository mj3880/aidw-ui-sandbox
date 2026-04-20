'use client';

import { useMemo } from 'react';
import { Check } from 'lucide-react';
import { SearchCombobox, type ComboboxOption } from '@/components/SearchCombobox';
import { useStore } from '@/store/store';
import type { Mode, RequestDraft } from './types';

interface Props {
  draft: RequestDraft;
  setDraft: (d: RequestDraft) => void;
  onNext: () => void;
  mode: Mode;
}

export function Step1Customer({ draft, setDraft, onNext, mode }: Props) {
  const masters = useStore((s) => s.masters);

  const options: ComboboxOption[] = useMemo(() => {
    if (!masters) return [];
    return masters.customers.map((c) => ({
      value: c.customerId,
      label: c.customerName,
      sublabel: `${c.customerId} / 仕入先コード ${c.buyerCode}`,
    }));
  }, [masters]);

  const selectedName =
    masters?.customers.find((c) => c.customerId === draft.customerId)?.customerName ??
    draft.customerId;

  return (
    <div className="card card-pad">
      <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>取引先</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 12.5, margin: '0 0 16px' }}>
        OCRから抽出された取引先を確認してください。誤りがあれば検索から選び直せます。
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
        <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{selectedName}</div>
        <div className="code" style={{ marginTop: 2 }}>
          ID: {draft.customerId}
        </div>
      </div>

      <div>
        <label className="form-label">取引先を変更</label>
        <SearchCombobox
          value={draft.customerId}
          onChange={(v) => setDraft({ ...draft, customerId: v })}
          options={options}
          placeholder="取引先名・IDで部分一致検索"
          disabled={mode === 'view'}
        />
      </div>

      {mode === 'edit' && (
        <div className="flex gap-2.5" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-primary" onClick={onNext}>
            <Check className="size-3.5" /> OK（次へ）
          </button>
        </div>
      )}
    </div>
  );
}
