import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { BankTransactionsClient } from "@/components/bank-transactions-client";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function BankTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ bankAccountId?: string; date?: string; refType?: string }>;
}) {
  const ctx = await requirePermission("bank.view");
  const sp = await searchParams;
  const bankAccountId = sp.bankAccountId;
  const date = sp.date;
  const refType = sp.refType;

  const canManage = ctx.permissions.has("bank.manage");

  const where: any = { companyId: ctx.company.id };
  if (bankAccountId) where.bankAccountId = bankAccountId;
  if (refType) where.refType = refType;
  if (date) {
    const d = new Date(`${date}T00:00:00.000Z`);
    where.date = { gte: d, lte: new Date(d.getTime() + 86400000) };
  }

  const [rows, bankAccounts] = await Promise.all([
    prisma.bankTransaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { bankAccount: { select: { name: true, accountNumber: true } } },
      take: 500,
    }),
    prisma.bankAccount.findMany({
      where: { companyId: ctx.company.id, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, bankName: true, accountNumber: true },
    }),
  ]);

  const formatted = rows.map((r) => ({
    id: r.id,
    date: r.date.toISOString().slice(0, 10),
    description: r.description,
    debit: r.debit.toString(),
    credit: r.credit.toString(),
    balance: r.balance.toString(),
    isReconciled: r.isReconciled,
    refType: r.refType,
    refId: r.refId,
    bankAccountId: r.bankAccountId,
  }));

  return (
    <div>
      <PageHeader
        title="Transaksi Bank"
        description="Riwayat masuk/keluar dana per rekening bank."
      >
        <form method="get" className="flex flex-wrap items-end gap-2">
          <select
            name="bankAccountId"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            defaultValue={bankAccountId ?? ""}
          >
            <option value="">Semua Rekening</option>
            {bankAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}{a.bankName ? ` (${a.bankName})` : ""} - {a.accountNumber || "N/A"}
              </option>
            ))}
          </select>
          <select
            name="refType"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            defaultValue={refType ?? ""}
          >
            <option value="">Semua Jenis</option>
            <option value="SALES_RECEIPT">Penerimaan</option>
            <option value="PURCHASE_PAYMENT">Pembayaran</option>
            <option value="JOURNAL">Jurnal</option>
            <option value="OTHER">Lainnya</option>
          </select>
          <input
            name="date"
            type="date"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            defaultValue={date ?? ""}
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Filter
          </button>
        </form>
      </PageHeader>

      <Card className="p-5">
        <BankTransactionsClient
          rows={rows.map((r: any) => ({
            id: r.id,
            date: r.date,
            description: r.description,
            debit: r.debit,
            credit: r.credit,
            balance: r.balance,
            isReconciled: r.isReconciled,
            refType: r.refType,
            refId: r.refId,
            bankAccountId: r.bankAccountId,
          }))}
          bankAccounts={bankAccounts.map((a) => ({ id: a.id, name: a.name, bankName: a.bankName, accountNumber: a.accountNumber ?? "" }))}
          canManage={canManage}
        />
      </Card>
    </div>
  );
}