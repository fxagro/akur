import Link from "next/link";
import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { ReconciliationClient } from "@/components/bank-reconciliation-client";

export const dynamic = "force-dynamic";

export default async function BankReconcilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("bank.view");
  const { id } = await params;

  const canManage = ctx.permissions.has("bank.manage");

  const bankAccount = await prisma.bankAccount.findFirst({
    where: { id, companyId: ctx.company.id },
    select: { id: true, name: true, bankName: true, accountNumber: true },
  });

  if (!bankAccount) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Rekening bank tidak ditemukan.</p>
      </div>
    );
  }

  const displayName = `${bankAccount.name}${bankAccount.bankName ? ` (${bankAccount.bankName})` : ""}`;

  return (
    <div>
      <PageHeader
        title={`Rekonsiliasi: ${displayName}`}
        description="Cocokkan saldo buku dengan pernyataan bank (bank statement)."
      >
        <Link
          href="/bank/transactions"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Kembali
        </Link>
      </PageHeader>

      <Card className="p-5">
        <ReconciliationClient bankAccountId={id} canManage={canManage} />
      </Card>
    </div>
  );
}