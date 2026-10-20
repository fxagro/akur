import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { WarehousesClient } from "@/components/inventory-warehouses-client";

export const dynamic = "force-dynamic";

export default async function InventoryWarehousesPage() {
  const ctx = await requirePermission("inventory.view");
  const canManage = ctx.permissions.has("inventory.manage");

  const rows = await prisma.warehouse.findMany({
    where: { companyId: ctx.company.id },
    orderBy: { code: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Gudang"
        description="Lokasi penyimpanan stok untuk pergerakan barang."
      />

      <Card className="p-5">
        <WarehousesClient rows={rows} canManage={canManage} />
      </Card>
    </div>
  );
}