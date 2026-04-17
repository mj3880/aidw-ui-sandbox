// Copy pdfjs-dist worker file into public/pdfjs so PDF.js can load it via /pdfjs/...
import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const dstDir = path.join(root, 'public', 'pdfjs');
await mkdir(dstDir, { recursive: true });

// Locate pdfjs-dist installation
let pdfjsDir;
try {
  // pdfjs-dist v4 ships ESM build at build/pdf.worker.min.mjs
  // Use require.resolve to locate package.json
  const pkgPath = require.resolve('pdfjs-dist/package.json');
  pdfjsDir = path.dirname(pkgPath);
} catch (e) {
  console.warn('[copy-pdf-worker] pdfjs-dist not installed yet, skipping');
  process.exit(0);
}

const candidates = [
  'build/pdf.worker.min.mjs',
  'build/pdf.worker.mjs',
  'build/pdf.worker.min.js',
  'build/pdf.worker.js',
];

let copied = false;
for (const candidate of candidates) {
  const srcPath = path.join(pdfjsDir, candidate);
  if (existsSync(srcPath)) {
    const ext = path.extname(srcPath); // .mjs or .js
    const dstName = `pdf.worker.min${ext}`;
    const dstPath = path.join(dstDir, dstName);
    await cp(srcPath, dstPath);
    console.log(`[copy-pdf-worker] copied ${srcPath} -> ${dstPath}`);
    copied = true;
    // Always also expose as .mjs so React app can pick a stable URL
    if (ext !== '.mjs') {
      const aliasPath = path.join(dstDir, 'pdf.worker.min.mjs');
      await cp(srcPath, aliasPath);
      console.log(`[copy-pdf-worker] aliased -> ${aliasPath}`);
    }
    break;
  }
}

if (!copied) {
  console.error('[copy-pdf-worker] failed to find pdfjs worker file');
  process.exit(1);
}
