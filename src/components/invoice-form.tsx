"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Input, Label, PageHeader, Select } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { saveSalesInvoice } from "@/lib/actions/sales-actions";
import { savePurchaseInvoice } from "@/lib/actions/purchase-actions";

export type Option = { id: string; label: string };
export type ItemOption = Option & { salePrice: string; purchasePrice: string };
export type TaxOption = Option & { rate: string };

export type InvoiceLine = {
  itemId: string;
  description: string;
  accountId: string;
  qty: string;
  unitPrice: string;
  discount: string;
  taxCodeId: string;
};

export type InvoiceInitial = {
  id: string;
  partnerId: string;
  supplierNumber: string;
  date: string;
  dueDate: string;
  reference: string;
  note: string;
  lines: InvoiceLine[];
};

function newLine(): InvoiceLine {
  return {
    itemId: "",
    description: "",
    accountId: "",
    qty: "1",
    unitPrice: "0",
    discount: "0",
    taxCodeId: "",
  };
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function InvoiceForm({
  kind,
  partners,
  items,
  accounts,
  taxCodes,
  initial,
}: {
  kind: "sales" | "purchase";
  partners: Option[];
  items: ItemOption[];
  accounts: Option[];
  taxCodes: TaxOption[];
  initial?: InvoiceInitial;
}) {
  const router = useRouter();
  const isSales = kind === "sales";
  const basePath = isSales ? "/sales" : "/purchases";
  const label = isSales ? "Faktur Penjualan" : "Faktur Pembelian";

  const [partnerId, setPartnerId] = useState(initial?.partnerId ?? "");
  const [supplierNumber, setSupplierNumber] = useState(initial?.supplierNumber ?? "");
  const [date, setDate] = useState(initial?.date ?? todayInput());
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [reference, setReference] = useState(initial?.reference ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [lines, setLines] = useState<InvoiceLine[]>(
    initial?.lines?.length ? initial.lines : [newLine()]
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const taxMap = useMemo(() => new Map(taxCodes.map((t) => [t.id, t])), [taxCodes]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    for (const l of lines) {
      const gross = (Number(l.qty) || 0) * (Number(l.unitPrice) || 0);
      const disc = Number(l.discount) || 0;
      const net = Math.max(0, gross - disc);
      const rate = l.taxCodeId ? Number(taxMap.get(l.taxCodeId)?.rate ?? 0) : 0;
      subtotal += net;
      discount += disc;
      tax += net * rate;
    }
    return { subtotal, discount, tax, total: subtotal + tax };
  }, [lines, taxMap]);

  function updateLine(index: number, patch: Partial<InvoiceLine>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function onPickItem(index: number, itemId: string) {
    const item = itemMap.get(itemId);
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l;
        const next = { ...l, itemId };
        if (item) {
          next.description = item.label.split(" · ").slice(1).join(" · ") || item.label;
          next.unitPrice = isSales ? item.salePrice : item.purchasePrice;
        }
        return next;
      })
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const payload = {
        id: initial?.id,
        partnerId,
        supplierNumber: isSales ? undefined : supplierNumber,
        date,
        dueDate: dueDate || null,
        reference: reference || null,
        note: note || null,
        lines: lines
          .filter((l) => l.description.trim() || l.itemId)
          .map((l) => ({
            itemId: l.itemId || null,
            description: l.description || "Item",
            accountId: l.accountId || null,
            qty: Number(l.qty) || 0,
            unitPrice: Number(l.unitPrice) || 0,
            discount: Number(l.discount) || 0,
            taxCodeId: l.taxCodeId || null,
          })),
      };

      const res = isSales
        ? await saveSalesInvoice({
            ...payload,
            customerId: payload.partnerId,
          })
        : await savePurchaseInvoice({
            ...payload,
            supplierId: payload.partnerId,
          });

      if (res.ok) {
        router.push(`${basePath}/${res.id}`);
      } else {
        setError(res.error);
      }
    });
  }

  const valid = partnerId !== "" && lines.some((l) => Number(l.qty) * Number(l.unitPrice) > 0);

  return (
    <div>
      <PageHeader
        title={initial ? `Ubah ${label}` : `Buat ${label}`}
        description="Faktur disimpan sebagai draft, posting untuk membuat jurnal otomatis."
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>{isSales ? "Pelanggan" : "Supplier"}</Label>
            <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
              <option value="">Pilih...</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
          {!isSales ? (
            <div>
              <Label>No. Faktur Supplier</Label>
              <Input
                value={supplierNumber}
                onChange={(e) => setSupplierNumber(e.target.value)}
                placeholder="Opsional"
              />
            </div>
          ) : null}
          <div>
            <Label>Tanggal</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Jatuh Tempo</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <Label>Referensi</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Catatan</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2.5 font-medium">Item</th>
                <th className="px-3 py-2.5 font-medium">Keterangan</th>
                <th className="px-3 py-2.5 font-medium">Akun</th>
                <th className="w-24 px-3 py-2.5 text-right font-medium">Qty</th>
                <th className="w-32 px-3 py-2.5 text-right font-medium">Harga</th>
                <th className="w-28 px-3 py-2.5 text-right font-medium">Diskon</th>
                <th className="w-36 px-3 py-2.5 font-medium">Pajak</th>
                <th className="w-32 px-3 py-2.5 text-right font-medium">Jumlah</th>
                <th className="w-10 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((l, i) => {
                const gross = (Number(l.qty) || 0) * (Number(l.unitPrice) || 0);
                const net = Math.max(0, gross - (Number(l.discount) || 0));
                const rate = l.taxCodeId ? Number(taxMap.get(l.taxCodeId)?.rate ?? 0) : 0;
                return (
                  <tr key={i}>
                    <td className="px-3 py-2">
                      <Select value={l.itemId} onChange={(e) => onPickItem(i, e.target.value)}>
                        <option value="">-</option>
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.label}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={l.description}
                        onChange={(e) => updateLine(i, { description: e.target.value })}
                        placeholder="Keterangan"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        value={l.accountId}
                        onChange={(e) => updateLine(i, { accountId: e.target.value })}
                      >
                        <option value="">Default</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.label}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        value={l.qty}
                        onChange={(e) => updateLine(i, { qty: e.target.value })}
                        className="text-right tabular-nums"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={l.unitPrice}
                        onChange={(e) => updateLine(i, { unitPrice: e.target.value })}
                        className="text-right tabular-nums"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={l.discount}
                        onChange={(e) => updateLine(i, { discount: e.target.value })}
                        className="text-right tabular-nums"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        value={l.taxCodeId}
                        onChange={(e) => updateLine(i, { taxCodeId: e.target.value })}
                      >
                        <option value="">Tanpa pajak</option>
                        {taxCodes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-800">
                      <div>{formatCurrency(net)}</div>
                      {rate > 0 ? (
                        <div className="text-xs text-slate-400">
                          +{formatCurrency(net * rate)}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {lines.length > 1 ? (
                        <button
                          onClick={() => setLines((prev) => prev.filter((_, x) => x !== i))}
                          className="text-slate-400 hover:text-red-600"
                          title="Hapus baris"
                        >
                          x
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50 text-sm">
              <tr>
                <td className="px-3 py-3" colSpan={7}>
                  <button
                    onClick={() => setLines((prev) => [...prev, newLine()])}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    + Tambah baris
                  </button>
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                  {formatCurrency(totals.subtotal)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-56 space-y-1 text-sm">
          <div className="flex justify-between gap-8">
            <span className="text-slate-500">Subtotal</span>
            <span className="tabular-nums text-slate-800">{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-slate-500">Diskon</span>
            <span className="tabular-nums text-slate-800">{formatCurrency(totals.discount)}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-slate-500">Pajak</span>
            <span className="tabular-nums text-slate-800">{formatCurrency(totals.tax)}</span>
          </div>
          <div className="flex justify-between gap-8 border-t border-slate-200 pt-1 font-semibold">
            <span className="text-slate-700">Total</span>
            <span className="tabular-nums text-slate-900">{formatCurrency(totals.total)}</span>
          </div>
        </div>
        <div className="flex gap-2">
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
    </div>
  );
}
