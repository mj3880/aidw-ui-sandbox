// aidw-ocr-abstraction: プロファイルレジストリ（ビルド時import）
// 設計: specs/aidw-ocr-abstraction/design.md §プロファイル配置戦略
// 新規プロファイル追加は本ファイルに1行追加するだけで完結する（AC-M-5）

import type { ClientProfile } from '@/types/profile';
import { clientAProfile } from './client-a';
import { clientBProfile } from './client-b';

export const PROFILES = {
  'client-a': clientAProfile,
  'client-b': clientBProfile,
} as const satisfies Record<string, ClientProfile>;

export type ProfileId = keyof typeof PROFILES;

export const PROFILE_IDS = Object.keys(PROFILES) as ProfileId[];

export const DEFAULT_PROFILE_ID: ProfileId = 'client-a';

export function isProfileId(v: unknown): v is ProfileId {
  return typeof v === 'string' && v in PROFILES;
}

export function getProfile(id: ProfileId): ClientProfile {
  return PROFILES[id];
}
