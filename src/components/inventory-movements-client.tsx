"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveStockMovement,
  deleteStockMovement,
} from "@/lib/actions/inventory-actions";
import { Card, EmptyState, Input, Label, Select } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { Prisma } from "@/generated/prisma/client";

type MovementRow = {
  id: string;
  item: { id: string; code: string; name: string; uom: string };
  warehouse: { id: string; code: string; name: string };
  date: Date | string;
  direction: "IN" | "OUT" | "ADJUST";
  qty: Prisma.Decimal;
  unitCost: Prisma.Decimal;
  totalCost: Prisma.Decimal;
  balanceQty: Prisma.Decimal;
};

export function MovementsClient({
  rows,
  items,
  warehouses,
  canManage,
}: {
  rows: MovementRow[];
  items: { id: string; code: string; name: string; uom: string }[];
  warehouses: { id: string; code: string; name: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<{
    id?: string;
    itemId: string;
    warehouseId: string;
    date: string;
    direction: "IN" | "OUT" | "ADJUST";
    qty: string;
    unitCost: string;
    note: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch(p: Partial<typeof form>) {
    setForm((prev) => (prev ? { ...prev, ...p } : prev));
  }

  function submit() {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const res = await saveStockMovement({
        id: form.id,
        itemId: form.itemId,
        warehouseId: form.warehouseId,
        date: form.date,
        direction: form.direction,
        qty: Number(form.qty) || 0,
        unitCost: Number(form.unitCost) || 0,
        note: form.note,
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
              setForm({
                itemId: "", warehouseId: "", date: new Date().toISOString().slice(0, 10),
                direction: "IN", qty: "", unitCost: "0", note: "",
              });
            }}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            + Tambah Gerakan Stok
          </button>
        ) : null}
      </div>

      {form ? (
        <Card className="mb-4 p-5">
          <p className="mb-4 text-sm font-semibold text-slate-900">
            {form.id ? "Ubah Gerakan" : "Tambah Gerakan Stok"}
          </p>
          {error ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>Item</Label>
              <Select value={form.itemId} onChange={(e) => patch({ itemId: e.target.value })}>
                <option value="">Pilih item...</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.code} - {i.name} ({i.uom})</option>)}
              </Select>
            </div>
            <div>
              <Label>Gudang</Label>
              <Select value={form.warehouseId} onChange={(e) => patch({ warehouseId: e.target.value })}>
                <option value="">Pilih gudang...</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Tanggal</Label>
              <Input type="date" value={form.date} onChange={(e) => patch({ date: e.target.value })} />
            </div>
            <div>
              <Label>Jenis</Label>
              <Select value={form.direction} onChange={(e) => patch({ direction: e.target.value as "IN" | "OUT" | "ADJUST" })}>
                <option value="IN">Masuk (Pembelian/Retur)</option>
                <option value="OUT">Keluar (Penjualan/Pakai)</option>
                <option value="ADJUST">Penyesuaian (Opname)</option>
              </Select>
            </div>
            <div>
              <Label>Qty</Label>
              <Input
                type="number" min="0.001" step="0.001"
                value={form.qty}
                onChange={(e) => patch({ qty: e.target.value })}
                className="text-right tabular-nums"
                placeholder="0"
              />
            </div>
            <div>
              <Label>Harga Satuan</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.unitCost}
                onChange={(e) => patch({ unitCost: e.target.value })}
                className="text-right tabular-nums"
                placeholder="0"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Catatan</Label>
              <Input value={form.note} onChange={(e) => patch({ note: e.target.value })} placeholder="Opsional" />
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
        <EmptyState title="Belum ada gerakan stok" description="Catat masuk/keluar/penyesuaian stok per item per gudang." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Tanggal</th>
                  <th className="px-4 py-2.5 font-medium">Item</th>
                  <th className="px-4 py-2.5 font-medium">Gudang</th>
                  <th className="px-4 py-2.5 font-medium">Jenis</th>
                  <th className="px-4 py-2.5 text-right font-medium">Qty</th>
                  <th className="px-4 py-2.5 text-right font-medium">Harga Satuan</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total Biaya</th>
                  <th className="px-4 py-2.5 text-right font-medium">Saldo Akhir</th>
                  {canManage ? <th className="px-4 py-2.5" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">{formatDate(r.date)}</td>
                    <td className="px-4 py-2 text-slate-700">{r.item.code} - {r.item.name}</td>
                    <td className="px-4 py-2 text-slate-600">{r.warehouse.code} - {r.warehouse.name}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                        r.direction === "IN" ? "bg-emerald-100 text-emerald-700" :
                        r.direction === "OUT" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {r.direction}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-800">{r.qty.toString()}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">{formatCurrency(r.unitCost.toString())}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">{formatCurrency(r.totalCost.toString())}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-900">{r.balanceQty.toString()}</td>
                    {canManage ? (
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            disabled={pending}
                            onClick={() => run(() => deleteStockMovement(r.id), `Hapus gerakan stok ini? Saldo gudang akan dihitung ulang.`)}
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