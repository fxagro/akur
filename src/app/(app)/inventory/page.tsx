import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const ctx = await requirePermission("inventory.view");

  const [items, categories, warehouses, lowStock] = await Promise.all([
    prisma.item.findMany({
      where: { companyId: ctx.company.id, isActive: true, type: "INVENTORY" },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true, stockQty: true, avgCost: true, minStock: true },
    }),
    prisma.itemCategory.count({ where: { companyId: ctx.company.id } }),
    prisma.warehouse.count({ where: { companyId: ctx.company.id, isActive: true } }),
    prisma.item.findMany({
      where: { companyId: ctx.company.id, isActive: true, type: "INVENTORY", stockQty: { lt: prisma.item.fields.minStock } },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true, stockQty: true, minStock: true },
      take: 10,
    }),
  ]);

  const totalValue = items.reduce((a, i) => a + Number(i.stockQty) * Number(i.avgCost), 0);
  const totalItems = items.length;

  return (
    <div>
      <PageHeader title="Persediaan" description="Ringkasan stok & nilai persediaan." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Total Item</p>
          <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Total Kategori</p>
          <p className="text-2xl font-bold text-slate-900">{categories}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Gudang Aktif</p>
          <p className="text-2xl font-bold text-slate-900">{warehouses}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Nilai Persediaan</p>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalValue)}</p>
        </Card>
      </div>

      {lowStock.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-amber-800">⚠ Stok Rendah ({lowStock.length} item)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-amber-100 text-left text-xs uppercase tracking-wide text-amber-700">
                <tr>
                  <th className="px-4 py-2 font-medium">Kode</th>
                  <th className="px-4 py-2 font-medium">Nama</th>
                  <th className="px-4 py-2 text-right font-medium">Stok</th>
                  <th className="px-4 py-2 text-right font-medium">Minimal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {lowStock.map((i) => (
                  <tr key={i.id} className="hover:bg-amber-50/50">
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-amber-700">{i.code}</td>
                    <td className="px-4 py-2 text-amber-800">{i.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium text-red-600">{i.stockQty.toString()}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-amber-700">{i.minStock.toString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/inventory/items"
          className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md"
        >
          <p className="text-lg font-semibold text-slate-900">Master Item</p>
          <p className="mt-1 text-sm text-slate-500">Kelola barang & jasa</p>
        </Link>
        <Link
          href="/inventory/categories"
          className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md"
        >
          <p className="text-lg font-semibold text-slate-900">Kategori</p>
          <p className="mt-1 text-sm text-slate-500">Kelompokkan item</p>
        </Link>
        <Link
          href="/inventory/warehouses"
          className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md"
        >
          <p className="text-lg font-semibold text-slate-900">Gudang</p>
          <p className="mt-1 text-sm text-slate-500">Lokasi stok</p>
        </Link>
        <Link
          href="/inventory/movements"
          className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md"
        >
          <p className="text-lg font-semibold text-slate-900">Gerakan Stok</p>
          <p className="mt-1 text-sm text-slate-500">Masuk/Keluar/Opname</p>
        </Link>
      </div>
    </div>
  );
}