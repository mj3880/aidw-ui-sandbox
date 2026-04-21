'use client';

// aidw-ocr-abstraction: OCR抽象化プロファイル切替用 Zustand store（本プロトタイプ専用）
// 設計: specs/aidw-ocr-abstraction/design.md §状態管理
// 既存 src/store/store.ts は改修せず、別 store として並行動作させる（/fax/* からも subscribe 可）

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_PROFILE_ID,
  isProfileId,
  type ProfileId,
} from '@/profiles';

interface OcrStoreState {
  currentProfileId: ProfileId;
  setProfileId: (id: ProfileId) => void;
}

export const useOcrStore = create<OcrStoreState>()(
  persist(
    (set) => ({
      currentProfileId: DEFAULT_PROFILE_ID,
      setProfileId: (id) => {
        if (!isProfileId(id)) {
          console.warn('[ocr-store] invalid profileId ignored', { id });
          return;
        }
        console.info('[ocr-store] setProfileId', { id });
        set({ currentProfileId: id });
      },
    }),
    {
      // 既存 aidw-ui-mock:store とキー衝突しないこと（CLAUDE.md §5 前提）
      name: 'aidw-ui-mock:ocr-profile',
      partialize: (state) => ({ currentProfileId: state.currentProfileId }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[ocr-store] rehydrate failed, clearing', error);
          try {
            window.localStorage.removeItem('aidw-ui-mock:ocr-profile');
          } catch {
            /* noop */
          }
          return;
        }
        // 不正な profileId が混入していた場合はデフォルトへ戻す
        if (state && !isProfileId(state.currentProfileId)) {
          console.warn('[ocr-store] unknown profileId in storage, fallback to default', {
            stored: state.currentProfileId,
          });
          state.currentProfileId = DEFAULT_PROFILE_ID;
        }
      },
    },
  ),
);
