// client-b: 物流/EC業態想定のダミーマスタ（client-a と構造を変える）

export interface ClientBAccount {
  account_no: string; // 数字ID（client-aとは別形）
  label: string;
  region: string;
}

export interface ClientBWarehouse {
  warehouse_id: string;
  display: string;
}

export interface ClientBItem {
  jan: string; // JANコード（13桁想定）
  title: string;
  variant?: string;
}

export interface ClientBContractPrice {
  jan: string;
  contract_price: number;
  currency: 'JPY';
}

export const clientBAccounts: ClientBAccount[] = [
  { account_no: '70001', label: 'BLUE WAVE LOGISTICS', region: 'TOKYO' },
  { account_no: '70002', label: 'RED SUN DISTRIBUTION', region: 'OSAKA' },
  { account_no: '70003', label: 'GREEN FIELD TRADING', region: 'NAGOYA' },
  { account_no: '70004', label: 'WHITE CLOUD COMMERCE', region: 'FUKUOKA' },
  { account_no: '70005', label: 'BLACK STONE HOLDINGS', region: 'SAPPORO' },
  { account_no: '70006', label: 'GOLDEN GATE SUPPLY', region: 'YOKOHAMA' },
  // multi 用: 似た label のエントリを意図的に用意
  { account_no: '70007', label: 'SILVER LINE EXPRESS', region: 'SENDAI' },
  { account_no: '70008', label: 'SILVER LINE EXPRESS WEST', region: 'HIROSHIMA' },
];

export const clientBWarehouses: ClientBWarehouse[] = [
  { warehouse_id: 'WH-01', display: '首都圏第1倉庫' },
  { warehouse_id: 'WH-02', display: '近畿第1倉庫' },
  { warehouse_id: 'WH-03', display: '中部DC' },
  { warehouse_id: 'WH-04', display: '九州DC' },
  { warehouse_id: 'WH-05', display: '北海道DC' },
];

export const clientBItems: ClientBItem[] = [
  { jan: '4901234567001', title: '清涼飲料A', variant: '500ml' },
  { jan: '4901234567002', title: '清涼飲料B', variant: '500ml' },
  { jan: '4901234567003', title: 'スナックA', variant: '60g' },
  { jan: '4901234567004', title: 'スナックB', variant: '80g' },
  { jan: '4901234567005', title: 'インスタント麺', variant: '5食入' },
  { jan: '4901234567006', title: '冷凍餃子', variant: '12個入' },
];

export const clientBContractPrices: ClientBContractPrice[] = [
  { jan: '4901234567001', contract_price: 98, currency: 'JPY' },
  { jan: '4901234567002', contract_price: 110, currency: 'JPY' },
  { jan: '4901234567003', contract_price: 148, currency: 'JPY' },
  { jan: '4901234567004', contract_price: 168, currency: 'JPY' },
  { jan: '4901234567005', contract_price: 498, currency: 'JPY' },
  { jan: '4901234567006', contract_price: 398, currency: 'JPY' },
];
