// aidw-ocr-abstraction: OCR後データ共通エンベロープ型
// 設計: specs/aidw-ocr-abstraction/design.md §OCR後データ共通エンベロープ

export type FocusFieldKey =
  | 'customer'
  | 'deliveryLocation'
  | 'product'
  | 'quantity'
  | 'price';

/** focusFields の SSoT。review-exclusion.ts / profile reviewRules 双方から参照する */
export const FOCUS_FIELD_KEYS: readonly FocusFieldKey[] = [
  'customer',
  'deliveryLocation',
  'product',
  'quantity',
  'price',
] as const;

export interface OcrMeta {
  requestId: string;
  receivedAt: string; // ISO8601
  clientId: string;
}

export interface OcrItem {
  /** focusFields の5キー or 任意拡張キー */
  fieldKey: FocusFieldKey | string;
  /** プロファイル固有の生値 */
  rawValue: unknown;
  /** UI表示用。toEnvelope() 内で必ず生成。生成不能時は '(不明)' */
  displayValue: string;
}

export interface OcrEnvelope {
  meta: OcrMeta;
  items: OcrItem[];
}
