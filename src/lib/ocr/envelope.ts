// aidw-ocr-abstraction: OCR後データ共通エンベロープの最小スキーマ検証 + 正規化ヘルパ
// 設計: specs/aidw-ocr-abstraction/design.md §OCR後データ共通エンベロープ

import type { OcrEnvelope, OcrItem } from '@/types/ocr';

export const UNKNOWN_DISPLAY = '(不明)';

/**
 * rawValue を UI表示用の文字列に変換する。
 * - null / undefined / 空文字 → '(不明)'
 * - string → そのまま
 * - number / boolean → String()
 * - object / array → JSON.stringify（失敗時 '(不明)'）
 */
export function toDisplayValue(rawValue: unknown): string {
  if (rawValue === null || rawValue === undefined) return UNKNOWN_DISPLAY;
  if (typeof rawValue === 'string') return rawValue.length === 0 ? UNKNOWN_DISPLAY : rawValue;
  if (typeof rawValue === 'number' || typeof rawValue === 'boolean') {
    return String(rawValue);
  }
  try {
    const s = JSON.stringify(rawValue);
    return s && s.length > 0 ? s : UNKNOWN_DISPLAY;
  } catch {
    return UNKNOWN_DISPLAY;
  }
}

/**
 * 任意の envelope-likeオブジェクトを最小検証する。
 * - meta.requestId が非空文字列
 * - items が配列
 * 失敗時: console.warn + null 返却（呼び元でスキップ）
 */
export function validateEnvelope(
  candidate: unknown,
  context?: string,
): OcrEnvelope | null {
  if (!candidate || typeof candidate !== 'object') {
    console.warn('[ocr-abstraction] envelope validation failed: not an object', {
      context,
      candidate,
    });
    return null;
  }
  const obj = candidate as { meta?: unknown; items?: unknown };
  if (!obj.meta || typeof obj.meta !== 'object') {
    console.warn('[ocr-abstraction] envelope validation failed: meta missing', {
      context,
      candidate,
    });
    return null;
  }
  const meta = obj.meta as { requestId?: unknown; receivedAt?: unknown; clientId?: unknown };
  if (typeof meta.requestId !== 'string' || meta.requestId.length === 0) {
    console.warn('[ocr-abstraction] envelope validation failed: meta.requestId missing', {
      context,
      candidate,
    });
    return null;
  }
  if (!Array.isArray(obj.items)) {
    console.warn('[ocr-abstraction] envelope validation failed: items not an array', {
      context,
      candidate,
    });
    return null;
  }

  // items 各要素の最小検証 + displayValue 補完
  const items: OcrItem[] = [];
  for (const it of obj.items as unknown[]) {
    if (!it || typeof it !== 'object') continue;
    const rec = it as { fieldKey?: unknown; rawValue?: unknown; displayValue?: unknown };
    if (typeof rec.fieldKey !== 'string' || rec.fieldKey.length === 0) continue;
    const displayValue =
      typeof rec.displayValue === 'string' && rec.displayValue.length > 0
        ? rec.displayValue
        : toDisplayValue(rec.rawValue);
    items.push({
      fieldKey: rec.fieldKey,
      rawValue: rec.rawValue,
      displayValue,
    });
  }

  return {
    meta: {
      requestId: meta.requestId,
      receivedAt: typeof meta.receivedAt === 'string' ? meta.receivedAt : '',
      clientId: typeof meta.clientId === 'string' ? meta.clientId : '',
    },
    items,
  };
}

/**
 * OcrItem ファクトリ。displayValue が未指定の場合 rawValue から自動生成。
 * プロファイルの toEnvelope() 内で使う想定。
 */
export function makeItem(
  fieldKey: string,
  rawValue: unknown,
  displayValue?: string,
): OcrItem {
  return {
    fieldKey,
    rawValue,
    displayValue:
      typeof displayValue === 'string' && displayValue.length > 0
        ? displayValue
        : toDisplayValue(rawValue),
  };
}
