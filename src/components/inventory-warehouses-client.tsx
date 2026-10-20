"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveWarehouse,
  deleteWarehouse,
} from "@/lib/actions/inventory-actions";
import { Card, EmptyState, Input, Label, Badge } from "@/components/ui";

type WarehouseRow = {
  id: string;
  code: string;
  name: string;
  address: string | null;
  isActive: boolean;
};

export function WarehousesClient({ rows, canManage }: { rows: WarehouseRow[]; canManage: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<{ id?: string; code: string; name: string; address: string; isActive: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch(p: Partial<typeof form>) {
    setForm((prev) => (prev ? { ...prev, ...p } : prev));
  }

  function submit() {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const res = await saveWarehouse({ id: form.id, code: form.code, name: form.name, address: form.address, isActive: form.isActive });
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
            onClick={() => { setError(null); setForm({ code: "", name: "", address: "", isActive: true }); }}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            + Tambah Gudang
          </button>
        ) : null}
      </div>

      {form ? (
        <Card className="mb-4 p-5">
          <p className="mb-4 text-sm font-semibold text-slate-900">
            {form.id ? "Ubah Gudang" : "Tambah Gudang"}
          </p>
          {error ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Kode</Label>
              <Input value={form.code} onChange={(e) => patch({ code: e.target.value })} placeholder="G001" />
            </div>
            <div>
              <Label>Nama</Label>
              <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Nama Gudang" />
            </div>
            <div className="sm:col-span-2">
              <Label>Alamat</Label>
              <Input value={form.address} onChange={(e) => patch({ address: e.target.value })} placeholder="Opsional" />
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
        <EmptyState title="Belum ada gudang" description="Tambahkan gudang untuk mencatat stok per lokasi." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Kode</th>
                  <th className="px-4 py-2.5 font-medium">Nama</th>
                  <th className="px-4 py-2.5 font-medium">Alamat</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  {canManage ? <th className="px-4 py-2.5" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-500">{r.code}</td>
                    <td className="px-4 py-2 text-slate-800">{r.name}</td>
                    <td className="px-4 py-2 text-slate-600">{r.address || "-"}</td>
                    <td className="px-4 py-2">
                      <Badge tone={r.isActive ? "green" : "slate"}>
                        {r.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    {canManage ? (
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={() => { setError(null); setForm({ id: r.id, code: r.code, name: r.name, address: r.address || "", isActive: r.isActive }); }}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            Ubah
                          </button>
                          <button
                            disabled={pending}
                            onClick={() => run(() => deleteWarehouse(r.id), `Hapus gudang ${r.name}?`)}
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