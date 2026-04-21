// aidw-ocr-abstraction: /fax/[requestId] 側の各フィールドに対する
// OCR lookup バッジ判定ヘルパ（T-A05 / T-A06）
//
// rawValue 形状の組立はプロファイル側 faxAdapter に委譲する。
// ここでは profile.clientId での分岐を持たない。

import type { ClientProfile } from '@/types/profile';
import type { LookupResult } from './lookup';

export type BadgeKind = 'excluded' | 'review-none' | 'review-multi' | 'unknown';

export interface FieldBadge {
  kind: BadgeKind;
  label: string;
  detail?: string;
}

export function classifyCustomer(
  profile: ClientProfile,
  customerId: string,
  customerName: string,
): FieldBadge {
  if (!customerId && !customerName) return { kind: 'unknown', label: '情報なし' };
  const rawValue = profile.faxAdapter.toCustomerRaw(customerId, customerName);
  return toBadge(profile.lookup.customer(rawValue));
}

export function classifyDeliveryLocation(
  profile: ClientProfile,
  deliveryLocation: string,
): FieldBadge {
  if (!deliveryLocation) return { kind: 'unknown', label: '情報なし' };
  return toBadge(profile.lookup.deliveryLocation(deliveryLocation));
}

export function classifyProduct(
  profile: ClientProfile,
  productCode: string,
  productName = '',
): FieldBadge {
  if (!productCode) return { kind: 'unknown', label: '情報なし' };
  const rawValue = profile.faxAdapter.toProductRaw(productCode, productName);
  return toBadge(profile.lookup.product(rawValue));
}

export function classifyPrice(
  profile: ClientProfile,
  productCode: string,
  actualPrice: number,
  productName = '',
): FieldBadge {
  if (!productCode) return { kind: 'unknown', label: '情報なし' };
  const productRaw = profile.faxAdapter.toProductRaw(productCode, productName);
  const priceRaw = profile.faxAdapter.toPriceRaw(actualPrice);
  return toBadge(profile.lookup.price(productRaw, priceRaw));
}

function toBadge(result: LookupResult<unknown>): FieldBadge {
  if (result.kind === 'unique') {
    return {
      kind: 'excluded',
      label: '確定',
      detail: `${result.matchedKey}: ${result.matchedValue}`,
    };
  }
  if (result.kind === 'multi') {
    return {
      kind: 'review-multi',
      label: '要人間確認（複数候補）',
      detail: `候補 ${result.candidates.length} 件`,
    };
  }
  return { kind: 'review-none', label: '要人間確認（該当なし）' };
}
