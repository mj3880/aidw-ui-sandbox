// client-a: ClientProfile 実装

import type { ClientProfile } from '@/types/profile';
import type { OcrEnvelope } from '@/types/ocr';
import type { LookupAdapter, LookupResult } from '@/lib/ocr/lookup';
import { makeItem } from '@/lib/ocr/envelope';
import {
  clientACustomers,
  clientADeliveryLocations,
  clientAProducts,
  clientAPriceRules,
  type ClientACustomer,
  type ClientADeliveryLocation,
  type ClientAProduct,
  type ClientAPriceRule,
} from './masters';
import { clientAOcrSamples, type ClientARawOcr } from './ocr-samples';

function isClientARawOcr(raw: unknown): raw is ClientARawOcr {
  if (!raw || typeof raw !== 'object') return false;
  const r = raw as Partial<ClientARawOcr>;
  return (
    typeof r.request_id === 'string' &&
    typeof r.received_at === 'string' &&
    r.customer_block != null &&
    r.delivery != null &&
    r.product_line != null &&
    r.price_block != null
  );
}

function toEnvelope(raw: unknown): OcrEnvelope {
  if (!isClientARawOcr(raw)) {
    // 呼び元で validate されるため、ここでは最小限のdefensive処理
    return {
      meta: { requestId: '', receivedAt: '', clientId: 'client-a' },
      items: [],
    };
  }
  const customerText = raw.customer_block.text;
  const delivery = raw.delivery.locationName;
  const sku = raw.product_line.sku;
  const productName = raw.product_line.name;
  const qty = raw.product_line.qty;
  const unitPrice = raw.price_block.unitPrice;

  return {
    meta: {
      requestId: raw.request_id,
      receivedAt: raw.received_at,
      clientId: 'client-a',
    },
    items: [
      makeItem('customer', customerText, customerText),
      makeItem('deliveryLocation', delivery, delivery),
      makeItem('product', { sku, name: productName }, `${sku} / ${productName}`),
      makeItem('quantity', qty, String(qty)),
      makeItem(
        'price',
        unitPrice,
        unitPrice === null || unitPrice === undefined ? '(不明)' : `¥${unitPrice}`,
      ),
    ],
  };
}

// ---- lookup 実装 ----

function lookupCustomer(ocrField: unknown): LookupResult<ClientACustomer> {
  if (typeof ocrField !== 'string' || ocrField.length === 0) return { kind: 'none' };
  // 完全一致 / name を部分一致
  const exact = clientACustomers.filter((c) => ocrField.includes(c.name));
  if (exact.length === 1) {
    return {
      kind: 'unique',
      value: exact[0],
      matchedKey: 'name',
      matchedValue: exact[0].name,
    };
  }
  if (exact.length > 1) {
    return { kind: 'multi', candidates: exact };
  }
  // 部分トークン一致（空白分割）
  const tokens = ocrField.split(/\s+/).filter((s) => s.length > 0);
  const hits = clientACustomers.filter((c) =>
    tokens.some((t) => c.name.includes(t) && t.length >= 2),
  );
  if (hits.length === 1) {
    return {
      kind: 'unique',
      value: hits[0],
      matchedKey: 'name',
      matchedValue: hits[0].name,
    };
  }
  if (hits.length > 1) return { kind: 'multi', candidates: hits };
  return { kind: 'none' };
}

function lookupDeliveryLocation(
  ocrField: unknown,
): LookupResult<ClientADeliveryLocation> {
  if (typeof ocrField !== 'string' || ocrField.length === 0) return { kind: 'none' };
  const hit = clientADeliveryLocations.find((l) => l.name === ocrField);
  if (hit) {
    return {
      kind: 'unique',
      value: hit,
      matchedKey: 'name',
      matchedValue: hit.name,
    };
  }
  return { kind: 'none' };
}

function lookupProduct(ocrField: unknown): LookupResult<ClientAProduct> {
  if (!ocrField || typeof ocrField !== 'object') return { kind: 'none' };
  const v = ocrField as { sku?: unknown; name?: unknown };
  if (typeof v.sku !== 'string' || v.sku.length === 0) return { kind: 'none' };
  const hit = clientAProducts.find((p) => p.sku === v.sku);
  if (hit) {
    return {
      kind: 'unique',
      value: hit,
      matchedKey: 'sku',
      matchedValue: hit.sku,
    };
  }
  return { kind: 'none' };
}

function lookupPrice(
  product: unknown,
  context: unknown,
): LookupResult<ClientAPriceRule> {
  if (!product || typeof product !== 'object') return { kind: 'none' };
  const p = product as { sku?: unknown };
  if (typeof p.sku !== 'string') return { kind: 'none' };
  const rule = clientAPriceRules.find((r) => r.sku === p.sku);
  if (!rule) return { kind: 'none' };
  // context が OCR 抽出価格（number）ならば一致チェック
  if (typeof context === 'number' && context === rule.basePrice) {
    return {
      kind: 'unique',
      value: rule,
      matchedKey: 'sku+basePrice',
      matchedValue: `${rule.sku} / ¥${rule.basePrice}`,
    };
  }
  // 価格情報は存在するが契約価格とズレ → 'multi' 扱い（候補は1件だが確定不能）
  return { kind: 'multi', candidates: [rule] };
}

const adapter: LookupAdapter = {
  customer: lookupCustomer,
  deliveryLocation: lookupDeliveryLocation,
  product: lookupProduct,
  price: lookupPrice,
};

export const clientAProfile: ClientProfile = {
  clientId: 'client-a',
  displayName: 'Client A（汎用飲食卸）',
  masterSchema: {
    customer: clientACustomers,
    deliveryLocation: clientADeliveryLocations,
    product: clientAProducts,
    price: clientAPriceRules,
  },
  ocrSchema: {
    rawShape: clientAOcrSamples[0],
    toEnvelope,
  },
  reviewRules: {
    focusFields: ['customer', 'deliveryLocation', 'product', 'quantity', 'price'],
    excludeWhenUnique: true,
  },
  lookup: adapter,
  ocrSamples: clientAOcrSamples,
};
