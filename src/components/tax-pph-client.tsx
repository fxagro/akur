"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  savePph,
  deletePph,
} from "@/lib/actions/tax-actions";
import { Card, EmptyState, Input, Label, Select } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { Prisma } from "@/generated/prisma/client";

function toDateStr(d: Date | string): string {
  return typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10);
}

type TaxCodeOption = { id: string; code: string; name: string; rate: string; accountId: string | null };

type PphRow = {
  id: string;
  number: string;
  date: Date | string;
  direction: "INPUT" | "OUTPUT";
  dpp: Prisma.Decimal;
  ppn: Prisma.Decimal;
  ppnbm: Prisma.Decimal;
  partnerName: string;
  partnerNpwp: string | null;
  note: string | null;
  refType: string | null;
};

export function TaxPphClient({
  rows,
  taxCodes,
  canManage,
}: {
  rows: PphRow[];
  taxCodes: TaxCodeOption[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<{
    id?: string;
    paymentType: "PURCHASE_PAYMENT" | "SALARY" | "OTHER";
    refId: string;
    taxCodeId: string;
    date: string;
    grossAmount: string;
    tariff: string;
    partnerName: string;
    partnerNpwp: string;
    note: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch(p: Partial<typeof form>) {
    setForm((prev) => (prev ? { ...prev, ...p } : prev));
  }

  function onTaxCodeChange(taxCodeId: string) {
    const tc = taxCodes.find((t) => t.id === taxCodeId);
    if (tc) patch({ tariff: tc.rate });
  }

  function submit() {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const res = await savePph({
        id: form.id,
        paymentType: form.paymentType,
        refId: form.refId,
        taxCodeId: form.taxCodeId,
        date: form.date,
        grossAmount: Number(form.grossAmount),
        tariff: Number(form.tariff),
        partnerName: form.partnerName,
        partnerNpwp: form.partnerNpwp,
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
            onClick={() => { setError(null); setForm({ paymentType: "OTHER", refId: "", taxCodeId: "", date: new Date().toISOString().slice(0, 10), grossAmount: "0", tariff: "0", partnerName: "", partnerNpwp: "", note: "" }); }}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            + Catat PPh
          </button>
        ) : null}
      </div>

      {form ? (
        <Card className="mb-4 p-5">
          <p className="mb-4 text-sm font-semibold text-slate-900">
            {form.id ? "Ubah PPh" : "Catat PPh (Pemotongan/Pemungutan)"}
          </p>
          {error ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Jenis Transaksi</Label>
              <Select value={form.paymentType} onChange={(e) => patch({ paymentType: e.target.value as "PURCHASE_PAYMENT" | "SALARY" | "OTHER" })}>
                <option value="PURCHASE_PAYMENT">Pembayaran Supplier</option>
                <option value="SALARY">Gaji/Karyawan</option>
                <option value="OTHER">Lainnya</option>
              </Select>
            </div>
            <div>
              <Label>Ref ID (Opsional)</Label>
              <Input value={form.refId} onChange={(e) => patch({ refId: e.target.value })} placeholder="ID pembayaran/faktur terkait" />
            </div>
            <div>
              <Label>Kode PPh</Label>
              <Select value={form.taxCodeId} onChange={(e) => { onTaxCodeChange(e.target.value); patch({ taxCodeId: e.target.value }); }}>
                <option value="">Pilih kode PPh...</option>
                {taxCodes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} - {t.name} ({(Number(t.rate) * 100).toFixed(2)}%)
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Tanggal</Label>
              <Input type="date" value={form.date} onChange={(e) => patch({ date: e.target.value })} />
            </div>
            <div>
              <Label>Bruto (DPP)</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.grossAmount}
                onChange={(e) => patch({ grossAmount: e.target.value })}
                className="text-right tabular-nums"
              />
            </div>
            <div>
              <Label>Tarif (%)</Label>
              <Input
                type="number" min="0" max="100" step="0.01"
                value={form.tariff}
                onChange={(e) => patch({ tariff: e.target.value })}
                className="text-right tabular-nums"
              />
            </div>
            <div>
              <Label>Nama Lawan Transaksi</Label>
              <Input value={form.partnerName} onChange={(e) => patch({ partnerName: e.target.value })} />
            </div>
            <div>
              <Label>NPWP Lawan Transaksi</Label>
              <Input value={form.partnerNpwp} onChange={(e) => patch({ partnerNpwp: e.target.value })} placeholder="00.000.000.0-000.000" />
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
        <EmptyState title="Belum ada catatan PPh" description="Catat pemotongan/pemungutan PPh 21, 23, 4(2), dll." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Tanggal</th>
                  <th className="px-4 py-2.5 font-medium">Jenis</th>
                  <th className="px-4 py-2.5 font-medium">Lawan Transaksi</th>
                  <th className="px-4 py-2.5 text-right font-medium">Bruto</th>
                  <th className="px-4 py-2.5 text-right font-medium">Tarif</th>
                  <th className="px-4 py-2.5 text-right font-medium">PPh</th>
                  {canManage ? <th className="px-4 py-2.5" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">{formatDate(r.date)}</td>
                    <td className="px-4 py-2">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {r.refType === "SALARY" ? "Gaji" : r.refType === "PURCHASE_PAYMENT" ? "Supplier" : "Lainnya"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-700">{r.partnerName}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-800">{formatCurrency(r.dpp.toString())}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">{(Number(r.ppn) / Number(r.dpp) * 100).toFixed(2)}%</td>
                    <td className="px-4 py-2 text-right tabular-nums text-red-600 font-medium">{formatCurrency(r.ppn.toString())}</td>
                    {canManage ? (
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={() => {
                              setError(null);
                              setForm({
                                id: r.id,
                                paymentType: "OTHER",
                                refId: "",
                                taxCodeId: "",
                                date: toDateStr(r.date),
                                grossAmount: r.dpp.toString(),
                                tariff: "0",
                                partnerName: r.partnerName,
                                partnerNpwp: r.partnerNpwp ?? "",
                                note: r.note ?? "",
                              });
                            }}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            Ubah
                          </button>
                          <button
                            disabled={pending}
                            onClick={() => run(() => deletePph(r.id), `Hapus catatan PPh ${r.partnerName}?`)}
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