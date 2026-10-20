import { requireAuth } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const ctx = await requireAuth();
  const companyId = ctx.company.id;

  const [accounts, customers, suppliers, journals, postedJournals, currentPeriod] =
    await Promise.all([
      prisma.account.count({ where: { companyId } }),
      prisma.customer.count({ where: { companyId } }),
      prisma.supplier.count({ where: { companyId } }),
      prisma.journalEntry.count({ where: { companyId } }),
      prisma.journalEntry.count({ where: { companyId, status: "POSTED" } }),
      prisma.accountingPeriod.findFirst({
        where: { companyId },
        orderBy: { startDate: "desc" },
      }),
    ]);

  const stats = [
    { label: "Akun (COA)", value: accounts },
    { label: "Pelanggan", value: customers },
    { label: "Supplier", value: suppliers },
    { label: "Jurnal", value: journals },
    { label: "Jurnal Posted", value: postedJournals },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Selamat datang, {ctx.user.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {ctx.company.name}
          {currentPeriod ? ` · Periode ${currentPeriod.name}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {s.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Role & Hak Akses Anda
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Role: <span className="font-medium text-slate-700">{ctx.role.name}</span>
          {ctx.isSuperAdmin ? " · Super Admin (akses penuh)" : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ctx.isSuperAdmin ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
              Semua akses
            </span>
          ) : (
            Array.from(ctx.permissions)
              .sort()
              .map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                >
                  {p}
                </span>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
