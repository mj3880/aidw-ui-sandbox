// aidw-ocr-abstraction: マスタ lookup 共通IF
// 設計: specs/aidw-ocr-abstraction/design.md §マスタ lookup 共通IF

export type LookupResult<T> =
  | {
      kind: 'unique';
      value: T;
      matchedKey: string;
      matchedValue: string;
    }
  | {
      kind: 'multi';
      candidates: T[];
    }
  | {
      kind: 'none';
    };

/**
 * 各プロファイルが customer / deliveryLocation / product / price の4メソッドを実装する。
 * MVPでは文字列部分一致・ID完全一致等の素朴な実装で十分。
 */
export interface LookupAdapter {
  customer: (ocrField: unknown) => LookupResult<unknown>;
  deliveryLocation: (ocrField: unknown) => LookupResult<unknown>;
  product: (ocrField: unknown) => LookupResult<unknown>;
  /**
   * price lookup。product（masterキー）と OCR 抽出価格（ocrPrice）を突合する。
   * product 欠損時は 'none' 扱い。ocrPrice は契約価格との一致チェックに用いる。
   */
  price: (product: unknown, ocrPrice: unknown) => LookupResult<unknown>;
}
