// aidw-ocr-abstraction: 詳細画面（ServerComponent: generateStaticParams のみ）
// 実体は OcrAbstractionDetailClient.tsx（client component）
//
// production build（output: 'export'）時は全プロファイル x 全サンプルの requestId を SSG する。
// 動的パラメータ拒否は false にし、未知IDは client 側で「見つかりません」表示。

import { PROFILES } from '@/profiles';
import { OcrAbstractionDetailClient } from './OcrAbstractionDetailClient';

export function generateStaticParams() {
  const params: { requestId: string }[] = [];
  const seen = new Set<string>();
  for (const profile of Object.values(PROFILES)) {
    for (const raw of profile.ocrSamples) {
      const env = profile.ocrSchema.toEnvelope(raw);
      const reqId = env.meta.requestId;
      if (reqId && !seen.has(reqId)) {
        seen.add(reqId);
        params.push({ requestId: reqId });
      }
    }
  }
  return params;
}

export const dynamicParams = false;

export default function OcrAbstractionDetailPage({
  params,
}: {
  params: { requestId: string };
}) {
  return <OcrAbstractionDetailClient key={params.requestId} requestId={params.requestId} />;
}
