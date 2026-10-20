import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { MovementsClient } from "@/components/inventory-movements-client";

export const dynamic = "force-dynamic";

export default async function InventoryMovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ itemId?: string; warehouseId?: string; direction?: string }>;
}) {
  const ctx = await requirePermission("inventory.view");
  const sp = await searchParams;
  const itemId = sp.itemId;
  const warehouseId = sp.warehouseId;
  const direction = sp.direction;

  const canManage = ctx.permissions.has("inventory.manage");

  const where: Record<string, unknown> = { companyId: ctx.company.id };
  if (itemId) where.itemId = itemId;
  if (warehouseId) where.warehouseId = warehouseId;
  if (direction) where.direction = direction;

  const [rows, items, warehouses] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        item: { select: { id: true, code: true, name: true, uom: true } },
        warehouse: { select: { id: true, code: true, name: true } },
      },
      take: 500,
    }),
    prisma.item.findMany({
      where: { companyId: ctx.company.id, isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true, uom: true },
    }),
    prisma.warehouse.findMany({
      where: { companyId: ctx.company.id, isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Gerakan Stok"
        description="Riwayat masuk/keluar/penyesuaian stok per item per gudang."
      >
        <form method="get" className="flex flex-wrap items-end gap-2">
          <select
            name="itemId"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            defaultValue={itemId ?? ""}
          >
            <option value="">Semua Item</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.code} - {i.name}</option>
            ))}
          </select>
          <select
            name="warehouseId"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            defaultValue={warehouseId ?? ""}
          >
            <option value="">Semua Gudang</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
            ))}
          </select>
          <select
            name="direction"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            defaultValue={direction ?? ""}
          >
            <option value="">Semua Jenis</option>
            <option value="IN">Masuk</option>
            <option value="OUT">Keluar</option>
            <option value="ADJUST">Penyesuaian</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Filter
          </button>
        </form>
      </PageHeader>

      <Card className="p-5">
        <MovementsClient
          rows={rows}
          items={items}
          warehouses={warehouses}
          canManage={canManage}
        />
      </Card>
    </div>
  );
}