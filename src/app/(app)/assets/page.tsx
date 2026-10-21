import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { AssetsClient } from "@/components/assets-client";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const ctx = await requirePermission("asset.view");
  const canManage = ctx.permissions.has("asset.manage");

  const [rows, accounts] = await Promise.all([
    prisma.fixedAsset.findMany({
      where: { companyId: ctx.company.id },
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        status: true,
        acquisitionDate: true,
        acquisitionCost: true,
        usefulLifeMonths: true,
        salvageValue: true,
        method: true,
        accumulatedDepreciation: true,
        bookValue: true,
      },
    }),
    prisma.account.findMany({
      where: { companyId: ctx.company.id, isActive: true, isGroup: false },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  const formatted = rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    category: r.category,
    status: r.status,
    acquisitionDate: r.acquisitionDate.toISOString().slice(0, 10),
    acquisitionCost: r.acquisitionCost.toString(),
    usefulLifeMonths: r.usefulLifeMonths,
    salvageValue: r.salvageValue.toString(),
    method: r.method,
    accumulatedDepreciation: r.accumulatedDepreciation.toString(),
    bookValue: r.bookValue.toString(),
  }));

  return (
    <div>
      <PageHeader
        title="Aset Tetap"
        description="Kelola aset tetap dan hitung penyusutan otomatis."
      />

      <Card className="p-5">
        <AssetsClient rows={formatted} accounts={accounts.map((a) => ({ id: a.id, code: a.code, name: a.name }))} canManage={canManage} />
      </Card>
    </div>
  );
}