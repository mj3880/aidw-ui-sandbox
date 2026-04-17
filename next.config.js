/** @type {import('next').NextConfig} */
// dev時に output: 'export' を有効化すると dynamic routes(/fax/[requestId]) で
// generateStaticParams 整合性エラーが発生するため、production build時のみ有効化する。
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  ...(isProd ? { output: 'export' } : {}),
  images: { unoptimized: true },
  reactStrictMode: true,
  // PDF worker via /pdfjs/pdf.worker.min.js (placed in public/)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

module.exports = nextConfig;
