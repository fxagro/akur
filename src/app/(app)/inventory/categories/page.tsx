import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { CategoriesClient } from "@/components/inventory-categories-client";

export const dynamic = "force-dynamic";

export default async function InventoryCategoriesPage() {
  const ctx = await requirePermission("inventory.view");
  const canManage = ctx.permissions.has("inventory.manage");

  const rows = await prisma.itemCategory.findMany({
    where: { companyId: ctx.company.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Kategori Item"
        description="Kelompokkan item persediaan untuk laporan & analisis."
      />

      <Card className="p-5">
        <CategoriesClient rows={rows} canManage={canManage} />
      </Card>
    </div>
  );
}