import { LoginForm } from './_components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-center mb-1">AIDW UI Mock</h1>
          <p className="text-center text-sm text-slate-500 mb-6">HITL確認業務UX検証用プロトタイプ</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
