# CLAUDE.md — AI開発ガイド

このリポジトリで作業するAIエージェント（Claude Code等）が遵守すべき規約・前提・既知の落とし穴を集約する。**作業前に必ず本ファイル全体を読むこと。**

---

## 1. プロジェクト性質

- **位置付け**: 社内UX検証用 **プロトタイプ**（本番運用・外部公開なし）
- **収録物**: `aidw-ui-mock`（FAX確認依頼ワークフローのモックUI）
- **適用規約**: `wf-chain:ref-prototype-architecture`（**最重要**）
  - YAGNI最優先・フラット構成・直接State・テスト規約なし・Result<T>不要
  - **DDD4層分離・厳格な型・抽象化リファクタは意図的に省略**
  - ref-ddd-architecture / ref-programming-principles は本プロジェクトに **適用しない**

---

## 2. パッケージマネージャ

**pnpm 9.x のみ使用。npm/yarn は禁止。**

```bash
pnpm install        # 依存追加・更新
pnpm dev            # 開発サーバ
pnpm build          # 本番ビルド（静的書き出し）
pnpm lint
pnpm typecheck      # = npx tsc --noEmit
```

`package-lock.json` / `yarn.lock` を生成・コミットしないこと。

---

## 3. 触ってはいけない箇所（厳守）

| 対象 | 理由 |
|------|------|
| **テストファイル全般** | プロトタイプ規約「テスト規約なし」。`*.test.*` `*.spec.*` `__tests__/` `tests/` のいずれも作成禁止（AC-005-2） |
| `samples/` 配下のPDF/CSV | 検証データのSSoT。直接編集せず、必要時は `scripts/generate-requests.mjs` 経由で再生成 |
| `public/samples/` `public/pdfjs/` | prebuild scripts による自動生成物。手動編集禁止（gitignore対象） |
| `node_modules/` | 当然 |

---

## 4. 重要な実装判断

### 4.1 PDF Worker解決

- `pdfjs-dist` v4 の **ESM版** worker (`pdf.worker.min.mjs`) を `public/pdfjs/` に静的配置
- Webpack alias は使用しない（`output: 'export'` との相性とシンプルさ優先）
- 配置元: `node_modules/pdfjs-dist/build/pdf.worker.min.mjs`
- 配置スクリプト: `scripts/copy-pdf-worker.mjs`（postinstall hook）

### 4.2 動的ルートと静的書き出し

- `/fax/[requestId]` は `generateStaticParams()` で `samples/fax/*.pdf` を読み **143件全件SSG**
- `dynamicParams = false` で未知ID は404
- ファイル追加時は `pnpm build` で自動的にページ増加

### 4.3 価格差分閾値（AC-013準拠）

- `>10% かつ >¥10` で warning（黄）
- `>30%` で error（赤）
- 等号は不含。実装は `src/lib/price-calculator.ts`

### 4.4 編集バッファ方針

- **メモリのみ**保持（ブラウザリロードで破棄）
- 承認時のみ localStorage に **FaxRequest スナップショット**を `aidw-ui-mock:requests:{requestId}` キーで永続化
- 差分バッファ方式は採用しない

### 4.5 localStorage override の信頼境界

- `src/lib/request-repository.ts` の `mergeWithLocalStorage` は **ホワイトリスト pick** で実装
- 許可フィールド: `status` `customerId` `deliveryLocation` `assigneeUserId` `assigneeTeamId` `lineItems` 等
- **除外**: `pdfFile` `requestId` `receivedAt` `createdAt`（同定キー・改ざん防止）
- 新フィールド追加時は `OVERRIDABLE_FIELDS` 配列の更新を判断すること

### 4.6 閲覧モード判定

- `mode = request.status === 'done' ? 'view' : 'edit'`
- `in_progress` は編集可（自分の作業継続を想定）
- US-004 厳格解釈では `pending` のみ編集の可能性あり → **要件すり合わせ未了**（残課題）

---

## 5. 状態管理（Zustand）

- 単一 store: `src/store/store.ts`
- スキーマ: `{ user, masters, requests, requestEdits }` 等
- persist 対象: 認証状態 + 編集差分のみ
- localStorage 破損時は自動クリア（`onRehydrateStorage` で対処）

---

## 6. 検索・正規化

- 商品コード正規化: 7桁0埋め（`src/lib/product-code-normalizer.ts`）
- 全角/半角・カナ揺れ吸収: `src/lib/search-normalizer.ts`
- これらは検索Combobox全箇所で統一使用（`src/components/SearchCombobox.tsx`）

---

## 7. 型のSSoT

| 型 | 配置 |
|----|------|
| `FaxRequest` `LineItem` `RequestStatus` | `src/types/request.ts` |
| `Customer` `Product` `CustomerPrice` `ProductMapping` | `src/types/master.ts` |
| `CurrentUser` | `src/types/auth.ts` |

ロジックモジュール（`src/lib/*`）に型を定義しないこと。`StatusFilter.FilterValue` は `'all' \| RequestStatus` で派生定義する。

---

## 8. 仕様書チェーン

実装着手前・仕様確認時は以下を順に参照:

1. `specs/aidw-ui-mock/project-brief.md` — 背景・目的
2. `specs/aidw-ui-mock/requirements.md` — 機能要件・受入基準
3. `specs/aidw-ui-mock/design.md` — アーキテクチャ・DB設計・テスト計画
4. `specs/aidw-ui-mock/tasks.md` — 実装タスク一覧（軽量版）

仕様書とコードに乖離がある場合は **仕様書側を更新する判断**を優先（仕様SSoT）。ただし安易な仕様変更は避け、要件由来の不変条件は維持すること。

---

## 9. 既知の残課題（2026-04-18時点）

| # | 内容 | 優先度 |
|---|------|------|
| 1 | `src/app/fax/[requestId]/_components/Step3LineItems.tsx:168-173` border重複（実害なし、修正10秒） | 低 |
| 2 | `src/lib/next-fax-selector.ts:2-4` CurrentUser re-export 残骸（dead code） | 低 |
| 3 | `specs/aidw-ui-mock/design.md:92` `assigneeName` 記述が型変更（`assigneeUserId`）に未追従 | 中 |
| 4 | US-004「対応中」モードの要件解釈すり合わせ（実装は status==='done' のみ閲覧固定） | 中 |
| 5 | T-030 手動動作確認（`pnpm dev` で全画面通し動作チェック） | 中 |

---

## 10. ブランチ・コミット運用

- 開発ブランチ: `prototype/<feature>` 命名（例: `prototype/aidw-ui-mock`、`prototype/aidw-ocr-abstraction`）
- リモート: `origin: git@github.com:mj3880/aidw-ui-sandbox.git`（PR運用可）
- PR作成は主の明示指示時のみ（`gh pr create` 経由、タイトル日本語可・HEREDOC本文）
- コミットメッセージ: Conventional Commits 形式（日本語可）
  - `feat:` / `refactor:` / `chore:` / `fix:` / `docs:` 等
- ファイルステージング: `git add -A` ではなく **個別指定**（不要ファイル混入防止）

---

## 11. WFチェーン運用（cc-plugin-wf-chain）

本プロジェクトは Claude Code の `cc-plugin-wf-chain` プラグインによる SDD ワークフローで開発されている。

- 仕様書作成: `/wf-chain:wf-prototype-spec`（WF-010）
- 実装: `/wf-chain:wf-prototype-impl`（WF-011、TDD/PR省略の超軽量WF）
- 一般実装: `/wf-chain:wf-impl`（WF-004）/ `/wf-chain:wf-impl-mini`（WF-009）

製品化時はプロトタイプWF（WF-010/011）から本実装WF（WF-001〜WF-004）への移行を想定。

---

## 12. 確認チェックリスト（実装前）

- [ ] 本ファイル（CLAUDE.md）全体を読んだ
- [ ] `wf-chain:ref-prototype-architecture` の意図を理解した（YAGNI最優先）
- [ ] 触らない箇所（§3）を把握した
- [ ] 該当する仕様書（`specs/aidw-ui-mock/*`）を読んだ
- [ ] 既知残課題（§9）と作業内容の重複がないか確認した
