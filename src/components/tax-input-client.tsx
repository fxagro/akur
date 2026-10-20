"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveInputTaxInvoice,
  deleteInputTaxInvoice,
} from "@/lib/actions/tax-actions";
import { Card, EmptyState, Input, Label, Select } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { Prisma } from "@/generated/prisma/client";

function toDateStr(d: Date | string): string {
  return typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10);
}

type PurchaseInvoiceOption = {
  id: string;
  label: string;
  supplierName: string;
  supplierNpwp: string | null;
  total: string;
  taxAmount: string;
  dpp: string;
  date: string;
};

type TaxInputRow = {
  id: string;
  number: string;
  date: Date | string;
  dpp: Prisma.Decimal;
  ppn: Prisma.Decimal;
  ppnbm: Prisma.Decimal;
  partnerName: string;
  partnerNpwp: string | null;
  note: string | null;
  refId: string | null;
  refType: string | null;
  purchaseInvoice?: { number: string } | null;
};

export function TaxInputClient({
  rows,
  invoices,
  canManage,
}: {
  rows: TaxInputRow[];
  invoices: PurchaseInvoiceOption[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<{
    id?: string;
    purchaseInvoiceId: string;
    number: string;
    date: string;
    dpp: string;
    ppn: string;
    ppnbm: string;
    partnerName: string;
    partnerNpwp: string;
    note: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch(p: Partial<typeof form>) {
    setForm((prev) => (prev ? { ...prev, ...p } : prev));
  }

  function onInvoiceChange(invoiceId: string) {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) {
      patch({
        purchaseInvoiceId: inv.id,
        dpp: String(Number(inv.total) - Number(inv.taxAmount)),
        ppn: inv.taxAmount,
        ppnbm: "0",
        partnerName: inv.supplierName,
        partnerNpwp: inv.supplierNpwp ?? "",
        date: inv.date,
      });
    }
  }

  function submit() {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const res = await saveInputTaxInvoice({
        id: form.id,
        purchaseInvoiceId: form.purchaseInvoiceId,
        number: form.number,
        date: form.date,
        dpp: Number(form.dpp),
        ppn: Number(form.ppn),
        ppnbm: Number(form.ppnbm),
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
            onClick={() => { setError(null); setForm({ purchaseInvoiceId: "", number: "", date: new Date().toISOString().slice(0, 10), dpp: "0", ppn: "0", ppnbm: "0", partnerName: "", partnerNpwp: "", note: "" }); }}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            + Buat Faktur Pajak Masukan
          </button>
        ) : null}
      </div>

      {form ? (
        <Card className="mb-4 p-5">
          <p className="mb-4 text-sm font-semibold text-slate-900">
            {form.id ? "Ubah Faktur Pajak Masukan" : "Buat Faktur Pajak Masukan"}
          </p>
          {error ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Faktur Pembelian</Label>
              <Select value={form.purchaseInvoiceId} onChange={(e) => onInvoiceChange(e.target.value)}>
                <option value="">Pilih faktur pembelian (POSTED)...</option>
                {invoices.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label} · {i.supplierName} · DPP {i.dpp}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Nomor Faktur Pajak</Label>
              <Input value={form.number} onChange={(e) => patch({ number: e.target.value })} placeholder="FM-2026-0001" />
            </div>
            <div>
              <Label>Tanggal Faktur Pajak</Label>
              <Input type="date" value={form.date} onChange={(e) => patch({ date: e.target.value })} />
            </div>
            <div>
              <Label>DPP</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.dpp}
                onChange={(e) => patch({ dpp: e.target.value })}
                className="text-right tabular-nums"
              />
            </div>
            <div>
              <Label>PPN</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.ppn}
                onChange={(e) => patch({ ppn: e.target.value })}
                className="text-right tabular-nums"
              />
            </div>
            <div>
              <Label>PPnBM</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.ppnbm}
                onChange={(e) => patch({ ppnbm: e.target.value })}
                className="text-right tabular-nums"
              />
            </div>
            <div>
              <Label>Nama Penjual</Label>
              <Input value={form.partnerName} onChange={(e) => patch({ partnerName: e.target.value })} />
            </div>
            <div>
              <Label>NPWP Penjual</Label>
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
        <EmptyState title="Belum ada faktur pajak masukan" description="Buat faktur pajak dari faktur pembelian yang sudah diposting." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Tanggal</th>
                  <th className="px-4 py-2.5 font-medium">No. Faktur Pajak</th>
                  <th className="px-4 py-2.5 font-medium">Faktur Pembelian</th>
                  <th className="px-4 py-2.5 font-medium">Penjual</th>
                  <th className="px-4 py-2.5 text-right font-medium">DPP</th>
                  <th className="px-4 py-2.5 text-right font-medium">PPN</th>
                  <th className="px-4 py-2.5 text-right font-medium">PPnBM</th>
                  {canManage ? <th className="px-4 py-2.5" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">{formatDate(r.date)}</td>
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-500">{r.number}</td>
                    <td className="px-4 py-2 text-slate-600">{r.purchaseInvoice?.number || "-"}</td>
                    <td className="px-4 py-2 text-slate-700">{r.partnerName}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-800">{formatCurrency(r.dpp.toString())}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-800">{formatCurrency(r.ppn.toString())}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-800">{formatCurrency(r.ppnbm.toString())}</td>
                    {canManage ? (
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={() => {
                              setError(null);
                              setForm({
                                id: r.id,
                                purchaseInvoiceId: r.refId ?? "",
                                number: r.number,
                                date: toDateStr(r.date),
                                dpp: r.dpp.toString(),
                                ppn: r.ppn.toString(),
                                ppnbm: r.ppnbm.toString(),
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
                            onClick={() => run(() => deleteInputTaxInvoice(r.id), `Hapus faktur pajak masukan ${r.number}?`)}
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