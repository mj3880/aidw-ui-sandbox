// Copy samples/ into public/samples/ so Next.js static export can serve them.
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'samples');
const dst = path.join(root, 'public', 'samples');

if (!existsSync(src)) {
  console.error(`[prebuild-samples] source directory not found: ${src}`);
  process.exit(1);
}

console.log('[prebuild-samples] start');
console.log(`  src: ${src}`);
console.log(`  dst: ${dst}`);

await rm(dst, { recursive: true, force: true });
await mkdir(dst, { recursive: true });
await cp(src, dst, { recursive: true });

console.log('[prebuild-samples] success');
