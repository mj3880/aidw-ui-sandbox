// aidw-ocr-abstraction: ClientProfile 型
// 設計: specs/aidw-ocr-abstraction/design.md §ClientProfile 抽象

import type { OcrEnvelope, FocusFieldKey } from './ocr';
import type { LookupAdapter } from '@/lib/ocr/lookup';

/** Combobox 候補 1件の共通構造（SearchCombobox.ComboboxOption と整合） */
export interface ClientComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

/** 確認画面 Combobox 候補対象のマスタ種別 */
export type MasterComboboxKind = 'customer' | 'deliveryLocation' | 'product';

/**
 * fax-review.ts が各 focusField の lookup に渡す rawValue 形をプロファイル側で組み立てるアダプタ。
 * 旧来 fax-review.ts 内で `profile.clientId === 'client-b'` 分岐していた rawValue 生成を集約する。
 */
export interface ClientFaxAdapter {
  toCustomerRaw: (customerId: string, customerName: string) => unknown;
  toProductRaw: (productCode: string, productName: string) => unknown;
  /** OCR 抽出価格（context）を lookup が期待する形に整形（大半のプロファイルでは素通し） */
  toPriceRaw: (ocrPrice?: number) => unknown;
}

export interface ClientProfile {
  clientId: string;
  displayName: string;

  /** マスタスキーマ（プロファイル固有構造）。unknownで受けて各実装側でnarrowing */
  masterSchema: {
    customer: unknown;
    deliveryLocation: unknown;
    product: unknown;
    price: unknown;
  };

  /** OCR後データスキーマ */
  ocrSchema: {
    /** プロファイル固有の OCR 出力形（サンプル1件） */
    rawShape: unknown;
    /** 共通エンベロープへの正規化経路 */
    toEnvelope: (raw: unknown) => OcrEnvelope;
  };

  /** レビュールール */
  reviewRules: {
    focusFields: ReadonlyArray<FocusFieldKey>;
    /** MVP: 常に true */
    excludeWhenUnique: boolean;
  };

  /** マスタ lookup 共通IF 実装 */
  lookup: LookupAdapter;

  /** fax-review.ts 向けの rawValue 構築アダプタ */
  faxAdapter: ClientFaxAdapter;

  /** 確認画面 Combobox 向けのマスタ→候補変換 */
  masterToComboboxOptions: (kind: MasterComboboxKind) => ClientComboboxOption[];

  /** productCode に対する契約単価（未確定時 null） */
  resolveExpectedPrice: (productCode: string) => number | null;

  /** ダミー OCR サンプル10件（プロファイル固有rawShape配列） */
  ocrSamples: unknown[];
}
