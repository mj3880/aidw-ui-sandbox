// aidw-ocr-abstraction: ClientProfile 型
// 設計: specs/aidw-ocr-abstraction/design.md §ClientProfile 抽象

import type { OcrEnvelope, FocusFieldKey } from './ocr';
import type { LookupAdapter } from '@/lib/ocr/lookup';

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

  /** ダミー OCR サンプル10件（プロファイル固有rawShape配列） */
  ocrSamples: unknown[];
}
