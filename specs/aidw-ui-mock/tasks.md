# 実装タスク: aidw-ui-mock（軽量版）

> **プロトタイプ向け軽量タスクリスト**。CCプロンプト精緻化・見積工数・担当割振りは省略。AIが実装時に即決しながら進める。
>
> **前提**: [project-brief.md](./project-brief.md), [requirements.md](./requirements.md), [design.md](./design.md)
>
> **適用規約**: `wf-chain:ref-prototype-architecture`

---

## タスク一覧

### Phase 1: プロジェクト基盤

- **T-001**: Next.js 14 プロジェクト初期化 + 依存追加（Tailwind / shadcn/ui / Zustand / react-pdf / papaparse / date-fns）
- **T-002**: `next.config.js`（`output: 'export'`, pdfjs alias）+ `tailwind.config.ts` + `globals.css` 設定
- **T-003**: `public/samples/` 配下（PDF 143件 + master CSV 5種 + requests.json）を配置（prebuild スクリプト等で対応。URL上は `/samples/...` でアクセスされ、`public/samples/` 配下を指す）
- **T-004**: `public/pdfjs/pdf.worker.min.js` 配置
- **T-005**: `app/layout.tsx` + `RootProviders`（shadcn/ui Toaster 組込）

### Phase 2: 型定義 + 静的データ

- **T-006**: `types/request.ts`（FaxRequest / LineItem / RequestStatus）
- **T-007**: `types/master.ts`（Customer / Product / CustomerPrice / ProductMapping）
- **T-008**: `samples/requests/requests.json` 生成（143件のPDFに1対1対応する決定論的ダミー依頼データ）
  - ステータス分布: `pending` 100件 / `in_progress` 20件 / `done` 23件 = 合計143件
  - 各 `FaxRequest` で `lineItems` の約30%を `isLowConfidence: true` として生成
  - `assignee` は**自分宛て 5-10件 / チーム宛て 100件前後 / 他者宛て 30件前後**で分布を持たせる

### Phase 3: Domain Logic + Data Access

- **T-009**: `lib/product-code-normalizer.ts`（7桁0埋め統一）
- **T-010**: `lib/search-normalizer.ts`（全角/半角・カナ揺れ吸収）
- **T-011**: `lib/elapsed-time-formatter.ts`
- **T-012**: `lib/price-calculator.ts`（coefficient/absolute/デフォルトフォールバック）
- **T-013**: `lib/product-mapping-resolver.ts`（取引先別 → 汎用 の優先解決）
- **T-014**: `lib/next-fax-selector.ts`
- **T-015**: `lib/master-repository.ts`（5 CSV 起動時ロード + 正規化キャッシュ + 検索関数）
- **T-016**: `lib/request-repository.ts`（requests.json ロード + localStorage マージ）
- **T-017**: `store/store.ts`（Zustand + persist + localStorage スキーマ）

### Phase 4: 共通UIコンポーネント

- **T-018**: `SidebarNav`（未実装リンクはクリック無反応）
- **T-019**: `SearchCombobox` 基盤（shadcn/ui Command 派生、正規化検索統合）
- **T-020**: `PriceDiffBadge`（期待単価との差分表示）

### Phase 5: 画面実装

- **T-021**: SCR-001 ログイン画面（LoginForm、任意値でログイン成立、起動時マスタ/依頼ロード）
- **T-022**: SCR-002 ダッシュボード（TopActionButtons + PendingList、経過時間1分毎再計算）
- **T-023**: SCR-003 FAX確認依頼一覧（StatusFilter + RequestCard、未対応クリックで対応中化）
- **T-024**: SCR-004 骨格（PdfPane + StepPane + ドラッグハンドルまたは固定50:50）
- **T-025**: SCR-004 Step1 取引先 + Step2 納品先（SearchCombobox活用）
- **T-026**: SCR-004 Step3 明細（ProductSearchCombobox + 期待単価 + 差分警告 + 低信頼度ハイライト + 全項目トグル12項目）
- **T-027**: SCR-004 Step4 変更確認モーダル + Step5 承認完了/ナビゲーション
- **T-028**: SCR-004 閲覧モード（対応済み/対応中カードからの閲覧。編集無効化・Step4/5非表示）

### Phase 6: 仕上げ

- **T-029**: エラーハンドリング仕上げ（PDF失敗 / CSV失敗 / localStorage破損 / 未知requestId）
- **T-030**: 手動動作確認（全US・全画面の動作チェック）

---

## 依存関係（矢印記法）

```
T-001 → T-002 → T-005
T-001 → T-003, T-004
T-001 → T-006, T-007 → T-008
T-001 → T-009, T-010
T-007 → T-012, T-013
T-007, T-009, T-010 → T-015
T-006 → T-014, T-016
T-014 → T-016
T-016 → T-017
T-005, T-015, T-016, T-017 → T-018, T-019, T-020
T-018, T-019, T-020 → T-021 → T-022 → T-023 → T-024 → T-025 → T-026 → T-027 → T-028
T-028 → T-029 → T-030
```

---

## 注記

- 詳細なCCプロンプトは各タスク着手時にAIが `/clear` 後に起動して即座に組み立てる
- 見積工数・担当割振りは省略（プロトタイプにつき）
- テスト規約なし・自動テスト不要（`ref-prototype-architecture` 遵守）
- 実装判断（商品コード正規化方向・納品先扱い・差分閾値・閲覧モードUI差分等）はAIが実装時即決
