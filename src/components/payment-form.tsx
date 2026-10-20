"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Input, Label, PageHeader, Select } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { saveSalesReceipt } from "@/lib/actions/sales-actions";
import { savePurchasePayment } from "@/lib/actions/purchase-actions";

export type Option = { id: string; label: string };
export type OpenDoc = {
  id: string;
  partnerId: string;
  number: string;
  date: string;
  total: string;
  paid: string;
  remaining: number;
};

export type PaymentInitial = {
  id: string;
  partnerId: string;
  date: string;
  method: "CASH" | "BANK" | "TRANSFER" | "CREDIT_CARD" | "OTHER";
  note: string;
  allocations: Record<string, string>;
};

const METHODS: Array<{ value: PaymentInitial["method"]; label: string }> = [
  { value: "CASH", label: "Kas / Tunai" },
  { value: "TRANSFER", label: "Transfer Bank" },
  { value: "BANK", label: "Bank" },
  { value: "CREDIT_CARD", label: "Kartu Kredit" },
  { value: "OTHER", label: "Lainnya" },
];

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentForm({
  kind,
  partners,
  openDocs,
  initial,
}: {
  kind: "receipt" | "payment";
  partners: Option[];
  openDocs: OpenDoc[];
  initial?: PaymentInitial;
}) {
  const router = useRouter();
  const isReceipt = kind === "receipt";
  const basePath = isReceipt ? "/sales/receipts" : "/purchases/payments";
  const label = isReceipt ? "Penerimaan Kas" : "Pembayaran";

  const [partnerId, setPartnerId] = useState(initial?.partnerId ?? "");
  const [date, setDate] = useState(initial?.date ?? todayInput());
  const [method, setMethod] = useState<PaymentInitial["method"]>(
    initial?.method ?? "TRANSFER"
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [alloc, setAlloc] = useState<Record<string, string>>(initial?.allocations ?? {});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const docs = useMemo(
    () => openDocs.filter((d) => d.partnerId === partnerId),
    [openDocs, partnerId]
  );

  const total = useMemo(
    () => Object.values(alloc).reduce((a, v) => a + (Number(v) || 0), 0),
    [alloc]
  );

  function setAmount(id: string, value: string) {
    setAlloc((prev) => ({ ...prev, [id]: value }));
  }

  function allocateAll() {
    const next: Record<string, string> = { ...alloc };
    for (const d of docs) {
      if (d.remaining > 0) next[d.id] = String(d.remaining);
    }
    setAlloc(next);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const allocations = Object.entries(alloc)
        .map(([invoiceId, amount]) => ({ invoiceId, amount: Number(amount) || 0 }))
        .filter((a) => a.amount > 0);

      const payload = {
        id: initial?.id,
        partnerId,
        date,
        method,
        note: note || null,
        allocations,
      };

      const res = isReceipt
        ? await saveSalesReceipt({ ...payload, customerId: payload.partnerId })
        : await savePurchasePayment({ ...payload, supplierId: payload.partnerId });

      if (res.ok) router.push(`${basePath}/${res.id}`);
      else setError(res.error);
    });
  }

  const valid = partnerId !== "" && total > 0;

  return (
    <div>
      <PageHeader
        title={initial ? `Ubah ${label}` : `Buat ${label}`}
        description={
          isReceipt
            ? "Alokasikan penerimaan ke faktur penjualan yang belum lunas."
            : "Alokasikan pembayaran ke faktur pembelian yang belum lunas."
        }
      >
        <Link
          href={basePath}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Kembali
        </Link>
      </PageHeader>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card className="p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>{isReceipt ? "Pelanggan" : "Supplier"}</Label>
            <Select
              value={partnerId}
              onChange={(e) => {
                setPartnerId(e.target.value);
                setAlloc({});
              }}
            >
              <option value="">Pilih...</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Tanggal</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Metode</Label>
            <Select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentInitial["method"])}
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Catatan</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            Faktur Belum Lunas {partnerId ? "" : "(pilih partner dulu)"}
          </p>
          {docs.length > 0 ? (
            <button
              onClick={allocateAll}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Alokasikan semua
            </button>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Nomor</th>
                <th className="px-4 py-2.5 font-medium">Tanggal</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
                <th className="px-4 py-2.5 text-right font-medium">Sisa</th>
                <th className="w-44 px-4 py-2.5 text-right font-medium">Alokasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-600">
                    {d.number}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                    {formatDate(d.date)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                    {formatCurrency(d.total)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-800">
                    {formatCurrency(d.remaining)}
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={alloc[d.id] ?? ""}
                      onChange={(e) => setAmount(d.id, e.target.value)}
                      className="text-right tabular-nums"
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
              {partnerId === "" ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Pilih {isReceipt ? "pelanggan" : "supplier"} untuk melihat faktur belum lunas.
                  </td>
                </tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada faktur belum lunas.
                  </td>
                </tr>
              ) : null}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold">
              <tr>
                <td className="px-4 py-3 text-slate-700" colSpan={4}>
                  Total {isReceipt ? "Penerimaan" : "Pembayaran"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                  {formatCurrency(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="mt-4 flex justify-end gap-2">
        <Link
          href={basePath}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Batal
        </Link>
        <button
          onClick={submit}
          disabled={pending || !valid}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium text-white transition",
            pending || !valid
              ? "cursor-not-allowed bg-slate-400"
              : "bg-slate-900 hover:bg-slate-800"
          )}
        >
          {pending ? "Menyimpan..." : initial ? "Simpan Perubahan" : "Simpan Draft"}
        </button>
      </div>
    </div>
  );
}
