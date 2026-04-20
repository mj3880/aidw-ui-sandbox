// Generate deterministic requests.json from samples/fax/*.pdf and samples/master/*.csv.
// Output: public/samples/requests/requests.json
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const samplesFax = path.join(root, 'public', 'samples', 'fax');
const samplesMaster = path.join(root, 'public', 'samples', 'master');
const outDir = path.join(root, 'public', 'samples', 'requests');
const outFile = path.join(outDir, 'requests.json');

console.log('[generate-requests] start');

// --- Deterministic PRNG (mulberry32) ---
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260418);
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

// Keep this list in sync with src/lib/delivery-locations.ts
const DELIVERY_LOCATIONS = [
  '本店',
  '東京支店',
  '大阪支店',
  '名古屋支店',
  '横浜支店',
  '神戸支店',
  '福岡支店',
  '札幌支店',
  '仙台支店',
  '広島支店',
  '京都営業所',
  '千葉営業所',
  '埼玉営業所',
  '川崎営業所',
  '新宿営業所',
  '渋谷営業所',
  '品川営業所',
  '池袋営業所',
  '豊洲市場店',
  '築地店',
  '大田市場店',
  '秋葉原店',
  '梅田店',
  '難波店',
  '天神店',
];

// --- Load CSVs (very minimal CSV parser; trim BOM) ---
function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n').filter((l) => l.length > 0);
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    const row = {};
    headers.forEach((h, i) => { row[h] = (cols[i] ?? '').trim(); });
    return row;
  });
}

const customersCsv = await readFile(path.join(samplesMaster, 'customers.csv'), 'utf8');
const productsCsv = await readFile(path.join(samplesMaster, 'products.csv'), 'utf8');
const defaultPricesCsv = await readFile(
  path.join(samplesMaster, 'aitera_vegetable_default_prices.csv'),
  'utf8',
);
const customerPricesCsv = await readFile(path.join(samplesMaster, 'customer_prices.csv'), 'utf8');
const customers = parseCsv(customersCsv);
const products = parseCsv(productsCsv);
const defaultPricesRows = parseCsv(defaultPricesCsv);
const customerPricesRows = parseCsv(customerPricesCsv);

// Normalize product code to 7 digits
function pad7(s) {
  const digits = String(s).replace(/\D/g, '');
  return digits.padStart(7, '0');
}

const productList = products.map((p) => ({
  productCode: pad7(p['商品CD']),
  productName: p['商品名'],
}));

// defaultPrices / customerPrices を正規化
const defaultPriceMap = new Map(
  defaultPricesRows.map((r) => [pad7(r['product_code']), Number(r['default_unit_price'])]),
);
const customerPriceList = customerPricesRows.map((r) => ({
  customerId: r['customer_id'],
  productCode: pad7(r['product_code']),
  priceType: r['price_type'], // 'coefficient' | 'absolute'
  value: Number(r['value']),
}));

function computeExpectedPrice(customerId, productCode) {
  const defaultPrice = defaultPriceMap.get(productCode) ?? null;
  const cp = customerPriceList.find(
    (p) => p.customerId === customerId && p.productCode === productCode,
  );
  if (cp) {
    if (cp.priceType === 'coefficient') {
      if (defaultPrice === null) return null;
      return Math.round(defaultPrice * cp.value);
    }
    return cp.value;
  }
  return defaultPrice;
}

// Find PDF files
const faxFiles = (await readdir(samplesFax))
  .filter((f) => f.endsWith('.pdf'))
  .sort();

console.log(`[generate-requests] found ${faxFiles.length} fax PDFs`);
console.log(`[generate-requests] customers=${customers.length}, products=${productList.length}`);

// --- Status assignments: pending 100 / in_progress 20 / done 23 ---
const statuses = [
  ...Array(100).fill('pending'),
  ...Array(20).fill('in_progress'),
  ...Array(23).fill('done'),
];
// Shuffle deterministically
for (let i = statuses.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
}

// --- Assignee distribution ---
// Self: 8, Team(self team): ~100, Others (different team): ~35
// teams: T-A (self), T-B, T-C
const SELF_USER = 'user-self';
const SELF_TEAM = 'T-A';
const OTHER_TEAMS = ['T-B', 'T-C'];
const OTHER_USERS = ['user-tanaka', 'user-suzuki', 'user-yamada', 'user-sato', 'user-ito'];

// Build assignee plan: 8 self direct, ~100 self-team, rest others
const assigneePlan = [
  ...Array(8).fill('self'),
  ...Array(100).fill('selfteam'),
];
while (assigneePlan.length < faxFiles.length) {
  assigneePlan.push('other');
}
// Shuffle
for (let i = assigneePlan.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [assigneePlan[i], assigneePlan[j]] = [assigneePlan[j], assigneePlan[i]];
}

// --- Generate dates: spread receivedAt across last 7 days ---
const NOW = new Date('2026-04-18T09:00:00+09:00').getTime();
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

const requests = faxFiles.map((file, idx) => {
  const requestId = file.replace(/\.pdf$/, '');
  const customer = customers[idx % customers.length];
  const status = statuses[idx];
  const assigneeKind = assigneePlan[idx];

  let assigneeUserId = null;
  let assigneeTeamId = null;
  if (assigneeKind === 'self') {
    assigneeUserId = SELF_USER;
    assigneeTeamId = null;
  } else if (assigneeKind === 'selfteam') {
    assigneeUserId = null;
    assigneeTeamId = SELF_TEAM;
  } else {
    if (rand() < 0.5) {
      assigneeUserId = pick(OTHER_USERS);
      assigneeTeamId = null;
    } else {
      assigneeUserId = null;
      assigneeTeamId = pick(OTHER_TEAMS);
    }
  }

  // Override: done/in_progress should also have a concrete user assignee for display.
  // 対応中(in_progress)は自分への偏りを避け、selfteam由来でも 1/3 のみ self、残り 2/3 は他ユーザーへ振る。
  if ((status === 'done' || status === 'in_progress') && !assigneeUserId) {
    if (status === 'in_progress' && assigneeKind === 'selfteam') {
      assigneeUserId = rand() < 1 / 3 ? SELF_USER : pick(OTHER_USERS);
    } else {
      assigneeUserId = assigneeKind === 'selfteam' ? SELF_USER : pick(OTHER_USERS);
    }
  }

  const receivedOffset = Math.floor(rand() * SEVEN_DAYS);
  const receivedAt = new Date(NOW - receivedOffset).toISOString();
  const orderDate = new Date(NOW - receivedOffset - randInt(0, 2) * 86400000)
    .toISOString().slice(0, 10);
  const deliveryOffsetMs = NOW - receivedOffset + randInt(1, 5) * 86400000;
  const deliveryDate = new Date(deliveryOffsetMs).toISOString().slice(0, 10);
  // arrivalDate: deliveryDateの1〜2日前
  const arrivalDate = new Date(deliveryOffsetMs - randInt(1, 2) * 86400000)
    .toISOString().slice(0, 10);

  // 1〜10 line items
  const lineCount = randInt(1, 10);
  const lineItems = [];
  for (let i = 0; i < lineCount; i++) {
    const product = productList[Math.floor(rand() * productList.length)];
    const isLow = rand() < 0.3;
    const expected = computeExpectedPrice(customer.customer_id, product.productCode);

    let productCode;
    let productName;
    let unitPrice;
    if (isLow) {
      // 低信頼度: 商品未確定（空）・単価はOCRゆらぎ値（マスタ差分あり得る）
      productCode = '';
      productName = '';
      const baseUnit = expected ?? randInt(1000, 8000);
      const driftRoll = rand();
      if (driftRoll < 0.4) unitPrice = Math.round(baseUnit * 1.31);
      else if (driftRoll < 0.7) unitPrice = Math.round(baseUnit * 0.82);
      else unitPrice = Math.round(baseUnit * 1.12);
    } else {
      // 低信頼度以外: 商品確定・単価もマスタ整合値
      productCode = product.productCode;
      productName = product.productName;
      unitPrice = expected ?? randInt(1000, 8000);
    }

    lineItems.push({
      lineItemId: `${requestId}-L${String(i + 1).padStart(2, '0')}`,
      productCode,
      productName,
      quantity: randInt(1, 50),
      unitPrice,
      isLowConfidence: isLow,
    });
  }

  return {
    requestId,
    pdfFile: file,
    customerId: customer.customer_id,
    deliveryLocation: pick(DELIVERY_LOCATIONS),
    receivedAt,
    orderDate,
    deliveryDate,
    arrivalDate,
    status,
    assigneeUserId,
    assigneeTeamId,
    lineItems,
  };
});

// Sort by receivedAt desc for default listing convenience
requests.sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));

await mkdir(outDir, { recursive: true });
await writeFile(outFile, JSON.stringify(requests, null, 2), 'utf8');
console.log(`[generate-requests] wrote ${requests.length} requests -> ${outFile}`);
