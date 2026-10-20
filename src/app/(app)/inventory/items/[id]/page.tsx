import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, PageHeader, Label } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InventoryItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("inventory.view");
  const { id } = await params;

  const item = await prisma.item.findFirst({
    where: { id, companyId: ctx.company.id },
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      uom: true,
      purchasePrice: true,
      salePrice: true,
      avgCost: true,
      stockQty: true,
      minStock: true,
      categoryId: true,
      defaultWarehouseId: true,
      inventoryAccountId: true,
      isActive: true,
      category: { select: { id: true, name: true } },
      defaultWarehouse: { select: { id: true, code: true, name: true } },
      inventoryAccount: { select: { id: true, code: true, name: true } },
    },
  });

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Item tidak ditemukan.</p>
      </div>
    );
  }

  const movements = await prisma.stockMovement.findMany({
    where: { itemId: item.id, companyId: ctx.company.id },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { warehouse: { select: { code: true, name: true } } },
    take: 200,
  });

  const whBalances = await prisma.stockMovement.groupBy({
    by: ["warehouseId"],
    where: { itemId: item.id, companyId: ctx.company.id },
    _max: { balanceQty: true },
    _sum: { qty: true },
  });

  const whDetails = await prisma.warehouse.findMany({
    where: { companyId: ctx.company.id, id: { in: whBalances.map((b) => b.warehouseId) } },
    select: { id: true, code: true, name: true },
  });
  const whMap = new Map(whDetails.map((w) => [w.id, w]));

  return (
    <div>
      <PageHeader
        title={`Item: ${item.code} - ${item.name}`}
        description={`Tipe: ${item.type} · Satuan: ${item.uom} · Kategori: ${item.category?.name || "-"}`}
      >
        <Link
          href="/inventory/items"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Kembali
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="p-4">
          <Label>Harga Beli</Label>
          <p className="text-slate-800 font-semibold">{formatCurrency(item.purchasePrice.toString())}</p>
        </Card>
        <Card className="p-4">
          <Label>Harga Jual</Label>
          <p className="text-emerald-600 font-semibold">{formatCurrency(item.salePrice.toString())}</p>
        </Card>
        <Card className="p-4">
          <Label>HPP Rata-rata</Label>
          <p className="text-slate-800 font-semibold">{formatCurrency(item.avgCost.toString())}</p>
        </Card>
        <Card className="p-4">
          <Label>Total Stok Global</Label>
          <p className="text-slate-900 font-bold text-lg">{item.stockQty.toString()} {item.uom}</p>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Saldo per Gudang</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Gudang</th>
                <th className="px-4 py-2.5 text-right font-medium">Saldo</th>
                <th className="px-4 py-2.5 text-right font-medium">Nilai (HPP rata-rata)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {whBalances.map((b) => {
                const wh = whMap.get(b.warehouseId);
                const qty = b._max.balanceQty ?? 0;
                const value = Number(qty) * Number(item.avgCost);
                return (
                  <tr key={b.warehouseId} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2 text-slate-700">{wh?.code} - {wh?.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-800">{qty.toString()}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">{formatCurrency(value)}</td>
                  </tr>
                );
              })}
              <tr className="bg-slate-50 font-semibold">
                <td className="px-4 py-2 text-slate-700">Total</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-900">{item.stockQty.toString()}</td>
                <td className="px-4 py-2 text-right tabular-nums text-emerald-700">{formatCurrency(Number(item.stockQty) * Number(item.avgCost))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Riwayat Gerakan Stok (200 terbaru)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Tanggal</th>
                <th className="px-4 py-2.5 font-medium">Gudang</th>
                <th className="px-4 py-2.5 font-medium">Jenis</th>
                <th className="px-4 py-2.5 text-right font-medium">Qty</th>
                <th className="px-4 py-2.5 text-right font-medium">Harga</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
                <th className="px-4 py-2.5 text-right font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-2 text-slate-600">{formatDate(m.date)}</td>
                  <td className="px-4 py-2 text-slate-600">{m.warehouse.code} - {m.warehouse.name}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                      m.direction === "IN" ? "bg-emerald-100 text-emerald-700" :
                      m.direction === "OUT" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {m.direction}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-800">{m.qty.toString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-600">{formatCurrency(m.unitCost.toString())}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-600">{formatCurrency(m.totalCost.toString())}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-900">{m.balanceQty.toString()}</td>
                </tr>
              ))}
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Belum ada gerakan stok untuk item ini.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}