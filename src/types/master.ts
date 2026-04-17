export interface Customer {
  customerId: string;
  customerName: string;
  buyerCode: string;
  tel: string;
  fax: string;
}

export interface Product {
  productCode: string; // 7-digit zero-padded (normalized)
  productName: string;
  origin: string;
  weightKg: string;
  category: string;
}

export interface DefaultPrice {
  productCode: string;
  defaultUnitPrice: number;
}

export type PriceType = 'coefficient' | 'absolute';

export interface CustomerPrice {
  customerId: string;
  productCode: string;
  priceType: PriceType;
  value: number;
}

export type MappingConfidence = 'auto' | 'manual';

export interface ProductMapping {
  customerId: string | null; // null = generic
  sourceProductName: string;
  productCode: string;
  productName: string;
  confidence: MappingConfidence;
  createdDate: string;
}

export interface Masters {
  customers: Customer[];
  products: Product[];
  defaultPrices: DefaultPrice[];
  customerPrices: CustomerPrice[];
  productMappings: ProductMapping[];
}
