import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { DepreciationClient } from "@/components/depreciation-client";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DepreciationPage() {
  const ctx = await requirePermission("asset.view");
  const canManage = ctx.permissions.has("asset.manage");

  const rows = await prisma.fixedAsset.findMany({
    where: { companyId: ctx.company.id, status: "ACTIVE" },
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      acquisitionDate: true,
      acquisitionCost: true,
      usefulLifeMonths: true,
      salvageValue: true,
      method: true,
      accumulatedDepreciation: true,
      bookValue: true,
      disposedAt: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Penyusutan Aset"
        description="Hitung dan jalankan penyusutan bulanan untuk aset aktif."
      >
        <a
          href="/assets"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Kembali ke Aset
        </a>
      </PageHeader>

      <Card className="p-5">
        <DepreciationClient rows={rows.map((r) => ({ ...r, bookValue: r.bookValue.toString() }))} canManage={ctx.permissions.has("asset.manage")} />
      </Card>
    </div>
  );
}