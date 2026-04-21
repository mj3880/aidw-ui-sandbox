// aidw-ocr-abstraction: /fax/[requestId] 側の各フィールドに対する
// OCR lookup バッジ判定ヘルパ（T-A05 / T-A06）
//
// FaxRequest のダミーデータはプロファイル masters と完全整合しないため、
// lookup の入力形は各フィールドごとに「プロファイル側がどのrawValueで受け取るか」を合わせる。
//
// - customer: client-a → string（顧客名文字列想定）/ client-b → { accountNo?, labelText }
// - deliveryLocation: 文字列（client-a: name） / client-b: warehouse_id
// - product: { sku: productCode } / client-b: { jan: productCode }
//
// プロファイルごとの rawValue 形状をここで吸収して lookup を呼ぶ。

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
  const rawValue: unknown =
    profile.clientId === 'client-b'
      ? { accountNo: customerId, labelText: customerName || customerId }
      : customerName || customerId;
  const result = profile.lookup.customer(rawValue);
  return toBadge(result);
}

export function classifyDeliveryLocation(
  profile: ClientProfile,
  deliveryLocation: string,
): FieldBadge {
  if (!deliveryLocation) return { kind: 'unknown', label: '情報なし' };
  const result = profile.lookup.deliveryLocation(deliveryLocation);
  return toBadge(result);
}

export function classifyProduct(
  profile: ClientProfile,
  productCode: string,
): FieldBadge {
  if (!productCode) return { kind: 'unknown', label: '情報なし' };
  const rawValue: unknown =
    profile.clientId === 'client-b'
      ? { jan: productCode }
      : { sku: productCode };
  const result = profile.lookup.product(rawValue);
  return toBadge(result);
}

export function classifyPrice(
  profile: ClientProfile,
  productCode: string,
  actualPrice: number,
): FieldBadge {
  if (!productCode) return { kind: 'unknown', label: '情報なし' };
  const product: unknown =
    profile.clientId === 'client-b'
      ? { jan: productCode }
      : { sku: productCode };
  const result = profile.lookup.price(product, actualPrice);
  return toBadge(result);
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
