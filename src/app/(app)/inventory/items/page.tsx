import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { ItemsClient } from "@/components/inventory-items-client";

export const dynamic = "force-dynamic";

export default async function InventoryItemsPage() {
  const ctx = await requirePermission("inventory.view");
  const canManage = ctx.permissions.has("inventory.manage");

  const [items, categories, warehouses, accounts] = await Promise.all([
    prisma.item.findMany({
      where: { companyId: ctx.company.id },
      orderBy: { code: "asc" },
      include: { category: true },
    }),
    prisma.itemCategory.findMany({
      where: { companyId: ctx.company.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.warehouse.findMany({
      where: { companyId: ctx.company.id, isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.account.findMany({
      where: { companyId: ctx.company.id, isActive: true, isGroup: false, type: "ASSET" },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Item (Barang & Jasa)"
        description="Master data produk persediaan & jasa untuk transaksi."
      />

      <Card className="p-5">
        <ItemsClient
          rows={items}
          categories={categories}
          warehouses={warehouses}
          accounts={accounts}
          canManage={canManage}
        />
      </Card>
    </div>
  );
}