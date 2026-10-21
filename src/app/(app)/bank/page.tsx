import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BankPage() {
  const ctx = await requirePermission("bank.view");

  const [accounts, transactions, lowBalance] = await Promise.all([
    prisma.bankAccount.findMany({
      where: { companyId: ctx.company.id, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, bankName: true, accountNumber: true, currency: true, openingBalance: true },
    }),
    prisma.bankTransaction.findMany({
      where: { bankAccount: { companyId: ctx.company.id } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 10,
      include: { bankAccount: { select: { name: true, accountNumber: true } } },
    }),
    prisma.bankAccount.findMany({
      where: { companyId: ctx.company.id, isActive: true, openingBalance: { lt: 0 } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, bankName: true, openingBalance: true },
      take: 5,
    }),
  ]);

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.openingBalance), 0);

  return (
    <div>
      <PageHeader title="Kas & Bank" description="Kelola rekening kas, bank, transaksi, dan rekonsiliasi." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Total Rekening</p>
          <p className="text-2xl font-bold text-slate-900">{accounts.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Total Saldo Awal</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalBalance)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Transaksi Terbaru</p>
          <p className="text-2xl font-bold text-slate-900">{transactions.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Saldo Negatif</p>
          <p className="text-2xl font-bold text-red-600">{lowBalance.length}</p>
        </Card>
      </div>

      {lowBalance.length > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-red-800">⚠ Rekening Saldo Negatif ({lowBalance.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-100 text-left text-xs uppercase tracking-wide text-red-700">
                <tr>
                  <th className="px-4 py-2 font-medium">Nama</th>
                  <th className="px-4 py-2 font-medium">Bank</th>
                  <th className="px-4 py-2 text-right font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {lowBalance.map((a) => (
                  <tr key={a.id} className="hover:bg-red-50/50">
                    <td className="px-4 py-2 text-red-800">{a.name}</td>
                    <td className="px-4 py-2 text-red-600">{a.bankName || "-"}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium text-red-600">{a.openingBalance.toString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/bank/accounts" className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md">
          <p className="text-lg font-semibold text-slate-900">Rekening Bank</p>
          <p className="mt-1 text-sm text-slate-500">Kelola rekening kas & bank</p>
        </Link>
        <Link href="/bank/transactions" className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md">
          <p className="text-lg font-semibold text-slate-900">Transaksi Bank</p>
          <p className="mt-1 text-sm text-slate-500">Masuk/Keluar dana</p>
        </Link>
        <Link href="/bank/reconcile" className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md">
          <p className="text-lg font-semibold text-slate-900">Rekonsiliasi Bank</p>
          <p className="mt-1 text-sm text-slate-500">Cocokkan saldo buku & bank</p>
        </Link>
      </div>
    </div>
  );
}