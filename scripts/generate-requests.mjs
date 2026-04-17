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
const customers = parseCsv(customersCsv);
const products = parseCsv(productsCsv);

// Normalize product code to 7 digits
function pad7(s) {
  const digits = String(s).replace(/\D/g, '');
  return digits.padStart(7, '0');
}

const productList = products.map((p) => ({
  productCode: pad7(p['商品CD']),
  productName: p['商品名'],
}));

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
  if ((status === 'done' || status === 'in_progress') && !assigneeUserId) {
    assigneeUserId = assigneeKind === 'selfteam' ? SELF_USER : pick(OTHER_USERS);
  }

  const receivedOffset = Math.floor(rand() * SEVEN_DAYS);
  const receivedAt = new Date(NOW - receivedOffset).toISOString();
  const orderDate = new Date(NOW - receivedOffset - randInt(0, 2) * 86400000)
    .toISOString().slice(0, 10);
  const deliveryDate = new Date(NOW - receivedOffset + randInt(1, 5) * 86400000)
    .toISOString().slice(0, 10);

  // 1〜10 line items
  const lineCount = randInt(1, 10);
  const lineItems = [];
  for (let i = 0; i < lineCount; i++) {
    const product = productList[Math.floor(rand() * productList.length)];
    const isLow = rand() < 0.3;
    const baseUnit = randInt(1000, 8000);
    // Occasionally add big drift to surface warning/error display
    const driftRoll = rand();
    let unitPrice = baseUnit;
    if (driftRoll < 0.1) unitPrice = Math.round(baseUnit * 1.4);
    else if (driftRoll < 0.2) unitPrice = Math.round(baseUnit * 0.85);

    lineItems.push({
      lineItemId: `${requestId}-L${String(i + 1).padStart(2, '0')}`,
      productCode: product.productCode,
      productName: product.productName,
      quantity: randInt(1, 50),
      unitPrice,
      isLowConfidence: isLow,
    });
  }

  return {
    requestId,
    pdfFile: file,
    customerId: customer.customer_id,
    deliveryLocation: `${customer.customer_name} 本店`,
    receivedAt,
    orderDate,
    deliveryDate,
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
