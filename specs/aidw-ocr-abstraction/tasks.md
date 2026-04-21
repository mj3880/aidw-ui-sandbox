# tasks.md — aidw-ocr-abstraction

> **適用規約**: `wf-chain:ref-prototype-architecture`（YAGNI・テスト規約なし）
> **省略事項**: テスト実装タスク（ユニット/統合/E2E いずれも作成しない）・DI構築・エラー体系設計・マイグレーション・CI設定
> **動作確認**: 手動確認のみ（T-012）

---

## タスク一覧

| ID | 種別 | 優先度 | タスク | 依存 |
|----|------|--------|--------|------|
| T-001 | 型定義 | Must | `src/types/ocr.ts` で `OcrEnvelope` / `OcrItem` を定義 | — |
| T-002 | 型定義 | Must | `src/types/profile.ts` で `ClientProfile` 型を定義 | T-001 |
| T-003 | 共通IF | Must | `src/lib/ocr/lookup.ts` で `LookupResult<T>` / `LookupAdapter` を定義 | T-002 |
| T-004 | ロジック | Must | `src/lib/ocr/review-exclusion.ts` で `classify()` 実装（一意確定→excluded、それ以外→review） | T-001, T-002, T-003 |
| T-005 | ロジック | Must | `src/lib/ocr/envelope.ts` で最小スキーマ検証 + 正規化ヘルパ実装（`displayValue` 生成不能時は `'(不明)'` fallback） | T-001 |
| T-006 | データ | Must | `src/profiles/client-a/` 作成（masters.ts / ocr-samples.ts **ちょうど10件** / index.ts）。10件の種別内訳: `unique 8件 / multi 1件 / none 1件` | T-002, T-003 |
| T-007 | データ | Must | `src/profiles/client-b/` 作成（同上・業態差はダミーで構わない）。10件の種別内訳: `unique 8件 / multi 1件 / none 1件` | T-002, T-003 |
| T-008 | レジストリ | Must | `src/profiles/index.ts` でプロファイルレジストリ構築 | T-006, T-007 |
| T-009 | 状態 | Should | `src/store/ocr-store.ts` で Zustand store（currentProfileId のみ persist）。Must ルートは URLクエリ切替のみで成立するため本タスクは Should へ降格 | T-008 |
| T-010 | UI | Must | `src/app/ocr-abstraction/page.tsx` 実装（**URLクエリ `?profile={clientId}` 読取 + 一覧描画**、重点5項目サマリ。URLSearchParams から `currentProfileId` を初期化する処理を含む。セレクタ UI 新設は T-S01 に集約） | T-004, T-005, T-008 |
| T-011 | UI | Must | `src/app/ocr-abstraction/[requestId]/page.tsx` 実装（重点5項目詳細 + 要確認/確定分岐 + `none`/`multi` の「要人間確認」バッジ表示） | T-004, T-005, T-008 |
| T-012 | 確認 | Must | 手動動作確認（詳細は下記「T-012 手動確認詳細」参照） | T-010, T-011 |

### Should 追加分（Must 完了後に着手）

| ID | 種別 | 優先度 | タスク | 依存 |
|----|------|--------|--------|------|
| T-S01 | UI | Should | プロファイル切替セレクタUI の新設（`<select>` ベース。T-009 の Zustand store と合流して currentProfileId を保持・localStorage persist） | T-009, T-010 |
| T-S02 | UI | Should | 除外トレースの展開 UI（項目ごとに matchedKey / matchedValue を inline 表示） | T-011 |

---

## 依存関係図

```
T-001 ── T-002 ── T-003 ──┐
  │         │        │    │
  │         └────────┴────┼── T-004
  │                       │     │
  └── T-005 ──┬───────────┼─────┼──→ T-010
              │           │     │
              └───────────┼─────┼──→ T-011
                          │     │
  T-002, T-003 ── T-006 ──┤     │
  T-002, T-003 ── T-007 ──┤     │
                          │     │
                  T-008 ──┼─────┼──→ T-010, T-011
                          │     │
                          ├── T-010 ──┐
                          │           │
                  T-004 ──┴── T-011 ──┤
                                      │
                                    T-012

  T-S01 ← T-010 （Should: プロファイル切替セレクタUI新設）
  T-S02 ← T-011 （Should: 除外トレース展開UI）
  T-009 （Should: Zustand store。T-008 に依存し、T-S01 で利用）
```

依存表と完全整合:
- T-006, T-007 は T-002, T-003 に依存
- T-010 は T-004, T-005, T-008 に依存（T-005 の `toEnvelope` 正規化を UI 初期化で利用）
- T-011 は T-004, T-005, T-008 に依存（同上）
- T-012 は T-010, T-011 に依存
- T-009 は Should 降格により Must ルートから外れる（Must は URLクエリ切替のみ）

---

## MoSCoW マッピング（requirements.md との対応）

| タスク | 対応要件 |
|--------|---------|
| T-001 | FR-M-2 基盤（OcrEnvelope / OcrItem 型） |
| T-002 | FR-M-1 / FR-M-2 / FR-M-3 / FR-M-4 の基盤（ClientProfile 型が全Must機能要件の土台） |
| T-003 | FR-M-3 / FR-M-4 基盤（LookupAdapter 共通IF） |
| T-004 | FR-M-4（自動除外ロジック本体） |
| T-005 | FR-M-2 基盤（envelope 正規化、T-010/T-011 の UI 初期化で利用） |
| T-006, T-007 | FR-M-1（プロファイル2種） |
| T-008 | FR-M-1 / FR-M-3（プロファイルレジストリ）|
| T-009 | **Should**: FR-S-1 の基盤の一部。Must ルートは URLクエリ切替のみで成立するため store 不要。T-S01（セレクタUI）と合流 |
| T-010, T-011 | FR-M-5 / FR-M-4（UI反映）。URLクエリ `?profile=` 読取で FR-M-3 の Must 切替機構を実装 |
| T-S01 | FR-S-1（切替セレクタUI新設。T-009 の store と合流） |
| T-S02 | FR-S-2（除外トレース） |
| T-012 | AC-M-1〜AC-M-5 / AC-S-1, AC-S-2 の通し確認 |

---

## 省略事項の明記

本プロトタイプでは以下のタスクを**意図的に含めない**（`ref-prototype-architecture` 準拠）:

- ユニットテスト / 統合テスト / E2E テスト作成
- CI 設定・GitHub Actions
- エラー体系設計（Result<T> / typed throws）
- DI コンテナ構築
- バリデーションライブラリ導入（zod 等 — 最小検証はベタ書き）
- プロファイル動的ロード機構（Won't）
- 実 OCR / 実マスタ DB 連携（Won't）
- 認証・認可（Won't）
- a11y / i18n 厳密対応

これらが必要になるのは**製品化判断後**であり、その時点で `ref-ddd-architecture` に準拠した別WFで設計し直す。

---

## T-012 手動確認詳細

T-012 は以下の2段構成で実施する。

### (1) design.md「テスト計画」の4項目確認

`pnpm dev` でプロファイルA/B を切替えつつ、design.md「テスト計画」節の確認観点を実機で通す。

- プロファイル切替で一覧/詳細が新プロファイルのデータに切り替わる
- 重点5項目がすべて表示される
- 一意確定項目が「確定」バッジ + トレース展開で根拠が見える
- 該当なし/複数候補の項目が要確認として表示される

### (2) AC-M-5 検証（プロファイル追加容易性の実機検証）

ダミー `client-c` プロファイルを追加する手順で AC-M-5 を検証する。

1. `src/profiles/client-c/` を新設（`index.ts` + `masters.ts` + `ocr-samples.ts`）
2. `src/profiles/index.ts` レジストリに1行追加
3. **UI共通コード・`src/lib/ocr/*` を一切変更せずに** 一覧画面のプロファイル切替セレクタに `client-c` が出現することを確認
4. 切替後に `client-c` のダミーデータが一覧に表示されることを確認
5. 検証完了後、`client-c` 関連追加分を削除して原状復帰

この一連の操作が UI共通コード無改修で完結すれば AC-M-5 充足。

---

## 完了判定（AC ベース）

- **Must完了**: requirements.md §受入基準 の AC-M-1〜AC-M-5 が T-012 で**すべて Yes**
- **Should完了**: AC-S-1, AC-S-2 が T-012 で**すべて Yes**（T-S01 / T-S02 実装後）

Must完了のみで MVP は成立。金曜ヒアリング後、暫定値（requirements.md §暫定値と金曜ヒアリング持ち越し論点）の確定内容を反映する再タスク化は別途実施する。
