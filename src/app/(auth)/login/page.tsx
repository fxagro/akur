import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth-context";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const ctx = await getAuthContext();
  if (ctx) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
            AC
          </div>
          <h1 className="text-xl font-semibold text-slate-900">AccurateClone</h1>
          <p className="mt-1 text-sm text-slate-500">
            Aplikasi Akuntansi Multi-Perusahaan
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Demo: admin@accurate.local / admin123
        </p>
      </div>
    </div>
  );
}
