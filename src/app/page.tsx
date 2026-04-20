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
            <div style={{ fontSize: 12, opacity: 0.7 }}>管理画面</div>
          </div>
        </div>
        <div>
          <div
            style={{
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
