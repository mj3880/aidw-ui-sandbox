import type { Product, ProductMapping } from '@/types/master';
import { matchesSearch, normalizeForSearch } from './search-normalizer';

export interface RankedProduct {
  product: Product;
  source: 'customer-manual' | 'customer-auto' | 'generic-manual' | 'generic-auto' | 'search';
}

/**
 * Resolve product candidates with mapping priority:
 *   1. customer-specific mapping (manual > auto)
 *   2. generic mapping (manual > auto)
 *   3. plain partial-match search
 */
export function resolveProductCandidates(
  query: string,
  customerId: string | null,
  products: Product[],
  mappings: ProductMapping[],
  limit = 30,
): RankedProduct[] {
  const out: RankedProduct[] = [];
  const seenCodes = new Set<string>();
  const norm = normalizeForSearch(query);

  function pushIfNew(productCode: string, source: RankedProduct['source']) {
    if (seenCodes.has(productCode)) return;
    const product = products.find((p) => p.productCode === productCode);
    if (!product) return;
    seenCodes.add(productCode);
    out.push({ product, source });
  }

  if (norm.length > 0) {
    // 1. Customer-specific mapping
    if (customerId) {
      const customerMappings = mappings.filter(
        (m) => m.customerId === customerId && normalizeForSearch(m.sourceProductName).includes(norm),
      );
      const sorted = [...customerMappings].sort((a, b) =>
        a.confidence === b.confidence ? 0 : a.confidence === 'manual' ? -1 : 1,
      );
      for (const m of sorted) {
        pushIfNew(m.productCode, m.confidence === 'manual' ? 'customer-manual' : 'customer-auto');
      }
    }
    // 2. Generic mapping (customerId === null)
    const genericMappings = mappings.filter(
      (m) => m.customerId === null && normalizeForSearch(m.sourceProductName).includes(norm),
    );
    const sortedGeneric = [...genericMappings].sort((a, b) =>
      a.confidence === b.confidence ? 0 : a.confidence === 'manual' ? -1 : 1,
    );
    for (const m of sortedGeneric) {
      pushIfNew(m.productCode, m.confidence === 'manual' ? 'generic-manual' : 'generic-auto');
    }
  }

  // 3. Partial-match on product name / code
  for (const p of products) {
    if (out.length >= limit) break;
    if (matchesSearch(p.productName, query) || matchesSearch(p.productCode, query)) {
      pushIfNew(p.productCode, 'search');
    }
  }

  return out.slice(0, limit);
}
