"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveTaxCode,
  toggleTaxCodeActive,
  deleteTaxCode,
} from "@/lib/actions/tax-actions";
import { Card, EmptyState, Input, Label, Select, Badge } from "@/components/ui";

type TaxCodeRow = {
  id: string;
  code: string;
  name: string;
  type: "PPN" | "PPH";
  rate: string;
  accountId: string | null;
  isActive: boolean;
};

export function TaxCodesClient({ rows, canManage }: { rows: TaxCodeRow[]; canManage: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<{
    id?: string;
    code: string;
    name: string;
    type: "PPN" | "PPH";
    rate: string;
    accountId: string;
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
      const res = await saveTaxCode({
        id: form.id,
        code: form.code,
        name: form.name,
        type: form.type,
        rate: Number(form.rate),
        accountId: form.accountId,
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
            onClick={() => { setError(null); setForm({ code: "", name: "", type: "PPN", rate: "0.11", accountId: "", isActive: true }); }}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            + Tambah Kode Pajak
          </button>
        ) : null}
      </div>

      {form ? (
        <Card className="mb-4 p-5">
          <p className="mb-4 text-sm font-semibold text-slate-900">
            {form.id ? "Ubah Kode Pajak" : "Tambah Kode Pajak"}
          </p>
          {error ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Kode</Label>
              <Input value={form.code} onChange={(e) => patch({ code: e.target.value })} placeholder="PPN-OUT" />
            </div>
            <div>
              <Label>Nama</Label>
              <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="PPN Keluaran 11%" />
            </div>
            <div>
              <Label>Tipe</Label>
              <Select value={form.type} onChange={(e) => patch({ type: e.target.value as "PPN" | "PPH" })}>
                <option value="PPN">PPN</option>
                <option value="PPH">PPh</option>
              </Select>
            </div>
            <div>
              <Label>Tarif (desimal)</Label>
              <Input
                type="number" step="0.0001" min="0" max="1"
                value={form.rate}
                onChange={(e) => patch({ rate: e.target.value })}
                className="text-right tabular-nums"
                placeholder="0.11"
              />
            </div>
            <div>
              <Label>Akun Pajak</Label>
              <Select value={form.accountId} onChange={(e) => patch({ accountId: e.target.value })}>
                <option value="">Default dari tipe</option>
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
        <EmptyState title="Belum ada kode pajak" description="Tambahkan kode PPN/PPh untuk transaksi." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Kode</th>
                  <th className="px-4 py-2.5 font-medium">Nama</th>
                  <th className="px-4 py-2.5 font-medium">Tipe</th>
                  <th className="px-4 py-2.5 text-right font-medium">Tarif</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  {canManage ? <th className="px-4 py-2.5" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-500">{r.code}</td>
                    <td className="px-4 py-2 text-slate-800">{r.name}</td>
                    <td className="px-4 py-2">
                      <Badge tone={r.type === "PPN" ? "blue" : "amber"}>{r.type}</Badge>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">{(Number(r.rate) * 100).toFixed(2)}%</td>
                    <td className="px-4 py-2">
                      <Badge tone={r.isActive ? "green" : "slate"}>
                        {r.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    {canManage ? (
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={() => { setError(null); setForm({ id: r.id, code: r.code, name: r.name, type: r.type, rate: r.rate, accountId: r.accountId || "", isActive: r.isActive }); }}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            Ubah
                          </button>
                          <button
                            disabled={pending}
                            onClick={() => run(() => toggleTaxCodeActive(r.id, !r.isActive))}
                            className="font-medium text-amber-600 hover:underline disabled:opacity-50"
                          >
                            {r.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                          <button
                            disabled={pending}
                            onClick={() => run(() => deleteTaxCode(r.id), `Hapus kode pajak ${r.name}?`)}
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