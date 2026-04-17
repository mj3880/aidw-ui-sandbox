import Papa from 'papaparse';
import type {
  Customer,
  Product,
  DefaultPrice,
  CustomerPrice,
  ProductMapping,
  Masters,
  PriceType,
  MappingConfidence,
} from '@/types/master';
import { normalizeProductCode } from './product-code-normalizer';

const MASTER_CSV_BASE_PATH = '/samples/master';

async function fetchCsv<T extends Record<string, string>>(url: string): Promise<T[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  const text = await res.text();
  // papaparse handles BOM via skipEmptyLines
  return new Promise<T[]>((resolve, reject) => {
    Papa.parse<T>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.replace(/^\uFEFF/, '').trim(),
      complete: (result) => resolve(result.data as T[]),
      error: (err: unknown) =>
        reject(err instanceof Error ? err : new Error(String(err))),
    });
  });
}

export async function loadMasters(): Promise<Masters> {
  const [
    customersRaw,
    productsRaw,
    defaultPricesRaw,
    customerPricesRaw,
    productMappingsRaw,
  ] = await Promise.all([
    fetchCsv<Record<string, string>>(`${MASTER_CSV_BASE_PATH}/customers.csv`),
    fetchCsv<Record<string, string>>(`${MASTER_CSV_BASE_PATH}/products.csv`),
    fetchCsv<Record<string, string>>(`${MASTER_CSV_BASE_PATH}/aitera_vegetable_default_prices.csv`),
    fetchCsv<Record<string, string>>(`${MASTER_CSV_BASE_PATH}/customer_prices.csv`),
    fetchCsv<Record<string, string>>(`${MASTER_CSV_BASE_PATH}/customer_product_mappings.csv`),
  ]);

  const customers: Customer[] = customersRaw.map((row) => ({
    customerId: row['customer_id'] ?? '',
    customerName: row['customer_name'] ?? '',
    buyerCode: row['buyer_code'] ?? '',
    tel: row['tel'] ?? '',
    fax: row['fax'] ?? '',
  }));

  const products: Product[] = productsRaw.map((row) => ({
    productCode: normalizeProductCode(row['商品CD'] ?? ''),
    productName: row['商品名'] ?? '',
    origin: row['産地'] ?? '',
    weightKg: row['重量kg'] ?? '',
    category: row['カテゴリ(1=野菜/2=果実)'] ?? row['カテゴリ'] ?? '',
  }));

  const defaultPrices: DefaultPrice[] = defaultPricesRaw.map((row) => ({
    productCode: normalizeProductCode(row['product_code'] ?? ''),
    defaultUnitPrice: Number(row['default_unit_price'] ?? 0),
  }));

  const customerPrices: CustomerPrice[] = customerPricesRaw.map((row) => ({
    customerId: row['customer_id'] ?? '',
    productCode: normalizeProductCode(row['product_code'] ?? ''),
    priceType: (row['price_type'] ?? 'absolute') as PriceType,
    value: Number(row['value'] ?? 0),
  }));

  const productMappings: ProductMapping[] = productMappingsRaw.map((row) => ({
    customerId: row['customer_id'] && row['customer_id'].trim() !== '' ? row['customer_id'] : null,
    sourceProductName: row['source_product_name'] ?? '',
    productCode: normalizeProductCode(row['product_code'] ?? ''),
    productName: row['product_name'] ?? '',
    confidence: (row['confidence'] ?? 'auto') as MappingConfidence,
    createdDate: row['created_date'] ?? '',
  }));

  return { customers, products, defaultPrices, customerPrices, productMappings };
}

export function getCustomerName(masters: Masters, customerId: string): string {
  return masters.customers.find((c) => c.customerId === customerId)?.customerName ?? customerId;
}
