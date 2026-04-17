'use client';

import { useMemo } from 'react';
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
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Step 2: 納品先の確認</h2>
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          ← Step1に戻る
        </button>
      </div>
      <p className="text-xs text-slate-500">
        OCRが抽出した納品先を確認してください（暫定運用: customers.csv 流用）。
      </p>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs text-slate-500">OCR抽出</div>
        <div className="text-base font-semibold text-slate-900">{draft.deliveryLocation}</div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">納品先を変更</label>
        <SearchCombobox
          value={draft.deliveryLocation}
          onChange={(v) => setDraft({ ...draft, deliveryLocation: v })}
          options={options}
          placeholder="納品先名で検索..."
          disabled={mode === 'view'}
        />
        <p className="mt-1 text-[11px] text-slate-400">
          ※ 暫定: customers.csv の取引先名を「○○ 本店」形式で流用
        </p>
      </div>

      {mode === 'edit' && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onNext}
            className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700"
          >
            OK / 次へ
          </button>
        </div>
      )}
    </div>
  );
}
