"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveItem,
  toggleItemActive,
  deleteItem,
} from "@/lib/actions/inventory-actions";
import { Card, EmptyState, Input, Label, Select, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { Prisma } from "@/generated/prisma/client";

type ItemRow = {
  id: string;
  code: string;
  name: string;
  type: "INVENTORY" | "SERVICE";
  uom: string;
  purchasePrice: Prisma.Decimal;
  salePrice: Prisma.Decimal;
  avgCost: Prisma.Decimal;
  stockQty: Prisma.Decimal;
  minStock: Prisma.Decimal;
  categoryId: string | null;
  category?: { id: string; name: string } | null;
  defaultWarehouseId: string | null;
  defaultWarehouse?: { id: string; code: string; name: string } | null;
  inventoryAccountId: string | null;
  isActive: boolean;
};

export function ItemsClient({
  rows,
  categories,
  warehouses,
  accounts,
  canManage,
}: {
  rows: ItemRow[];
  categories: { id: string; name: string }[];
  warehouses: { id: string; code: string; name: string }[];
  accounts: { id: string; code: string; name: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<{
    id?: string;
    code: string;
    name: string;
    categoryId: string;
    type: "INVENTORY" | "SERVICE";
    uom: string;
    purchasePrice: string;
    salePrice: string;
    minStock: string;
    defaultWarehouseId: string;
    inventoryAccountId: string;
    isActive: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch(p: Partial<typeof form>) {
    setForm((prev) => (prev ? { ...prev, ...p } : prev));
  }

  function submit() {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const res = await saveItem({
        id: form.id,
        code: form.code,
        name: form.name,
        categoryId: form.categoryId,
        type: form.type,
        uom: form.uom,
        purchasePrice: Number(form.purchasePrice) || 0,
        salePrice: Number(form.salePrice) || 0,
        minStock: Number(form.minStock) || 0,
        defaultWarehouseId: form.defaultWarehouseId,
        inventoryAccountId: form.inventoryAccountId,
        isActive: form.isActive,
      });
      if (res.ok) { setForm(null); router.refresh(); }
      else { setError(res.error); }
    });
  }

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) alert(res.error ?? "Gagal");
      else router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        {canManage ? (
          <button
            onClick={() => {
              setError(null);
              setForm({ code: "", name: "", categoryId: "", type: "INVENTORY", uom: "PCS", purchasePrice: "0", salePrice: "0", minStock: "0", defaultWarehouseId: "", inventoryAccountId: "", isActive: true });
            }}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            + Tambah Item
          </button>
        ) : null}
      </div>

      {form ? (
        <Card className="mb-4 p-5">
          <p className="mb-4 text-sm font-semibold text-slate-900">
            {form.id ? "Ubah Item" : "Tambah Item"}
          </p>
          {error ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Kode</Label>
              <Input value={form.code} onChange={(e) => patch({ code: e.target.value })} placeholder="ITM-001" />
            </div>
            <div>
              <Label>Nama</Label>
              <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Nama Item" />
            </div>
            <div>
              <Label>Kategori</Label>
              <Select value={form.categoryId} onChange={(e) => patch({ categoryId: e.target.value })}>
                <option value="">-</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Tipe</Label>
              <Select value={form.type} onChange={(e) => patch({ type: e.target.value as "INVENTORY" | "SERVICE" })}>
                <option value="INVENTORY">Persediaan (Stok)</option>
                <option value="SERVICE">Jasa (Tanpa Stok)</option>
              </Select>
            </div>
            <div>
              <Label>Satuan</Label>
              <Input value={form.uom} onChange={(e) => patch({ uom: e.target.value })} placeholder="PCS, KG, M, dll" />
            </div>
            <div>
              <Label>Harga Beli</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.purchasePrice}
                onChange={(e) => patch({ purchasePrice: e.target.value })}
                className="text-right tabular-nums"
              />
            </div>
            <div>
              <Label>Harga Jual</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.salePrice}
                onChange={(e) => patch({ salePrice: e.target.value })}
                className="text-right tabular-nums"
              />
            </div>
            <div>
              <Label>Min Stok</Label>
              <Input
                type="number" min="0" step="0.001"
                value={form.minStock}
                onChange={(e) => patch({ minStock: e.target.value })}
                className="text-right tabular-nums"
              />
            </div>
            <div>
              <Label>Gudang Default</Label>
              <Select value={form.defaultWarehouseId} onChange={(e) => patch({ defaultWarehouseId: e.target.value })}>
                <option value="">-</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Akun Persediaan</Label>
              <Select value={form.inventoryAccountId} onChange={(e) => patch({ inventoryAccountId: e.target.value })}>
                <option value="">Default (1-3000)</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
              </Select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.isActive} onChange={(e) => patch({ isActive: e.target.checked })} />
                Aktif
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={submit} disabled={pending} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:bg-slate-400">
              {pending ? "Menyimpan..." : "Simpan"}
            </button>
            <button onClick={() => setForm(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">
              Batal
            </button>
          </div>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title="Belum ada item" description="Tambahkan item barang/jasa untuk transaksi." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Kode</th>
                  <th className="px-4 py-2.5 font-medium">Nama</th>
                  <th className="px-4 py-2.5 font-medium">Kategori</th>
                  <th className="px-4 py-2.5 font-medium">Tipe</th>
                  <th className="px-4 py-2.5 text-right font-medium">Harga Beli</th>
                  <th className="px-4 py-2.5 text-right font-medium">Harga Jual</th>
                  <th className="px-4 py-2.5 text-right font-medium">Stok</th>
                  <th className="px-4 py-2.5 text-right font-medium">HPP Rata-rata</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  {canManage ? <th className="px-4 py-2.5" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-500">{r.code}</td>
                    <td className="px-4 py-2 text-slate-800">{r.name}</td>
                    <td className="px-4 py-2 text-slate-600">{r.category?.name || "-"}</td>
                    <td className="px-4 py-2">
                      <Badge tone={r.type === "INVENTORY" ? "blue" : "amber"}>{r.type}</Badge>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">{formatCurrency(r.purchasePrice.toString())}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">{formatCurrency(r.salePrice.toString())}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-800">{r.stockQty.toString()}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">{formatCurrency(r.avgCost.toString())}</td>
                    <td className="px-4 py-2">
                      <Badge tone={r.isActive ? "green" : "slate"}>
                        {r.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    {canManage ? (
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={() => {
                              setError(null);
                              setForm({
                                id: r.id, code: r.code, name: r.name, categoryId: r.categoryId || "",
                                type: r.type, uom: r.uom, purchasePrice: r.purchasePrice.toString(),
                                salePrice: r.salePrice.toString(), minStock: r.minStock.toString(),
                                defaultWarehouseId: r.defaultWarehouseId || "", inventoryAccountId: r.inventoryAccountId || "",
                                isActive: r.isActive,
                              });
                            }}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            Ubah
                          </button>
                          <button
                            disabled={pending}
                            onClick={() => run(() => toggleItemActive(r.id, !r.isActive))}
                            className="font-medium text-amber-600 hover:underline disabled:opacity-50"
                          >
                            {r.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                          <button
                            disabled={pending}
                            onClick={() => run(() => deleteItem(r.id), `Hapus item ${r.name}?`)}
                            className="font-medium text-red-600 hover:underline disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}