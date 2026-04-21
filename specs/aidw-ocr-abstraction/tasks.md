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
| T-006 | データ | Must | `src/profiles/client-a/` 作成（masters.ts / ocr-samples.ts **ちょうど10件** / index.ts）。種別内訳: unique/multi/none 各1件以上・合計ちょうど10件（例: 8/1/1）。正本は requirements.md AC-M-1 | T-002, T-003 |
| T-007 | データ | Must | `src/profiles/client-b/` 作成（同上・業態差はダミーで構わない）。種別内訳: unique/multi/none 各1件以上・合計ちょうど10件（例: 8/1/1）。正本は requirements.md AC-M-1 | T-002, T-003 |
| T-008 | レジストリ | Must | `src/profiles/index.ts` でプロファイルレジストリ構築 | T-006, T-007 |
| T-009 | 状態 | Must（追補で Should→Must 昇格） | `src/store/ocr-store.ts` で Zustand store（currentProfileId のみ persist） | T-008 |
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

  T-S01 ← T-010, T-009 （Should: プロファイル切替セレクタUI新設。T-009 の Zustand store を利用）
  T-S02 ← T-011 （Should: 除外トレース展開UI）
  T-009 （Must: Zustand store。T-008 に依存し、T-A01 / T-S01 で利用）
```

依存表と完全整合:
- T-006, T-007 は T-002, T-003 に依存
- T-010 は T-004, T-005, T-008 に依存（T-005 の `toEnvelope` 正規化を UI 初期化で利用）
- T-011 は T-004, T-005, T-008 に依存（同上）
- T-012 は T-010, T-011 に依存

### T-009 の Must 昇格根拠（従来タスクブロック内で完結）

T-009 は当初 Should 想定だったが、本仕様（追補含む）では以下理由により **Must へ昇格**する:

- 追加スコープで `/fax/*` が ocr-store を subscribe するため、T-A01（store 共有化）の前提になる
- 従来 T-010/T-011 の Must ルートは URLクエリ切替で成立するが、`/fax/*` ヘッダ表示・Combobox差替・プロファイル連動には store が必須
- `/fax/*` 側が currentProfileId の single source of truth を参照する設計（FR-M-9）を成立させる土台
- T-S01 の切替セレクタUI も T-009 の Zustand store を利用するため、Should 着手時にも前提となる

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
| T-009 | **Must（追補で昇格）**: FR-M-9 基盤（currentProfileId の single source of truth 化）。T-A01 の前提。FR-S-1 の基盤も兼ねる |
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

Must完了のみで MVP は成立。金曜ヒアリング後、仮決定値（requirements.md §金曜ヒアリング持ち越し5論点の仮決定値）との差分反映は別途タスク化する。

---

# 追補: 追加スコープ3点のタスク

> **追補版である旨**: requirements.md §追加スコープ・design.md §追補 に対応するタスク追補。従来の T-001〜T-012 / T-S01〜T-S02 は維持し、追加タスクを T-A01〜 で採番する。
> **wf-prototype-impl 引き渡し範囲**: 従来タスク（T-001〜T-012 / T-S01〜T-S02）+ 本追補タスク（T-A01〜T-A07）をまとめて `/wf-chain:wf-prototype-impl` に引き渡す。

---

## 追加タスク一覧

### Must（追加スコープの MVP）

| ID | 種別 | 優先度 | タスク | 依存 |
|----|------|--------|--------|------|
| T-A01 | 状態（拡張） | Must | `src/store/ocr-store.ts` を `/fax/*` 側からも import 可にする。store 自体の変更は最小（既存 currentProfileId のみ）。`src/store/store.ts` は改修しない | T-009（本追補で Must 昇格済み）|
| T-A02 | UI（新設） | Must | `src/app/ocr-abstraction/settings/page.tsx` 実装: プロファイル切替セレクタ + マスタ構造可視化 + OCR後データ構造可視化（rawShape と OcrEnvelope の対比） | T-A01, T-008 |
| T-A03 | UI（既存改修） | Must | `/fax` 一覧・`/fax/[requestId]` のヘッダに現在プロファイル displayName を表示。ocr-store を subscribe | T-A01 |
| T-A04 | UI（既存改修） | Must | `/fax/[requestId]` の customer / deliveryLocation / product Combobox の候補ソース + price 参照元を現在プロファイル masters から差替 | T-A01, T-A03 |

### Should（追加スコープの上積み）

| ID | 種別 | 優先度 | タスク | 依存 |
|----|------|--------|--------|------|
| T-A05 | UI（既存改修） | Should | #4 仮決定値: `/fax/[requestId]` で `none`/`multi` 項目を編集可能フィールド化（既存編集UI流用、「要人間確認」バッジは残す） | T-A04 |
| T-A06 | UI（既存改修） | Should | #5 仮決定値: `/fax/[requestId]` で `unique` 項目も再確認・編集可化（「確定」バッジは残す） | T-A04 |
| T-A07 | 確認 | Should | 追加スコープ手動動作確認（AC-M-6〜AC-M-9 / AC-S-3〜AC-S-4）。詳細は下記「T-A07 手動確認詳細」 | T-A02, T-A03, T-A04, T-A05, T-A06 |

### T-009 の扱い（Should → Must 昇格）

§従来タスク「T-009 の Must 昇格根拠」参照。

---

## 追加タスク依存関係図

```
[従来 Must タスク T-001〜T-012 完了]
              ↓
  T-009（Must 昇格）── T-A01 ──┬── T-A02（設定画面UI）
                              │
                              ├── T-A03（/fax ヘッダ）
                              │        ↓
                              │   T-A04（/fax Combobox差替）
                              │        ↓
                              │   T-A05（/fax none/multi 編集UI）
                              │        ↓
                              │   T-A06（/fax unique 編集UI）
                              │        ↓
                              └── T-A07（手動確認）
```

---

## MoSCoW マッピング（追加分）

| タスク | 対応要件 |
|--------|---------|
| T-009（Must 昇格） | FR-M-9 基盤（currentProfileId の single source of truth 化）|
| T-A01 | FR-M-9（store 共有設計）|
| T-A02 | FR-M-6 / FR-M-7 / AC-M-6 / AC-M-7（設定画面UI）|
| T-A03 | FR-M-8 / FR-M-10（/fax ヘッダへのプロファイル反映）|
| T-A04 | FR-M-8（/fax Combobox への masters 差替）|
| T-A05 | FR-S-3 / AC-S-3（#4 仮決定値の /fax 反映）|
| T-A06 | FR-S-4 / AC-S-4（#5 仮決定値の /fax 反映）|
| T-A07 | AC-M-6〜AC-M-9 / AC-S-3〜AC-S-4 の通し確認 |

---

## T-A07 手動確認詳細

T-A07 は以下4段構成で実施する。

### (1) 設定画面UI確認（AC-M-6 / AC-M-7）

- `/ocr-abstraction/settings` にアクセス
- マスタ構造セクション4ブロック（customer / deliveryLocation / product / price）が表示される
- OCR後データ構造セクションで rawShape と OcrEnvelope の対比が視認できる
- セレクタで A→B 切替で両セクションが即時更新される

### (2) /fax/* へのプロファイル反映確認（AC-M-8）

- `/fax` 一覧ヘッダに現在プロファイル displayName が表示される
- `/fax/[requestId]` 詳細ヘッダにも同表示
- `/fax/[requestId]` の customer/product Combobox 候補が現在プロファイル masters に従う
- `/ocr-abstraction` or `/ocr-abstraction/settings` でプロファイル切替 → `/fax/*` 画面に戻ると新プロファイル反映

### (3) 併存動作確認（AC-M-9）

- `/fax/*` と `/ocr-abstraction/*` を別タブで同時に開く
- 片方でプロファイル切替 → もう片方のタブでリロード or 再描画すると同じプロファイルに切替わっている（localStorage persist 経由）
- 両ルート群が同時に動作することを確認

### (4) #4/#5 仮決定値反映確認（AC-S-3 / AC-S-4）

- `/fax/[requestId]` で `none` 項目が編集可能フィールドとして描画される（「要人間確認」バッジ併存）
- `/fax/[requestId]` で `multi` 項目が候補選択可能なUIで描画される
- `/fax/[requestId]` で `unique` 項目も再確認・編集可能（「確定」バッジ併存）

---

## 追加タスク実装時の不変条件（CLAUDE.md §3 準拠）

以下は本追補でも**絶対に触らない**:

- テストファイル全般（`*.test.*` / `*.spec.*` / `__tests__/` / `tests/`）の**作成禁止**（AC-005-2）
- `samples/` 配下の直接編集禁止（再生成は `scripts/generate-requests.mjs` 経由）
- `public/samples/` / `public/pdfjs/` 手動編集禁止（自動生成物）
- `node_modules/`

`src/app/fax/*` の改修時も、CLAUDE.md §4.1〜§4.6（PDF Worker / 動的ルート / 価格差分閾値 / 編集バッファ / localStorage override / 閲覧モード判定）の既存実装判断は尊重する。

---

## 追補版 完了判定（追加スコープ AC ベース）

- **追加 Must完了**: AC-M-6〜AC-M-9 が T-A07 で**すべて Yes**
- **追加 Should完了**: AC-S-3 / AC-S-4 が T-A07 で**すべて Yes**（T-A05 / T-A06 実装後）

従来 Must完了 + 追加 Must完了 の両方で MVP（追補版）は成立する。
