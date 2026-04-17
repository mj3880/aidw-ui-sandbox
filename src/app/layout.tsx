import type { Metadata } from 'next';
import './globals.css';
import { RootProviders } from './_providers/RootProviders';

export const metadata: Metadata = {
  title: 'AIDW UI Mock',
  description: 'AIDW HITL UX Mock prototype',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
