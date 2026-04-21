'use client';

import { useMemo } from 'react';
import { Check, ChevronLeft } from 'lucide-react';
import { SearchCombobox, type ComboboxOption } from '@/components/SearchCombobox';
import { useOcrStore } from '@/store/ocr-store';
import { getProfile } from '@/profiles';
import { classifyDeliveryLocation } from '@/lib/ocr/fax-review';
import { OcrBadge } from './OcrBadge';
import type { Mode, RequestDraft } from './types';

interface Props {
  draft: RequestDraft;
  setDraft: (d: RequestDraft) => void;
  onBack: () => void;
  onNext: () => void;
  mode: Mode;
}

/**
 * プロファイル masterSchema.deliveryLocation → ComboboxOption
 * - client-a: { code, name }
 * - client-b: { warehouse_id, display }
 * 納品先の value は「表示名」で統一（既存 RequestDraft.deliveryLocation が文字列のため互換）
 */
function toDeliveryOptions(master: unknown): ComboboxOption[] {
  if (!Array.isArray(master)) return [];
  return master.map((entry): ComboboxOption => {
    if (entry && typeof entry === 'object') {
      const rec = entry as Record<string, unknown>;
      const name =
        typeof rec.name === 'string'
          ? rec.name
          : typeof rec.display === 'string'
            ? rec.display
            : typeof rec.label === 'string'
              ? rec.label
              : '(名称未取得)';
      const code =
        typeof rec.code === 'string'
          ? rec.code
          : typeof rec.warehouse_id === 'string'
            ? rec.warehouse_id
            : '';
      return {
        value: name,
        label: name,
        sublabel: code || undefined,
      };
    }
    return { value: String(entry), label: String(entry) };
  });
}

export function Step2DeliveryDest({ draft, setDraft, onBack, onNext, mode }: Props) {
  const currentProfileId = useOcrStore((s) => s.currentProfileId);
  const profile = getProfile(currentProfileId);

  const options = useMemo(
    () => toDeliveryOptions(profile.masterSchema.deliveryLocation),
    [profile.masterSchema.deliveryLocation],
  );

  // 選択中の納品先が候補に存在しない場合 → (不明) 表示 + warn
  const exists = options.some((o) => o.value === draft.deliveryLocation);
  if (!exists && draft.deliveryLocation && typeof window !== 'undefined') {
    console.warn(
      '[Step2DeliveryDest] current deliveryLocation not in profile masters',
      {
        profileId: profile.clientId,
        current: draft.deliveryLocation,
      },
    );
  }

  const badge = useMemo(
    () => classifyDeliveryLocation(profile, draft.deliveryLocation),
    [profile, draft.deliveryLocation],
  );

  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>納品先</h3>
        <OcrBadge badge={badge} />
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 12.5, margin: '0 0 16px' }}>
        OCRから抽出された納品先を確認してください。
      </p>
      <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginBottom: 10 }}>
        候補ソース: プロファイル <strong>{profile.displayName}</strong> の
        masterSchema.deliveryLocation
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
        <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>
          {exists ? draft.deliveryLocation : `${draft.deliveryLocation || '-'} (不明)`}
        </div>
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
