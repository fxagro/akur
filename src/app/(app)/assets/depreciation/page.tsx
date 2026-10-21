import Link from "next/link";
import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { DepreciationClient } from "@/components/depreciation-client";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DepreciationPage() {
  const ctx = await requirePermission("asset.view");
  const canManage = ctx.permissions.has("asset.manage");

  const totalAssets = await prisma.fixedAsset.count({
    where: { companyId: ctx.company.id, status: "ACTIVE" },
  });

  return (
    <div>
      <PageHeader
        title="Penyusutan Aset"
        description={`Hitung dan jalankan penyusutan bulanan untuk ${totalAssets} aset aktif.`}
      >
        <Link
          href="/assets"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Kembali ke Aset
        </Link>
      </PageHeader>

      <Card className="p-5">
        <DepreciationClient canManage={canManage} />
      </Card>
    </div>
  );
}