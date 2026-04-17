'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, RotateCw } from 'lucide-react';

// Dynamically load react-pdf to avoid SSR issues.
const Document = dynamic(() => import('react-pdf').then((m) => m.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then((m) => m.Page), { ssr: false });

let workerConfigured = false;
async function configureWorker() {
  if (workerConfigured) return;
  const { pdfjs } = await import('react-pdf');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
  workerConfigured = true;
}

interface Props {
  pdfUrl: string;
}

export function PdfPane({ pdfUrl }: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [width, setWidth] = useState<number>(600);

  useEffect(() => {
    void configureWorker();
  }, []);

  useEffect(() => {
    const measure = () => {
      const el = document.getElementById('pdf-pane-host');
      if (el) setWidth(Math.max(300, el.clientWidth - 32));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    setError(null);
    setNumPages(null);
  }, [pdfUrl, retryNonce]);

  return (
    <div id="pdf-pane-host" className="h-full w-full overflow-auto bg-slate-100 p-4">
      {error ? (
        <div className="flex flex-col items-center justify-center text-center gap-3 p-8 bg-white border border-red-200 rounded-md">
          <AlertTriangle className="size-8 text-red-500" />
          <div className="text-sm text-red-700">PDFを読み込めませんでした</div>
          <div className="text-xs text-slate-500 break-all">{error}</div>
          <button
            type="button"
            onClick={() => setRetryNonce((n) => n + 1)}
            className="inline-flex items-center gap-1 rounded bg-blue-600 text-white text-xs px-3 py-1.5 hover:bg-blue-700"
          >
            <RotateCw className="size-3" />
            リトライ
          </button>
        </div>
      ) : (
        <Document
          key={`${pdfUrl}-${retryNonce}`}
          file={pdfUrl}
          onLoadSuccess={({ numPages: n }) => {
            console.info('PdfPane.onLoadSuccess', { pdfUrl, numPages: n });
            setNumPages(n);
          }}
          onLoadError={(e) => {
            console.error('PdfPane.onLoadError', e);
            setError(e?.message ?? 'unknown');
          }}
          loading={<div className="text-sm text-slate-500 p-4">PDFを読み込み中...</div>}
          error={<div className="text-sm text-red-600 p-4">PDFの読み込みに失敗しました</div>}
        >
          {Array.from({ length: numPages ?? 0 }).map((_, i) => (
            <div
              key={`page_${i + 1}`}
              className="mb-3 shadow bg-white inline-block"
            >
              <Page
                pageNumber={i + 1}
                width={width}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </div>
          ))}
        </Document>
      )}
    </div>
  );
}
