import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { BankAccountsClient } from "@/components/bank-accounts-client";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function BankAccountsPage() {
  const ctx = await requirePermission("bank.view");
  const canManage = ctx.permissions.has("bank.manage");

  const [rows, accounts] = await Promise.all([
    prisma.bankAccount.findMany({
      where: { companyId: ctx.company.id },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        bankName: true,
        accountNumber: true,
        accountId: true,
        currency: true,
        openingBalance: true,
        isActive: true,
        _count: { select: { transactions: true } },
      },
    }),
    prisma.account.findMany({
      where: { companyId: ctx.company.id, isActive: true, isGroup: false, type: "ASSET" },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  const formatted = rows.map((r) => ({
    id: r.id,
    name: r.name,
    bankName: r.bankName,
    accountNumber: r.accountNumber,
    accountId: r.accountId,
    currency: r.currency,
    openingBalance: r.openingBalance.toString(),
    isActive: r.isActive,
    transactionCount: r._count.transactions,
    accountCode: "",
    accountName: "",
  }));

  // enrich with account code/name
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  formatted.forEach((r) => {
    const acc = accountMap.get(r.accountId);
    if (acc) {
      r.accountCode = acc.code;
      r.accountName = acc.name;
    }
  });

  return (
    <div>
      <PageHeader
        title="Rekening Bank"
        description="Kelola rekening kas dan bank untuk transaksi keuangan."
      />

      <Card className="p-5">
        <BankAccountsClient rows={formatted} accounts={accounts.map((a) => ({ id: a.id, code: a.code, name: a.name }))} canManage={canManage} />
      </Card>
    </div>
  );
}