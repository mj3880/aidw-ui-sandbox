'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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
    masters?.customers.find((c) => c.customerId === draft.customerId)?.customerName ?? draft.customerId;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Step 1: 取引先の確認</h2>
        <button
          type="button"
          onClick={() => router.push('/fax')}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          ← 一覧に戻る
        </button>
      </div>
      <p className="text-xs text-slate-500">
        OCRが抽出した取引先を確認してください。誤りがあれば検索から選び直せます。
      </p>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs text-slate-500">OCR抽出</div>
        <div className="text-base font-semibold text-slate-900">{selectedName}</div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">取引先を変更</label>
        <SearchCombobox
          value={draft.customerId}
          onChange={(v) => setDraft({ ...draft, customerId: v })}
          options={options}
          placeholder="取引先名で検索..."
          disabled={mode === 'view'}
        />
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
