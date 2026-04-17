import { readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { FaxDetailClient } from './_components/FaxDetailClient';

// Statically pre-render all known fax requests for `output: 'export'`.
export function generateStaticParams() {
  // public/samples/fax is populated by prebuild scripts before next build runs.
  const dir = path.join(process.cwd(), 'public', 'samples', 'fax');
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith('.pdf'));
  return files.map((f) => ({ requestId: f.replace(/\.pdf$/, '') }));
}

export const dynamicParams = false;

export default function FaxDetailPage({ params }: { params: { requestId: string } }) {
  return <FaxDetailClient requestId={params.requestId} />;
}
