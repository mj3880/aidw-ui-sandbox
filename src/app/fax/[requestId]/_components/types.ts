import type { FaxRequest, LineItem } from '@/types/request';
import type { Customer, Product } from '@/types/master';
import { normalizeDeliveryLocation } from '@/lib/delivery-locations';

export type StepKey = 'step1' | 'step2' | 'step3' | 'step5';

export type Mode = 'edit' | 'view';

/** Draft state held in memory while user is editing the request. */
export interface RequestDraft {
  customerId: string;
  deliveryLocation: string;
  lineItems: LineItem[];
}

export function toDraft(req: FaxRequest): RequestDraft {
  return {
    customerId: req.customerId,
    deliveryLocation: normalizeDeliveryLocation(req.deliveryLocation),
    lineItems: req.lineItems.map((li) => ({ ...li })),
  };
}

export function applyDraft(req: FaxRequest, draft: RequestDraft): FaxRequest {
  return {
    ...req,
    customerId: draft.customerId,
    deliveryLocation: draft.deliveryLocation,
    lineItems: draft.lineItems,
  };
}

export interface DraftDiff {
  field: string;
  before: string;
  after: string;
}

export function diffRequest(
  original: FaxRequest,
  draft: RequestDraft,
  masters?: { customers: Customer[]; products: Product[] },
): DraftDiff[] {
  const out: DraftDiff[] = [];
  const customerLabel = (id: string) => {
    const name = masters?.customers.find((c) => c.customerId === id)?.customerName;
    return name ? `${id} ${name}` : id;
  };
  const productLabel = (code: string) => {
    const name = masters?.products.find((p) => p.productCode === code)?.productName;
    return name ? `${code} ${name}` : code;
  };
  if (original.customerId !== draft.customerId) {
    out.push({
      field: '取引先',
      before: customerLabel(original.customerId),
      after: customerLabel(draft.customerId),
    });
  }
  const originalDelivery = normalizeDeliveryLocation(original.deliveryLocation);
  if (originalDelivery !== draft.deliveryLocation) {
    out.push({
      field: '納品先',
      before: originalDelivery,
      after: draft.deliveryLocation,
    });
  }
  for (let i = 0; i < draft.lineItems.length; i++) {
    const a = original.lineItems[i];
    const b = draft.lineItems[i];
    if (!a) continue;
    if (a.productCode !== b.productCode) {
      out.push({
        field: `明細${i + 1} 商品コード`,
        before: productLabel(a.productCode),
        after: productLabel(b.productCode),
      });
    }
    if (a.quantity !== b.quantity) {
      out.push({
        field: `明細${i + 1} 個数`,
        before: String(a.quantity),
        after: String(b.quantity),
      });
    }
    if (a.unitPrice !== b.unitPrice) {
      out.push({
        field: `明細${i + 1} 単価`,
        before: String(a.unitPrice),
        after: String(b.unitPrice),
      });
    }
  }
  return out;
}
