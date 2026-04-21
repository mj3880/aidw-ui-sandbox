# design.md — aidw-ocr-abstraction

> **適用規約**: `wf-chain:ref-prototype-architecture`（YAGNI・フラット・直接State・テスト規約なし）
> **併存方針**: 既存 `specs/aidw-ui-mock/` とはコード/ルート分離。相互参照・相互依存なし。
> **省略項目**: 非機能要件・ER図・シーケンス図・API詳細仕様・DB詳細スキーマ・マイグレーション・DI・エラー体系・テスト計画（プロトタイプ規約）

---

## アーキ方針

- Next.js App Router 上のフロント単体プロトタイプ（バックエンドなし）
- 状態管理: Zustand 単一 store（既存 aidw-ui-mock とは別 store を新規作成、store を共有しない）
- プロファイル選択状態のみ persist（localStorage）、OCR後データ・マスタはビルド時固定のダミー
- データはすべてダミー JSON/TS 定数。ロード時に共通エンベロープへ正規化
- **設計4本柱**: (1) ClientProfile 抽象 (2) プロファイル配置戦略 (3) マスタ lookup 共通IF (4) OCR後データ共通エンベロープ + 自動除外ロジック

### ディレクトリ構成（フラット・aidw-ui-mock と分離）

**命名衝突回避ルール**: 本feature追加のロジック群は既存 `src/lib/` 直下と衝突しないよう、**`src/lib/ocr/` 配下に集約**する（例: `src/lib/ocr/envelope.ts` / `src/lib/ocr/lookup.ts` / `src/lib/ocr/review-exclusion.ts`）。

```
src/
  app/
    ocr-abstraction/            # 本プロトタイプのルート
      page.tsx                  # プロファイル選択 or 一覧
      [requestId]/page.tsx      # 確認詳細
  profiles/
    index.ts                    # プロファイルレジストリ
    client-a/
      index.ts                  # ClientProfile 実装
      masters.ts                # ダミーマスタ
      ocr-samples.ts            # ダミーOCR結果10件
    client-b/
      index.ts
      masters.ts
      ocr-samples.ts
  lib/
    ocr/                        # 本feature専用のロジック集約
      envelope.ts               # 共通エンベロープ型 + 正規化
      lookup.ts                 # マスタ lookup 共通IF
      review-exclusion.ts       # 自動除外ロジック
  store/
    ocr-store.ts                # Zustand store（本プロトタイプ専用）
  types/
    ocr.ts                      # エンベロープ型・ReviewItem 型
    profile.ts                  # ClientProfile 型
```

既存 `src/app/*` `src/store/store.ts` `src/types/request.ts` 等の aidw-ui-mock 資産には**一切手を加えない**。

---

## ClientProfile 抽象（設計の核）

### 型（擬似シグネチャ）

```ts
// src/types/profile.ts
export type ClientProfile = {
  clientId: string;
  displayName: string;

  // 1. マスタスキーマ（プロファイル固有構造）
  masterSchema: {
    customer: unknown;          // unknown で受けて各プロファイル側で narrowing
    deliveryLocation: unknown;
    product: unknown;
    price: unknown;
  };

  // 2. OCR後データスキーマ
  ocrSchema: {
    rawShape: unknown;          // プロファイル固有の OCR 出力形
    toEnvelope: (raw: unknown) => OcrEnvelope;  // 共通エンベロープへの正規化
  };

  // 3. レビュールール
  reviewRules: {
    focusFields: ReadonlyArray<'customer' | 'deliveryLocation' | 'product' | 'quantity' | 'price'>;
    excludeWhenUnique: boolean;  // MVP: 常に true
  };

  // 4. マスタ lookup 共通IF 実装
  lookup: LookupAdapter;
};
```

### プロファイル配置戦略

- **ビルド時 import のみ**（動的ロード不要・Won't）
- `src/profiles/index.ts` で静的レジストリを構築

```ts
// src/profiles/index.ts
import { clientAProfile } from './client-a';
import { clientBProfile } from './client-b';

export const PROFILES = {
  'client-a': clientAProfile,
  'client-b': clientBProfile,
} as const;

export type ProfileId = keyof typeof PROFILES;
```

新規プロファイル追加時は `src/profiles/{id}/` 配下にファイル一式新設 + 上記レジストリに1行追加するだけ（AC-M-5 充足）。

---

## マスタ lookup 共通IF

```ts
// src/lib/ocr/lookup.ts
export type LookupResult<T> =
  | { kind: 'unique'; value: T; matchedKey: string; matchedValue: string }
  | { kind: 'multi'; candidates: T[] }
  | { kind: 'none' };

export type LookupAdapter = {
  customer: (ocrField: unknown) => LookupResult<unknown>;
  deliveryLocation: (ocrField: unknown) => LookupResult<unknown>;
  product: (ocrField: unknown) => LookupResult<unknown>;
  price: (product: unknown, context: unknown) => LookupResult<unknown>;
};
```

- 各プロファイルが `customer` 〜 `price` の4メソッドを実装
- MVPでは文字列部分一致・ID完全一致等の素朴な実装で十分（プロトタイプ規約）
- `unique` のときのみ自動除外対象（自動除外ロジック節参照）

---

## OCR後データ共通エンベロープ

```ts
// src/types/ocr.ts
export type OcrEnvelope = {
  meta: {
    requestId: string;
    receivedAt: string;        // ISO8601
    clientId: string;
  };
  items: OcrItem[];
};

export type OcrItem = {
  fieldKey: 'customer' | 'deliveryLocation' | 'product' | 'quantity' | 'price' | string;
  rawValue: unknown;           // プロファイル固有の生値
  displayValue: string;        // UI表示用
};
```

- プロファイルの `ocrSchema.toEnvelope(raw)` が唯一の正規化経路
- **`displayValue` 生成責務**: `displayValue: string` は `toEnvelope()` 内で必ず生成する。生成不能時（rawValue が null/undefined 等で文字列化できない場合）は `'(不明)'` を fallback 値として設定する。UI側で再計算・補完しない
- ロード時に `meta.requestId` 必須・`items` が配列であること等の**最小限のスキーマ検証**（AC-M-3）。失敗時はコンソール警告 + そのレコードをスキップ

---

## 自動除外ロジック

```ts
// src/lib/ocr/review-exclusion.ts
type ReviewDecision = {
  item: OcrItem;
  outcome:
    | { kind: 'excluded'; reason: LookupResult<unknown> }   // 一意確定で確認フロー除外
    | { kind: 'review'; reason: LookupResult<unknown> };    // 要人間確認
};

export function classify(
  envelope: OcrEnvelope,
  profile: ClientProfile
): ReviewDecision[] {
  // focusFields に含まれる項目のみ対象
  // profile.lookup.{field} を呼び、kind === 'unique' → excluded, それ以外 → review
  // focusFields 外は現状スコープ外（MVP）
}
```

- **除外トレース（FR-S-2）**: `excluded` 側の `reason` を UI で展開表示し、`matchedKey / matchedValue` を見せる
- 昇格ロジック（確定不能項目をどう扱うか）は金曜ヒアリング持ち越し（requirements.md 暫定値と金曜ヒアリング持ち越し論点 #4）

#### lookup エッジケース挙動

- `quantity` は LookupAdapter 非対応のため常に `review` 扱いで重点5項目に表示（自動除外の対象外）
- `price` lookup で context（product 等）欠損時は `none` 扱い（multi/unique へ進めない）

---

## UI設計

### 画面遷移

```
/ocr-abstraction                       # プロファイル切替UI + 一覧
  └─ /ocr-abstraction/[requestId]      # 確認詳細（重点5項目 + 除外トレース）
```

### 一覧画面

- 上部: プロファイル切替セレクタ（FR-S-1）。Must 範囲では URLクエリ `?profile={clientId}` での切替でも可
- 現在プロファイルの `ocr-samples.ts`（10件）を一覧表示
- 各行: requestId / receivedAt / 自動除外済み項目数 / 要確認項目数 のサマリ

### 確認詳細画面

- ヘッダ: 現在プロファイル表示
- 重点5項目セクション（FR-M-5）:
  - `customer / deliveryLocation / product / quantity / price` を**固定順で常時表示**
  - 自動除外済み: グレーアウト + 「確定」バッジ + 除外トレース展開ボタン（FR-S-2）
  - 要確認: 通常表示 + 候補リスト（`multi` の場合）or 「該当なし」（`none` の場合）
- 除外トレース展開時: `matchedKey` `matchedValue` を inline で表示

#### `none` / `multi` の MVP UI既定挙動（暫定・金曜ヒアリングで差替予定）

> **本挙動は `/ocr-abstraction/[requestId]` 限定で維持。`/fax/[requestId]` は §追補「#4/#5 仮決定値に基づくUI挙動変更」参照**

`none`（マスタ該当なし）および `multi`（複数候補ヒット）の項目は、MVP では以下の固定挙動とする。

- **表示のみ・編集不可・承認不可**（入力UIを描画しない）
- 該当項目には **「要人間確認」バッジを明示表示**する
- 候補リスト（`multi`）は参考情報として併記するが、選択・保存操作は提供しない

金曜ヒアリング後、確定不能項目の扱い（エラー化 vs 昇格 vs 人手入力フォールバック）が決まり次第、本挙動を差替える。

### プロファイル切替UI（FR-S-1）

- セレクタ `<select>` で `PROFILES` から選択
- 選択値は Zustand store に保持・localStorage persist
- 切替時は一覧を再描画（詳細画面にいる場合は一覧へ戻る）

---

## 状態管理（Zustand）

```ts
// src/store/ocr-store.ts
type OcrStore = {
  currentProfileId: ProfileId;
  setProfileId: (id: ProfileId) => void;
};
```

- persist 対象: `currentProfileId` のみ
- OCR後データ・分類結果はコンポーネント内で都度算出（useMemo）、store に載せない（YAGNI）
- 既存 `src/store/store.ts` とは**別ファイル・別 store**。相互 import 禁止

---

## 既存 aidw-ui-mock との分離境界

> ⚠️ 本節は §分離境界の解除宣言 で一部解除済み。最新は追補節参照。

| 項目 | aidw-ui-mock | aidw-ocr-abstraction |
|------|-------------|---------------------|
| ルート | `/` `/fax/[requestId]` | `/ocr-abstraction` `/ocr-abstraction/[requestId]` |
| store | `src/store/store.ts` | `src/store/ocr-store.ts` |
| 型 | `src/types/request.ts` 等 | `src/types/ocr.ts` `src/types/profile.ts` |
| lib | `src/lib/*`（既存） | `src/lib/ocr/*`（本feature専用サブディレクトリに集約） |
| サンプルデータ | `samples/fax/*.pdf` / `public/samples/` | `src/profiles/*/ocr-samples.ts` |

- 共有しない: 型・store・マスタ・ユーティリティ
- 共有してよい: `package.json` の依存関係（Next.js / Zustand / Tailwind 等）
- 相互 import は**禁止**。プロトタイプ書き捨て前提のため、重複は許容する

---

## テスト計画

**プロトタイプ規約により省略**。ユニット/統合/E2E いずれも作成しない。`pnpm dev` での手動動作確認のみ。

確認観点（手動チェックリスト、tasks.md の T-012 で実施）:
- プロファイル切替で一覧/詳細が新プロファイルのデータに切り替わる
- 重点5項目がすべて表示される
- 一意確定項目が「確定」バッジ + トレース展開で根拠が見える
- 該当なし/複数候補の項目が要確認として表示される

---

---

# 追補: 追加スコープ3点の設計

> **追補版**: requirements.md §追加スコープ に対応する設計追補。既存設計（ClientProfile 抽象 / 自動除外 / 重点5項目UI）は維持し、設定画面UI・`/fax/*` 反映・境界解除を追加する。

---

## 分離境界の解除宣言

従来 design.md §「既存 aidw-ui-mock との分離境界」で宣言していた以下の方針を**解除**する:

- 「共有しない: 型・store・マスタ・ユーティリティ」→ **store は共有**（currentProfileId を single source of truth 化）
- 「相互 import は禁止」→ **`/fax/*` から本feature の型・lookup・profiles を import 可**
- 「ルート分離: `/` `/fax/[requestId]` vs `/ocr-abstraction/*`」→ **`/fax/*` は本feature の currentProfileId に従うよう改修**

### 解除後の範囲（触ってよい / いけない）

| 範囲 | 可否 | 備考 |
|------|------|------|
| `src/app/fax/*`（既存 aidw-ui-mock の UI） | **可** | currentProfileId 連動のため改修 |
| `src/store/store.ts`（既存 Zustand store） | **可**（拡張 or 合流） | `currentProfileId` を既存 store に合流 or 新 `ocr-store.ts` を共有参照 |
| `src/types/request.ts` 等 | **可** | プロファイル情報フィールド追加等 |
| `src/lib/*`（既存ロジック） | **可** | プロファイル連動ヘルパ追加時 |
| テストファイル全般（`*.test.*` / `*.spec.*` / `__tests__/` / `tests/`） | **不可**（CLAUDE.md §3・AC-005-2 準拠） | プロトタイプ規約「テスト規約なし」維持 |
| `samples/` 配下 | **不可**（CLAUDE.md §3） | 検証データ SSoT。再生成は `scripts/generate-requests.mjs` 経由 |
| `public/samples/` `public/pdfjs/` | **不可**（CLAUDE.md §3） | 自動生成物 |
| `node_modules/` | **不可** | 当然 |

### store 共有の実装方針

**採用案**: `src/store/ocr-store.ts`（本feature）を `/fax/*` 側からも import 可に変更し、`currentProfileId` は ocr-store 単独管理とする。既存 `src/store/store.ts` は改修せず、`/fax/*` コンポーネントで両 store を並行 subscribe する。

- 理由: `store.ts` と `ocr-store.ts` の合流は YAGNI に反する（プロトタイプ規約）。両 store 並行参照で FR-M-9 は充足
- persist 対象は ocr-store 側の `currentProfileId` のみ継続

---

## 設定画面UI設計（FR-M-6, FR-M-7, AC-M-6, AC-M-7）

### ルート

```
/ocr-abstraction/settings   # 設定画面（新設）
```

### 画面構成

- **上部**: プロファイル切替セレクタ（既存 `/ocr-abstraction` と同じコンポーネントを使い回す）
- **中段: マスタ構造可視化セクション**
  - 現在プロファイルの `masterSchema` を 4ブロック（customer / deliveryLocation / product / price）に分けて表示
  - 各ブロック: ダミーマスタ1件を JSON 整形表示（`<pre>` ブロック）+ キー一覧を表形式で併記
- **下段: OCR後データ構造可視化セクション**
  - 現在プロファイルの `ocrSchema.rawShape` を JSON 整形表示
  - 直下に「正規化後（OcrEnvelope形）」として、同プロファイルの `ocr-samples.ts` 先頭1件を `toEnvelope()` にかけた結果を JSON 整形表示
  - 両者の対比で正規化前後の差が視認できること

### 実装ファイル

```
src/app/ocr-abstraction/settings/page.tsx   # 新設
```

既存 `src/profiles/*` / `src/lib/ocr/*` / `src/store/ocr-store.ts` を読取専用で参照。設定画面自体は編集機能を持たない（可視化のみ）。

---

## `/fax/*` へのプロファイル切替反映設計（FR-M-8, FR-M-9, AC-M-8, AC-M-9）

### 基本方針

- `/fax` 一覧・`/fax/[requestId]` 詳細の既存ダミーデータ（`samples/fax/*.pdf` + localStorage）は維持
- 追加で `currentProfileId` を subscribe し、プロファイル情報（displayName / masterSchema のキー等）を**画面ヘッダ or サイドバーで可視表示**
- 可能な範囲で、プロファイルのマスタ（customer 等）を既存 `/fax/[requestId]` の SearchCombobox（customer 選択）の候補ソースに差替える

### 反映範囲（優先度付き）

| # | 反映箇所 | 優先度 | 実装概要 |
|---|---------|--------|---------|
| 1 | `/fax` 一覧ヘッダに現在プロファイル displayName を表示 | Must | `ocrStore.currentProfileId` を subscribe しヘッダに描画 |
| 2 | `/fax/[requestId]` ヘッダに現在プロファイル displayName を表示 | Must | 同上 |
| 3 | `/fax/[requestId]` の customer/product 選択 Combobox の候補を現在プロファイルの masters から差替 | Must | `PROFILES[currentProfileId].masterSchema.customer` 等を候補ソースに |
| 3a | `/fax/[requestId]` の deliveryLocation Combobox の候補を現在プロファイルの masters から差替 | Must | `PROFILES[currentProfileId].masterSchema.deliveryLocation` を候補ソースに |
| 3b | `/fax/[requestId]` の price 参照元を現在プロファイル masters（`masterSchema.price`）に差替 | Must | lookup.price(product, context) の参照元を切替 |
| 4 | `/fax/[requestId]` の `none`/`multi` 項目を編集可能フィールド化 | Should（FR-S-3） | 既存編集UI（`Step3LineItems` 等）を流用 |
| 5 | `/fax/[requestId]` の `unique` 項目も再確認・編集可化 | Should（FR-S-4） | 既存編集UI を流用、ただし「確定」バッジは残す |

### プロファイル切替時の挙動

- `/fax` 一覧または `/fax/[requestId]` 表示中にセレクタで切替 → 画面再描画
- `/fax/[requestId]` の編集バッファ（メモリのみ）は切替時に破棄（プロトタイプ規約、簡潔性優先）
- localStorage の承認済み FaxRequest スナップショットは破棄しない（CLAUDE.md §4.4 準拠）
- プロファイル切替時、localStorage スナップショットの `customerId` / `deliveryLocationId` / `productId` が新 masters に不在な場合（§反映範囲表の対象フィールド全てで同挙動）、画面上は `(不明)` 表示 + `console.warn` を出力する。スナップショット自体は破棄しない（元プロファイルへ戻せば復元される）

---

## #4/#5 仮決定値に基づくUI挙動変更

### 変更前（従来 design.md §UI設計）

`none`（マスタ該当なし）および `multi`（複数候補ヒット）の項目は、MVP では以下の固定挙動:
- 表示のみ・編集不可・承認不可
- 「要人間確認」バッジを明示表示
- 候補リスト（`multi`）は参考情報として併記、選択・保存操作なし

### 変更後（仮決定値 #4・#5）

- `none`: **編集可能フィールドとして描画**（人手入力可）。「要人間確認」バッジは残す
- `multi`: **候補リストから選択可能**（Combobox or Radio）。選択時はバッファに反映。「要人間確認」バッジは残す
- `unique`: **編集可能フィールドとして描画**（誤読再確認可）。「確定」バッジは残す（誤読疑義がある場合のみ上書き）

### 適用範囲

- `/fax/[requestId]`: 上記変更を全面適用（FR-S-3 / FR-S-4）
- `/ocr-abstraction/[requestId]`: 既存 MVP 既定挙動（表示のみ）を**維持**（抽象レイヤー単体検証用のため）

### 金曜ヒアリング後の差替可能性

本仮決定値は analyst 草案であり、金曜ヒアリング後に以下差替が発生する可能性を明記:
- #4: 確定不能項目は「エラー化」方針に差替 → 編集UI撤去
- #5: OCR誤読は「再確認せず信じる」方針に差替 → `unique` 項目編集UI撤去

具体的な差替手順:
- #4 エラー化差替時: T-A05 削除のみ（T-A04 影響なし）
- #5 再確認撤去差替時: T-A06 削除 + `/fax` unique 項目の readonly 復元

---

## ClientProfile/store 適用範囲の拡張

### 変更前

```
ClientProfile 適用範囲: /ocr-abstraction/* のみ
currentProfileId 参照元: src/store/ocr-store.ts（本feature専用）
```

### 変更後

```
ClientProfile 適用範囲: /ocr-abstraction/* + /fax/*
currentProfileId 参照元: src/store/ocr-store.ts（single source of truth）
 ├─ /ocr-abstraction/* : 従来通り参照
 ├─ /ocr-abstraction/settings : 設定画面で参照 + セレクタ操作
 └─ /fax/* : ヘッダ表示 + Combobox候補差替 + `none`/`multi`/`unique` 編集UI

既存 src/store/store.ts: 改修なし（合流しない）
```

### データフロー

```
[ユーザー] → [セレクタ操作（/ocr-abstraction or /ocr-abstraction/settings or /fax/*）]
              ↓
         [ocr-store.setProfileId()]
              ↓
         [localStorage persist]
              ↓
    ┌─────────┼─────────┐
    ↓         ↓         ↓
[/ocr-abstraction/*]  [/ocr-abstraction/settings]  [/fax/*]
 （既存UI）            （新設UI）                    （改修UI）
    ↓         ↓         ↓
  全画面で同一 currentProfileId に従った描画
```

---

## CLAUDE.md §3 解除範囲の明示

本追補により CLAUDE.md §3「触ってはいけない箇所」のうち、**一部項目の解釈を本feature限定で緩和**する:

| 対象 | 従来の扱い | 本feature追補後 |
|------|-----------|---------------|
| テストファイル全般（`*.test.*` / `*.spec.*` / `__tests__/` / `tests/`） | 作成禁止（AC-005-2） | **変更なし・引き続き作成禁止**（プロトタイプ規約維持） |
| `samples/` 配下 | 直接編集禁止 | **変更なし**（再生成は `scripts/generate-requests.mjs` 経由） |
| `public/samples/` `public/pdfjs/` | 手動編集禁止 | **変更なし**（自動生成物） |
| `node_modules/` | 当然禁止 | **変更なし** |
| `src/app/fax/*`（CLAUDE.md §3には明記なし・§4 に仕様記載） | 改修可（§4.1〜§4.6 の既存実装判断は維持） | **可**（本feature追補で積極改修。§4.1〜§4.6 の実装判断は引き続き尊重） |
| `src/store/store.ts` | 改修可 | **改修しない方針**（本feature追補では ocr-store.ts と並行参照で解決） |

**重要**: テスト作成禁止（AC-005-2）・samples 不可侵・公開生成物不可侵は**本追補でも絶対に維持**する。CLAUDE.md §3 の本質（プロトタイプ規約「テスト規約なし」・自動生成物保護）は不変。

---

## 追加スコープの懸念と判断

### 懸念: `/fax/*` と `/ocr-abstraction/*` の UI 統合範囲

**判断**: **併存**（候補A採用、requirements.md §追加スコープ参照）

- `/ocr-abstraction/*` は抽象レイヤー単体の検証用として残す（統合すると既存 `/fax/*` の複雑性に埋もれる）
- `/fax/*` は本feature の currentProfileId に従う最小侵襲改修のみ
- `/ocr-abstraction/settings` は両ルート群から参照される設定画面として新設（中立的位置づけ）
- 金曜ヒアリング後、実クライアント要件次第で統合判断を再検討可能（現時点で統合は YAGNI）

---

## 省略明記（プロトタイプ規約に基づく非対象事項）

| 通常規約で求められる項目 | 本仕様での扱い |
|------------------------|---------------|
| 非機能要件（パフォーマンス・可用性等） | 省略 |
| ER図 / シーケンス図 | 省略（DBなし・フロント完結） |
| API詳細仕様 | 省略（バックエンドなし） |
| DB詳細スキーマ / マイグレーション | 省略（localStorage のみ） |
| DI コンテナ | 省略（import で直接解決） |
| エラー体系 / Result<T> | 省略（throw + console.warn で十分） |
| 認証・認可 | 省略（Won't） |
| テスト戦略 | 省略（テスト規約なし） |
