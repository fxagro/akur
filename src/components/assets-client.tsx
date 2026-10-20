"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveFixedAsset, toggleAssetActive, disposeAsset, deleteAsset } from "@/lib/actions/asset-actions";
import { Card, EmptyState, Input, Label, Select, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";

export type AssetRow = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  status: "ACTIVE" | "DISPOSED";
  acquisitionDate: string;
  acquisitionCost: string;
  usefulLifeMonths: number;
  salvageValue: string;
  method: "STRAIGHT_LINE" | "DECLINING_BALANCE";
  accumulatedDepreciation: string;
  bookValue: string;
  isActive: boolean;
};

function emptyForm() {
  return {
    id: undefined,
    code: "",
    name: "",
    category: "",
    status: "ACTIVE" as const,
    acquisitionDate: new Date().toISOString().slice(0, 10),
    acquisitionCost: "0",
    usefulLifeMonths: "60",
    salvageValue: "0",
    method: "STRAIGHT_LINE" as const,
    assetAccountId: "",
    accumDepAccountId: "",
    depExpenseAccountId: "",
    note: "",
    isActive: true,
  };
}

function toForm(r: AssetRow) {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    category: r.category ?? "",
    status: r.status,
    acquisitionDate: r.acquisitionDate,
    acquisitionCost: r.acquisitionCost,
    usefulLifeMonths: String(r.usefulLifeMonths),
    salvageValue: r.salvageValue,
    method: r.method,
    assetAccountId: "",
    accumDepAccountId: "",
    depExpenseAccountId: "",
    note: "",
    isActive: r.isActive,
  };
}

export function AssetsClient({
  rows,
  accounts,
  canManage,
}: {
  rows: AssetRow[];
  accounts: { id: string; code: string; name: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ReturnType<typeof emptyForm> | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch(p: Partial<ReturnType<typeof emptyForm>>) {
    setForm((prev) => (prev ? { ...prev, ...p } : prev));
  }

  function submit() {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const res = await saveFixedAsset({
        id: form.id,
        code: form.code,
        name: form.name,
        category: form.category,
        status: form.status,
        acquisitionDate: form.acquisitionDate,
        acquisitionCost: Number(form.acquisitionCost) || 0,
        usefulLifeMonths: Number(form.usefulLifeMonths) || 1,
        salvageValue: Number(form.salvageValue) || 0,
        method: form.method,
        assetAccountId: form.assetAccountId,
        accumDepAccountId: form.accumDepAccountId,
        depExpenseAccountId: form.depExpenseAccountId,
        note: form.note,
        isActive: form.isActive,
      });
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
            onClick={() => { setError(null); setForm(emptyForm()); }}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            + Tambah Aset
          </button>
        ) : null}
      </div>

      {form ? (
        <Card className="mb-4 p-5">
          <p className="mb-4 text-sm font-semibold text-slate-900">
            {form.id ? "Ubah Aset Tetap" : "Tambah Aset Tetap"}
          </p>
          {error ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Kode</Label>
              <Input value={form.code} onChange={(e) => patch({ code: e.target.value })} placeholder="AST-001" />
            </div>
            <div>
              <Label>Nama Aset</Label>
              <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Nama aset" />
            </div>
            <div>
              <Label>Kategori</Label>
              <Input value={form.category} onChange={(e) => patch({ category: e.target.value })} placeholder="Kendaraan / Bangunan / Peralatan" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onChange={(e) => patch({ status: e.target.value as "ACTIVE" | "DISPOSED" })}>
                <option value="ACTIVE">Aktif</option>
                <option value="DISPOSED">Dibuang</option>
              </Select>
            </div>
            <div>
              <Label>Tanggal Perolehan</Label>
              <Input type="date" value={form.acquisitionDate} onChange={(e) => patch({ acquisitionDate: e.target.value })} />
            </div>
            <div>
              <Label>Harga Perolehan</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.acquisitionCost}
                onChange={(e) => patch({ acquisitionCost: e.target.value })}
                className="text-right tabular-nums"
              />
            </div>
            <div>
              <Label>Masa Manfaat (bulan)</Label>
              <Input
                type="number" min="1"
                value={form.usefulLifeMonths}
                onChange={(e) => patch({ usefulLifeMonths: e.target.value })}
              />
            </div>
            <div>
              <Label>Nilai Sisa</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.salvageValue}
                onChange={(e) => patch({ salvageValue: e.target.value })}
                className="text-right tabular-nums"
              />
            </div>
            <div>
              <Label>Metode Penyusutan</Label>
              <Select value={form.method} onChange={(e) => patch({ method: e.target.value as "STRAIGHT_LINE" | "DECLINING_BALANCE" })}>
                <option value="STRAIGHT_LINE">Garis Lurus</option>
                <option value="DECLINING_BALANCE">Saldo Menurun</option>
              </Select>
            </div>
            <div>
              <Label>Akun Aset</Label>
              <Select value={form.assetAccountId} onChange={(e) => patch({ assetAccountId: e.target.value })}>
                <option value="">-</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Akun Akum. Penyusutan</Label>
              <Select value={form.accumDepAccountId} onChange={(e) => patch({ accumDepAccountId: e.target.value })}>
                <option value="">-</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Akun Beban Penyusutan</Label>
              <Select value={form.depExpenseAccountId} onChange={(e) => patch({ depExpenseAccountId: e.target.value })}>
                <option value="">-</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Catatan</Label>
              <Input value={form.note} onChange={(e) => patch({ note: e.target.value })} placeholder="Opsional" />
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
        <EmptyState title="Belum ada aset tetap" description="Tambahkan aset tetap untuk mulai mencatat penyusutan." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Kode</th>
                  <th className="px-4 py-2.5 font-medium">Nama</th>
                  <th className="px-4 py-2.5 font-medium">Kategori</th>
                  <th className="px-4 py-2.5 text-right font-medium">Harga Perolehan</th>
                  <th className="px-4 py-2.5 text-right font-medium">Akumulasi</th>
                  <th className="px-4 py-2.5 text-right font-medium">Nilai Buku</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Tgl Perolehan</th>
                  {canManage ? <th className="px-4 py-2.5" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-500">{r.code}</td>
                    <td className="px-4 py-2 text-slate-800">{r.name}</td>
                    <td className="px-4 py-2 text-slate-600">{r.category || "-"}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">{formatCurrency(r.acquisitionCost)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">{formatCurrency(r.accumulatedDepreciation)}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-900">{formatCurrency(r.bookValue)}</td>
                    <td className="px-4 py-2">
                      <Badge tone={r.status === "ACTIVE" ? "green" : "red"}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">{formatDate(r.acquisitionDate)}</td>
                    {canManage ? (
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={() => { setError(null); setForm(toForm(r)); }}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            Ubah
                          </button>
                          {r.status === "ACTIVE" ? (
                            <button
                              disabled={pending}
                              onClick={() => run(() => toggleAssetActive(r.id, false), `Nonaktifkan aset ${r.name}?`)}
                              className="font-medium text-amber-600 hover:underline disabled:opacity-50"
                            >
                              Nonaktifkan
                            </button>
                          ) : null}
                          <button
                            disabled={pending}
                            onClick={() => run(() => deleteAsset(r.id), `Hapus aset ${r.name}?`)}
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