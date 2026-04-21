// aidw-ocr-abstraction: 自動除外ロジック
// 設計: specs/aidw-ocr-abstraction/design.md §自動除外ロジック

import type { OcrEnvelope, OcrItem, FocusFieldKey } from '@/types/ocr';
import { FOCUS_FIELD_KEYS } from '@/types/ocr';
import type { ClientProfile } from '@/types/profile';
import type { LookupResult } from './lookup';

export type ReviewOutcome =
  | { kind: 'excluded'; reason: LookupResult<unknown> } // 一意確定で確認フロー除外
  | { kind: 'review'; reason: LookupResult<unknown> }; // 要人間確認

export interface ReviewDecision {
  item: OcrItem;
  fieldKey: FocusFieldKey;
  outcome: ReviewOutcome;
}

function callLookup(
  profile: ClientProfile,
  fieldKey: FocusFieldKey,
  item: OcrItem,
  itemsByKey: Map<FocusFieldKey | string, OcrItem>,
): LookupResult<unknown> {
  if (fieldKey === 'customer') return profile.lookup.customer(item.rawValue);
  if (fieldKey === 'deliveryLocation')
    return profile.lookup.deliveryLocation(item.rawValue);
  if (fieldKey === 'product') return profile.lookup.product(item.rawValue);
  if (fieldKey === 'price') {
    // price lookup は product 情報が context 必須
    const productItem = itemsByKey.get('product');
    if (!productItem) return { kind: 'none' };
    return profile.lookup.price(productItem.rawValue, item.rawValue);
  }
  // quantity は classify() で事前除外済み
  return { kind: 'none' };
}

/**
 * 重点5項目（focusFields）の各項目をプロファイルlookupにかけ、
 * 一意確定なら excluded、それ以外（multi/none）なら review に分類する。
 *
 * - quantity は LookupAdapter 非対応のため常に review 扱い（自動除外の対象外）
 * - price lookup で context（product 等）欠損時は none 扱い
 * - focusFields に存在しないフィールドは result から除外される
 * - focusFields に含まれるが OcrEnvelope.items にない場合はスキップ（該当なし扱いせず、呼び元で補完判断）
 */
export function classify(
  envelope: OcrEnvelope,
  profile: ClientProfile,
): ReviewDecision[] {
  const decisions: ReviewDecision[] = [];
  const focusFields: ReadonlyArray<FocusFieldKey> =
    profile.reviewRules.focusFields.length > 0
      ? profile.reviewRules.focusFields
      : FOCUS_FIELD_KEYS;

  // items の fieldKey 参照を O(1) 化（price lookup の product 取得等で利用）
  const itemsByKey = new Map<FocusFieldKey | string, OcrItem>(
    envelope.items.map((it) => [it.fieldKey, it]),
  );

  for (const fieldKey of focusFields) {
    const item = itemsByKey.get(fieldKey);
    if (!item) continue;

    // quantity は lookup 非対応 → 常に review
    if (fieldKey === 'quantity') {
      decisions.push({
        item,
        fieldKey,
        outcome: { kind: 'review', reason: { kind: 'none' } },
      });
      continue;
    }

    const result = callLookup(profile, fieldKey, item, itemsByKey);
    const outcome: ReviewOutcome =
      result.kind === 'unique' && profile.reviewRules.excludeWhenUnique
        ? { kind: 'excluded', reason: result }
        : { kind: 'review', reason: result };

    decisions.push({ item, fieldKey, outcome });
  }

  return decisions;
}
