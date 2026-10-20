import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { TaxCodesClient } from "@/components/tax-codes-client";

export const dynamic = "force-dynamic";

export default async function TaxCodesPage() {
  const ctx = await requirePermission("tax.view");
  const canManage = ctx.permissions.has("tax.manage");

  const rows = await prisma.taxCode.findMany({
    where: { companyId: ctx.company.id },
    orderBy: [{ type: "asc" }, { code: "asc" }],
    select: { id: true, code: true, name: true, type: true, rate: true, accountId: true, isActive: true },
  });
  const formattedRows = rows.map(r => ({ ...r, rate: r.rate.toString() }));

  return (
    <div>
      <PageHeader
        title="Kode Pajak (PPN / PPh)"
        description="Master kode pajak untuk transaksi & laporan SPT."
      />

      <Card className="p-5">
        <TaxCodesClient rows={formattedRows} canManage={canManage} />
      </Card>
    </div>
  );
}