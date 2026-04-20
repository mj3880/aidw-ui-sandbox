import { LoginForm } from './_components/LoginForm';

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        background: 'var(--bg)',
      }}
    >
      {/* Brand panel */}
      <div
        style={{
          background: 'linear-gradient(135deg, oklch(0.25 0.09 260), oklch(0.38 0.13 260))',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            AI
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>AIDW Console</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Human-in-the-Loop Confirmation Platform
            </div>
          </div>
        </div>
        <div>
          <h1
            style={{
              fontSize: 34,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            OCR結果を
            <br />
            確実に、素早く。
          </h1>
          <p
            style={{
              marginTop: 16,
              fontSize: 15,
              opacity: 0.85,
              lineHeight: 1.6,
              maxWidth: 420,
            }}
          >
            FAX注文書のOCR抽出結果を人の目で確認し、取引先・納品先・明細を
            ステップバイステップで検証するワークフローUI。
          </p>
          <div
            style={{
              marginTop: 40,
              display: 'flex',
              gap: 24,
              fontSize: 12,
              opacity: 0.7,
            }}
          >
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, opacity: 1 }}>143</div>
              <div>本日の依頼件数</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, opacity: 1 }}>5</div>
              <div>稼働中メンバー</div>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, opacity: 0.5 }}>
          © 2026 AIDW Mock · UX Discussion Prototype
        </div>
      </div>

      {/* Form panel */}
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          padding: 40,
        }}
      >
        <LoginForm />
      </div>
    </div>
  );
}
