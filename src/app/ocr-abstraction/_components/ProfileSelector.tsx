'use client';

// aidw-ocr-abstraction: プロファイル切替セレクタ（共用部品）
// 用途: /ocr-abstraction（T-S01）/ /ocr-abstraction/settings（T-A02）/ /fax/*（T-A03 参照）

import { useOcrStore } from '@/store/ocr-store';
import { PROFILES, PROFILE_IDS, isProfileId } from '@/profiles';

interface Props {
  /** ラベルテキスト上書き用 */
  label?: string;
  /** 小型表示（ヘッダ向け） */
  compact?: boolean;
}

export function ProfileSelector({ label = 'プロファイル', compact = false }: Props) {
  const currentProfileId = useOcrStore((s) => s.currentProfileId);
  const setProfileId = useOcrStore((s) => s.setProfileId);

  return (
    <div
      className="flex items-center gap-2"
      style={{
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)',
        padding: compact ? '3px 8px' : '4px 10px',
        boxShadow: compact ? undefined : 'var(--shadow-sm)',
      }}
    >
      <label
        htmlFor="ocr-profile-selector"
        style={{ fontSize: 12, color: 'var(--text-muted)' }}
      >
        {label}
      </label>
      <select
        id="ocr-profile-selector"
        value={currentProfileId}
        onChange={(e) => {
          const v = e.target.value;
          if (isProfileId(v)) setProfileId(v);
        }}
        className="select"
        style={{
          width: 'auto',
          padding: '4px 6px',
          border: 'none',
          background: 'transparent',
          fontSize: compact ? 12.5 : 13,
        }}
      >
        {PROFILE_IDS.map((id) => (
          <option key={id} value={id}>
            {PROFILES[id].displayName}
          </option>
        ))}
      </select>
    </div>
  );
}
