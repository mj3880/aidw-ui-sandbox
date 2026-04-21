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
