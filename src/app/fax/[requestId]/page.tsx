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
  // requestId 変更時に FaxDetailClient を強制再マウントし、step/draft/PdfPane 等の
  // 状態を完全にリセットする。同一動的セグメント間の soft 遷移ではコンポーネントが
  // 再利用されるため、key 指定がないと前依頼の Step5 完了画面・古い draft・前 PDF
  // ドキュメントの後始末競合が新依頼ページに残り、react-pdf 由来の TypeError を招く。
  return <FaxDetailClient key={params.requestId} requestId={params.requestId} />;
}
