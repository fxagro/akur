"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveItemCategory,
  deleteItemCategory,
} from "@/lib/actions/inventory-actions";
import { Card, EmptyState, Input, Label } from "@/components/ui";

type CategoryRow = {
  id: string;
  name: string;
  _count?: { items: number };
};

export function CategoriesClient({ rows, canManage }: { rows: CategoryRow[]; canManage: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<{ id?: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch(p: { name: string }) {
    setForm((prev) => (prev ? { ...prev, ...p } : prev));
  }

  function submit() {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const res = await saveItemCategory({ id: form.id, name: form.name });
      if (res.ok) {
        setForm(null);
        router.refresh();
      } else {
        setError(res.error);
      }
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
            onClick={() => { setError(null); setForm({ name: "" }); }}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            + Tambah Kategori
          </button>
        ) : null}
      </div>

      {form ? (
        <Card className="mb-4 p-5">
          <p className="mb-4 text-sm font-semibold text-slate-900">
            {form.id ? "Ubah Kategori" : "Tambah Kategori"}
          </p>
          {error ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <div>
            <Label>Nama Kategori</Label>
            <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Contoh: Barang Dagang, Jasa, Aset" />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={submit}
              disabled={pending}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:bg-slate-400"
            >
              {pending ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              onClick={() => setForm(null)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              Batal
            </button>
          </div>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title="Belum ada kategori" description="Tambahkan kategori untuk mengelompokkan item." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Nama Kategori</th>
                  <th className="px-4 py-2.5 text-right font-medium">Jumlah Item</th>
                  {canManage ? <th className="px-4 py-2.5" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2 text-slate-800">{r.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">{r._count?.items ?? 0}</td>
                    {canManage ? (
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={() => { setError(null); setForm({ id: r.id, name: r.name }); }}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            Ubah
                          </button>
                          <button
                            disabled={pending}
                            onClick={() => run(() => deleteItemCategory(r.id), `Hapus kategori ${r.name}?`)}
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