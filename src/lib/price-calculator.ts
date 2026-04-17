import type { CustomerPrice, DefaultPrice } from '@/types/master';

export type ExpectedPriceMode = 'coefficient' | 'absolute' | 'default' | 'unknown';

export interface ExpectedPriceResult {
  mode: ExpectedPriceMode;
  expectedPrice: number | null;
  defaultPrice: number | null;
  coefficient: number | null;
}

/**
 * Compute expected unit price for a (customer, product) pair.
 * Priority: customer_prices(coefficient/absolute) > default_prices > unknown
 */
export function computeExpectedPrice(
  customerId: string,
  productCode: string,
  customerPrices: CustomerPrice[],
  defaultPrices: DefaultPrice[],
): ExpectedPriceResult {
  const def = defaultPrices.find((d) => d.productCode === productCode);
  const defaultPrice = def?.defaultUnitPrice ?? null;

  const cp = customerPrices.find(
    (p) => p.customerId === customerId && p.productCode === productCode,
  );

  if (cp) {
    if (cp.priceType === 'coefficient') {
      if (defaultPrice === null) {
        return { mode: 'coefficient', expectedPrice: null, defaultPrice, coefficient: cp.value };
      }
      return {
        mode: 'coefficient',
        expectedPrice: Math.round(defaultPrice * cp.value),
        defaultPrice,
        coefficient: cp.value,
      };
    }
    return {
      mode: 'absolute',
      expectedPrice: cp.value,
      defaultPrice,
      coefficient: null,
    };
  }

  if (defaultPrice !== null) {
    return { mode: 'default', expectedPrice: defaultPrice, defaultPrice, coefficient: null };
  }

  return { mode: 'unknown', expectedPrice: null, defaultPrice: null, coefficient: null };
}

export type DiffLevel = 'ok' | 'warning' | 'error' | 'unknown';

/**
 * Determine warning/error level based on actual vs expected price.
 * Per requirements:
 *   warning: |diff%| > 10 AND |diffYen| > 10
 *   error:   |diff%| > 30 (overrides warning)
 */
export function classifyDiff(actual: number, expected: number | null): DiffLevel {
  if (expected === null || expected === 0) return 'unknown';
  const diffYen = Math.abs(actual - expected);
  const diffPct = (diffYen / expected) * 100;
  if (diffPct > 30) return 'error';
  if (diffPct > 10 && diffYen > 10) return 'warning';
  return 'ok';
}
