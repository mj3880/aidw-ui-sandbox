# aidw-ui-sandbox

AIデジタルワーカー (aidw) UI のサンドボックス。社内UX検証用のフロントエンド プロトタイプを格納する。

現状の収録プロトタイプ:

- [`aidw-ui-mock`](#aidw-ui-mock) — FAX確認依頼ワークフローのモックUI

---

## 前提

| 項目 | バージョン / ツール |
|------|------------------|
| Node.js | 20.x 以上（推奨: 24.x） |
| パッケージマネージャ | **pnpm 9.x**（npm/yarn は使用しない） |
| OS | macOS / Linux（WSL含む） |

pnpm 未導入の場合:

```bash
npm install -g pnpm
# または
corepack enable && corepack prepare pnpm@9.15.9 --activate
```

---

## セットアップ

```bash
# 1. 依存関係のインストール
pnpm install

# 2. 開発サーバ起動（http://localhost:3000）
pnpm dev

# 3. 本番ビルド（静的書き出し: out/ ディレクトリ）
pnpm build

# 4. lint / typecheck
pnpm lint
pnpm typecheck    # = npx tsc --noEmit
```

`pnpm install` 時に prebuild scripts が走り、`samples/` 配下のPDF/CSVが `public/samples/` へ同期され、pdfjs worker が `public/pdfjs/` へコピーされる。

---

## aidw-ui-mock

FAX確認依頼ワークフローのUXモック。Next.js 14 (App Router, `output: 'export'`) で構築された純粋な静的サイト。

### 起動

```bash
pnpm dev
# http://localhost:3000 を開く → ログイン画面
# 任意のメール/パスワードでログイン成立
```

### 主要画面

| 画面ID | パス | 内容 |
|-------|------|------|
| SCR-001 | `/` | ログイン |
| SCR-002 | `/dashboard` | ダッシュボード（未対応リスト・経過時間） |
| SCR-003 | `/fax` | FAX確認依頼一覧（ステータスフィルタ） |
| SCR-004 | `/fax/[requestId]` | FAX詳細・編集（PDF + Step1〜5） |

### 技術スタック

- **フレームワーク**: Next.js 14 (App Router, `output: 'export'`)
- **UI**: Tailwind CSS + shadcn/ui (一部) + Sonner (Toaster)
- **状態管理**: Zustand + persist (localStorage)
- **PDF表示**: react-pdf (pdfjs-dist v4 ESM worker)
- **CSV解析**: papaparse
- **日付**: date-fns
- **言語**: TypeScript

### ディレクトリ構成

```
aidw-ui-sandbox/
├── samples/                         # 素材（PDF 143件 + master CSV 5種）※コミット対象
│   ├── fax/cg_*.pdf
│   └── master/*.csv
├── public/
│   ├── samples/                     # prebuildで samples/ から同期（gitignore）
│   └── pdfjs/pdf.worker.min.mjs    # prebuildでコピー（gitignore）
├── scripts/
│   ├── prebuild-samples.mjs         # samples → public/samples 同期
│   ├── copy-pdf-worker.mjs          # pdfjs worker コピー
│   └── generate-requests.mjs        # 決定論的 requests.json 生成（143件）
├── specs/aidw-ui-mock/              # 仕様書（project-brief / requirements / design / tasks）
└── src/
    ├── app/                          # Next.js App Router
    │   ├── _providers/
    │   ├── _components/             # ログイン
    │   ├── dashboard/
    │   └── fax/
    │       ├── _components/         # 一覧
    │       └── [requestId]/
    │           └── _components/     # 詳細・Step1〜5
    ├── components/                   # 共通UI
    ├── lib/                          # Domain Logic + Repository
    ├── store/                        # Zustand store
    └── types/                        # 型定義
```

### ダミーデータ

- **PDF 143件**: `samples/fax/cg_*.pdf`（実FAXを模した合成データ）
- **master CSV 5種**: `samples/master/*.csv`（顧客・商品・取引先別単価・商品マッピング 等）
- **requests.json**: `pnpm install` 時に `scripts/generate-requests.mjs` で決定論的に生成
  - ステータス分布: pending 100 / in_progress 20 / done 23 = 計143件
  - assignee分布: 自分宛 約8件 / チームA 約100件 / 他者 約35件
  - 各 lineItems の約30%を `isLowConfidence: true`

### 制約・前提

- **社内UX検証用プロトタイプ**。本番運用・外部公開しない
- **認証はモック**（任意メール/パスワードでログイン成立）
- **サーバー処理なし**（`output: 'export'` 完全静的、すべてクライアントで完結）
- **永続化**: 編集はメモリ保持。承認時のみ localStorage に保存
- **テストコードなし**（`wf-chain:ref-prototype-architecture` 規約準拠）

### 関連ドキュメント

- [project-brief](./specs/aidw-ui-mock/project-brief.md) — 背景・目的
- [requirements](./specs/aidw-ui-mock/requirements.md) — 機能要件
- [design](./specs/aidw-ui-mock/design.md) — 設計詳細
- [tasks](./specs/aidw-ui-mock/tasks.md) — 実装タスク一覧

---

## ライセンス

社内検証用プロトタイプにつきライセンス未設定。
