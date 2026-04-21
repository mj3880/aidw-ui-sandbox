// client-b: ClientProfile 実装

import type { ClientProfile } from '@/types/profile';
import type { OcrEnvelope } from '@/types/ocr';
import type { LookupAdapter, LookupResult } from '@/lib/ocr/lookup';
import { makeItem } from '@/lib/ocr/envelope';
import {
  clientBAccounts,
  clientBWarehouses,
  clientBItems,
  clientBContractPrices,
  type ClientBAccount,
  type ClientBWarehouse,
  type ClientBItem,
  type ClientBContractPrice,
} from './masters';
import { clientBOcrSamples, type ClientBRawOcr } from './ocr-samples';

function isClientBRawOcr(raw: unknown): raw is ClientBRawOcr {
  if (!raw || typeof raw !== 'object') return false;
  const r = raw as Partial<ClientBRawOcr>;
  return (
    typeof r.orderNo === 'string' &&
    typeof r.orderedAt === 'string' &&
    r.partner != null &&
    r.ship_to != null &&
    r.item != null &&
    r.amount != null
  );
}

function toEnvelope(raw: unknown): OcrEnvelope {
  if (!isClientBRawOcr(raw)) {
    return {
      meta: { requestId: '', receivedAt: '', clientId: 'client-b' },
      items: [],
    };
  }
  const accountNo = raw.partner.accountNo ?? null;
  const labelText = raw.partner.labelText;
  const warehouseCode = raw.ship_to.warehouseCode;
  const jan = raw.item.jan;
  const title = raw.item.title;
  const units = raw.item.units;
  const pricePerUnit = raw.amount.price_per_unit;

  return {
    meta: {
      requestId: raw.orderNo,
      receivedAt: raw.orderedAt,
      clientId: 'client-b',
    },
    items: [
      makeItem(
        'customer',
        { accountNo, labelText },
        accountNo ? `${accountNo} / ${labelText}` : labelText,
      ),
      makeItem(
        'deliveryLocation',
        warehouseCode,
        clientBWarehouses.find((w) => w.warehouse_id === warehouseCode)?.display ??
          warehouseCode,
      ),
      makeItem('product', { jan, title }, `${jan} / ${title}`),
      makeItem('quantity', units, String(units)),
      makeItem(
        'price',
        pricePerUnit,
        pricePerUnit === null || pricePerUnit === undefined
          ? '(不明)'
          : `¥${pricePerUnit}`,
      ),
    ],
  };
}

// ---- lookup 実装 ----

function lookupCustomer(ocrField: unknown): LookupResult<ClientBAccount> {
  if (!ocrField || typeof ocrField !== 'object') return { kind: 'none' };
  const v = ocrField as { accountNo?: unknown; labelText?: unknown };
  // 優先: accountNo 完全一致
  if (typeof v.accountNo === 'string' && v.accountNo.length > 0) {
    const hit = clientBAccounts.find((a) => a.account_no === v.accountNo);
    if (hit) {
      return {
        kind: 'unique',
        value: hit,
        matchedKey: 'account_no',
        matchedValue: hit.account_no,
      };
    }
  }
  // fallback: labelText 完全一致
  if (typeof v.labelText === 'string' && v.labelText.length > 0) {
    const exact = clientBAccounts.filter((a) => a.label === v.labelText);
    if (exact.length === 1) {
      return {
        kind: 'unique',
        value: exact[0],
        matchedKey: 'label',
        matchedValue: exact[0].label,
      };
    }
    // 前方一致で複数ヒットするケース（multi シナリオ）
    const prefix = clientBAccounts.filter((a) =>
      a.label.startsWith(v.labelText as string),
    );
    if (prefix.length === 1) {
      return {
        kind: 'unique',
        value: prefix[0],
        matchedKey: 'label(prefix)',
        matchedValue: prefix[0].label,
      };
    }
    if (prefix.length > 1) {
      return { kind: 'multi', candidates: prefix };
    }
  }
  return { kind: 'none' };
}

function lookupDeliveryLocation(
  ocrField: unknown,
): LookupResult<ClientBWarehouse> {
  if (typeof ocrField !== 'string' || ocrField.length === 0) return { kind: 'none' };
  const hit = clientBWarehouses.find((w) => w.warehouse_id === ocrField);
  if (hit) {
    return {
      kind: 'unique',
      value: hit,
      matchedKey: 'warehouse_id',
      matchedValue: hit.warehouse_id,
    };
  }
  return { kind: 'none' };
}

function lookupProduct(ocrField: unknown): LookupResult<ClientBItem> {
  if (!ocrField || typeof ocrField !== 'object') return { kind: 'none' };
  const v = ocrField as { jan?: unknown };
  if (typeof v.jan !== 'string') return { kind: 'none' };
  const hit = clientBItems.find((i) => i.jan === v.jan);
  if (hit) {
    return {
      kind: 'unique',
      value: hit,
      matchedKey: 'jan',
      matchedValue: hit.jan,
    };
  }
  return { kind: 'none' };
}

function lookupPrice(
  product: unknown,
  context: unknown,
): LookupResult<ClientBContractPrice> {
  if (!product || typeof product !== 'object') return { kind: 'none' };
  const p = product as { jan?: unknown };
  if (typeof p.jan !== 'string') return { kind: 'none' };
  const rule = clientBContractPrices.find((c) => c.jan === p.jan);
  if (!rule) return { kind: 'none' };
  if (typeof context === 'number' && context === rule.contract_price) {
    return {
      kind: 'unique',
      value: rule,
      matchedKey: 'jan+contract_price',
      matchedValue: `${rule.jan} / ¥${rule.contract_price}`,
    };
  }
  return { kind: 'multi', candidates: [rule] };
}

const adapter: LookupAdapter = {
  customer: lookupCustomer,
  deliveryLocation: lookupDeliveryLocation,
  product: lookupProduct,
  price: lookupPrice,
};

export const clientBProfile: ClientProfile = {
  clientId: 'client-b',
  displayName: 'Client B（物流/EC卸）',
  masterSchema: {
    customer: clientBAccounts,
    deliveryLocation: clientBWarehouses,
    product: clientBItems,
    price: clientBContractPrices,
  },
  ocrSchema: {
    rawShape: clientBOcrSamples[0],
    toEnvelope,
  },
  reviewRules: {
    focusFields: ['customer', 'deliveryLocation', 'product', 'quantity', 'price'],
    excludeWhenUnique: true,
  },
  lookup: adapter,
  ocrSamples: clientBOcrSamples,
};
