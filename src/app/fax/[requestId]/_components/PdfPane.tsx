'use client';

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, Minus, Plus, RotateCcw, RotateCw } from 'lucide-react';

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

const SCALE_MIN = 0.25;
const SCALE_MAX = 4.0;
const SCALE_STEP = 0.25;

const clampScale = (value: number): number =>
  Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round(value * 100) / 100));

// ネスト三項演算子を避けるため if 分岐で実装
const resolveCursorClass = (pan: boolean, dragging: boolean): string => {
  if (!pan) return '';
  return dragging ? 'cursor-grabbing' : 'cursor-grab';
};

// scale 変更以外で PDF ページを再ラスタライズさせないための memo 分離
interface MemoizedPageProps {
  pageNumber: number;
  width: number;
}

const MemoizedPage = memo(function MemoizedPage({ pageNumber, width }: MemoizedPageProps) {
  return (
    <Page
      pageNumber={pageNumber}
      width={width}
      renderAnnotationLayer={false}
      renderTextLayer={false}
    />
  );
});

export function PdfPane({ pdfUrl }: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [width, setWidth] = useState<number>(600);

  const [scale, setScale] = useState<number>(1.0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStartRef = useRef<{
    x: number;
    y: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  // ドラッグ中の transform を DOM に直接書き込むための参照
  const transformRef = useRef<HTMLDivElement | null>(null);
  // useCallback 依存配列に offset を含めず最新値を参照するための安定 ref
  const latestOffsetRef = useRef(offset);
  useLayoutEffect(() => {
    latestOffsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    void configureWorker();
  }, []);

  useEffect(() => {
    const measure = () => {
      const el = viewportRef.current;
      if (el) setWidth(Math.max(300, el.clientWidth - 32));
    };
    measure();

    let rafId: number | null = null;
    const onResize = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        measure();
      });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    setError(null);
    setNumPages(null);
  }, [pdfUrl, retryNonce]);

  const zoomIn = useCallback(() => {
    setScale((prev) => clampScale(prev + SCALE_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => clampScale(prev - SCALE_STEP));
  }, []);

  const resetView = useCallback(() => {
    setScale(1.0);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Ctrl/Cmd + wheel でズーム。React の onWheel は passive なので preventDefault できず、
  // native addEventListener(passive:false) で登録する必要がある。
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const direction = e.deltaY < 0 ? 1 : -1;
      setScale((prev) => clampScale(prev + direction * SCALE_STEP));
    };

    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (scale <= 1.0) return;
      // 左クリックのみ
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const current = latestOffsetRef.current;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startPanX: current.x,
        startPanY: current.y,
      };
      setIsDragging(true);
    },
    [scale],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    // ドラッグ中は state を更新せず、DOMに直接 transform を適用して再レンダを避ける
    const el = transformRef.current;
    if (el) {
      el.style.transform = `translate(${start.startPanX + dx}px, ${start.startPanY + dy}px)`;
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    // 最終位置を state に同期（以降の通常レンダで transform が維持される）
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (transformRef.current) {
      transformRef.current.style.transform = '';
    }
    setOffset({ x: start.startPanX + dx, y: start.startPanY + dy });
    dragStartRef.current = null;
    setIsDragging(false);
  }, []);

  const panEnabled = scale > 1.0;
  const cursorClass = resolveCursorClass(panEnabled, isDragging);

  const scalePercent = Math.round(scale * 100);
  const canZoomIn = scale < SCALE_MAX;
  const canZoomOut = scale > SCALE_MIN;

  return (
    <div
      ref={viewportRef}
      className="relative h-full w-full overflow-auto bg-slate-100"
    >
      {/* ツールバー */}
      <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={zoomOut}
          disabled={!canZoomOut}
          aria-label="縮小"
          className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          onClick={zoomIn}
          disabled={!canZoomIn}
          aria-label="拡大"
          className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-4" />
        </button>
        <div
          className="min-w-[3.5rem] px-2 text-center text-xs font-medium tabular-nums text-slate-700"
          aria-live="polite"
        >
          {scalePercent}%
        </div>
        <button
          type="button"
          onClick={resetView}
          aria-label="100%にリセット"
          className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw className="size-3" />
          100%
        </button>
      </div>

      <div className={['p-4', cursorClass].filter(Boolean).join(' ')}>
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
          <div
            ref={transformRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px)`,
              transformOrigin: '0 0',
              touchAction: panEnabled ? 'none' : 'auto',
            }}
          >
            <Document
              key={`${pdfUrl}-${retryNonce}`}
              file={pdfUrl}
              onLoadSuccess={({ numPages: n }) => {
                setNumPages(n);
              }}
              onLoadError={(e) => {
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
                  <MemoizedPage pageNumber={i + 1} width={width * scale} />
                </div>
              ))}
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}
