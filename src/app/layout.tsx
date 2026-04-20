import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { RootProviders } from './_providers/RootProviders';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'AIDW UI Mock',
  description: 'AIDW HITL UX Mock prototype',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ja"
      data-sidebar="light"
      data-density="comfortable"
      data-warn-style="bg"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
