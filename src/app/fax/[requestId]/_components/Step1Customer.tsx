'use client';

import { useMemo } from 'react';
import { Check } from 'lucide-react';
import { SearchCombobox, type ComboboxOption } from '@/components/SearchCombobox';
import { useOcrStore } from '@/store/ocr-store';
import { getProfile } from '@/profiles';
import { classifyCustomer } from '@/lib/ocr/fax-review';
import { OcrBadge } from './OcrBadge';
import type { Mode, RequestDraft } from './types';

interface Props {
  draft: RequestDraft;
  setDraft: (d: RequestDraft) => void;
  onNext: () => void;
  mode: Mode;
}

/**
 * プロファイル masterSchema.customer から ComboboxOption を生成する。
 * - client-a: ClientACustomer { id, name, tel }
 * - client-b: ClientBAccount { account_no, label, region }
 * 共通の識別キー・表示ラベルを検出する最小ロジック。
 */
function toCustomerOptions(master: unknown): ComboboxOption[] {
  if (!Array.isArray(master)) return [];
  return master.map((entry): ComboboxOption => {
    if (entry && typeof entry === 'object') {
      const rec = entry as Record<string, unknown>;
      const id =
        typeof rec.id === 'string'
          ? rec.id
          : typeof rec.account_no === 'string'
            ? rec.account_no
            : typeof rec.customerId === 'string'
              ? rec.customerId
              : String(rec.id ?? rec.account_no ?? '(unknown)');
      const label =
        typeof rec.name === 'string'
          ? rec.name
          : typeof rec.label === 'string'
            ? rec.label
            : typeof rec.customerName === 'string'
              ? rec.customerName
              : id;
      const sublabelParts: string[] = [id];
      if (typeof rec.tel === 'string' && rec.tel.length > 0) sublabelParts.push(rec.tel);
      if (typeof rec.region === 'string' && rec.region.length > 0) sublabelParts.push(rec.region);
      return {
        value: id,
        label,
        sublabel: sublabelParts.join(' / '),
      };
    }
    return { value: String(entry), label: String(entry) };
  });
}

export function Step1Customer({ draft, setDraft, onNext, mode }: Props) {
  const currentProfileId = useOcrStore((s) => s.currentProfileId);
  const profile = getProfile(currentProfileId);

  const options = useMemo(
    () => toCustomerOptions(profile.masterSchema.customer),
    [profile.masterSchema.customer],
  );

  const selected = options.find((o) => o.value === draft.customerId);
  const selectedName = selected?.label ?? '(不明)';
  const badge = useMemo(
    () => classifyCustomer(profile, draft.customerId, selectedName),
    [profile, draft.customerId, selectedName],
  );

  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>取引先</h3>
        <OcrBadge badge={badge} />
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 12.5, margin: '0 0 16px' }}>
        OCRから抽出された取引先を確認してください。誤りがあれば検索から選び直せます。
      </p>
      <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginBottom: 10 }}>
        候補ソース: プロファイル <strong>{profile.displayName}</strong> の masterSchema.customer
      </div>

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
