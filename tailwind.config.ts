import type { Config } from 'tailwindcss';

/**
 * CSS 変数ベースのハイブリッド構成:
 *   - colors は globals.css の :root 変数を参照
 *   - 余白・flex・gap・text は従来どおり Tailwind ユーティリティを継続
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        background: 'var(--bg)',
        foreground: 'var(--text)',
        elev: 'var(--bg-elev)',
        hover: 'var(--bg-hover)',
        primary: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)',
          text: 'var(--accent-text)',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: 'var(--bg-muted)',
          foreground: 'var(--text-muted)',
        },
        subtle: 'var(--text-subtle)',
        status: {
          pending: 'var(--status-pending)',
          'pending-bg': 'var(--status-pending-bg)',
          inprogress: 'var(--status-inprogress)',
          'inprogress-bg': 'var(--status-inprogress-bg)',
          completed: 'var(--status-completed)',
          'completed-bg': 'var(--status-completed-bg)',
        },
        warn: {
          bg: 'var(--warn-bg)',
          'bg-soft': 'var(--warn-bg-soft)',
          border: 'var(--warn-border)',
          text: 'var(--warn-text)',
        },
        err: {
          bg: 'var(--err-bg)',
          'bg-soft': 'var(--err-bg-soft)',
          border: 'var(--err-border)',
          text: 'var(--err-text)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'SF Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
