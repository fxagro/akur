"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveBankTransaction,
  deleteBankTransaction,
} from "@/lib/actions/bank-transaction-actions";
import { Card, EmptyState, Input, Label, Select, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";

export type BankTransactionRow = {
  id: string;
  date: string;
  description: string | null;
  debit: string;
  credit: string;
  balance: string;
  isReconciled: boolean;
  refType: string | null;
  refId: string | null;
  bankAccountId: string;
};

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export type TransactionInitial = {
  id?: string;
  bankAccountId: string;
  date: string;
  description: string;
  debit: string;
  credit: string;
  refType: string;
  refId: string;
};

export function BankTransactionsClient({
  rows,
  bankAccounts,
  canManage,
}: {
  rows: BankTransactionRow[];
  bankAccounts: { id: string; name: string; bankName: string | null; accountNumber: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<TransactionInitial | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch(p: Partial<TransactionInitial>) {
    setForm((prev) => (prev ? { ...prev, ...p } : prev));
  }

  function submit() {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const res = await saveBankTransaction({
        id: form.id,
        bankAccountId: form.bankAccountId,
        date: form.date,
        description: form.description,
        debit: Number(form.debit) || 0,
        credit: Number(form.credit) || 0,
        refType: form.refType,
        refId: form.refId,
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
            onClick={() => { setError(null); setForm({ bankAccountId: "", date: todayInput(), description: "", debit: "0", credit: "0", refType: "OTHER", refId: "" }); }}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            + Tambah Transaksi
          </button>
        ) : null}
      </div>

      {form ? (
        <Card className="mb-4 p-5">
          <p className="mb-4 text-sm font-semibold text-slate-900">
            {form.id ? "Ubah Transaksi" : "Tambah Transaksi Bank"}
          </p>
          {error ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Rekening Bank</Label>
              <Select value={form.bankAccountId} onChange={(e) => patch({ bankAccountId: e.target.value })}>
                <option value="">Pilih rekening...</option>
                {bankAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}{a.bankName ? ` (${a.bankName})` : ""} - {a.accountNumber || "N/A"}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Tanggal</Label>
              <Input type="date" value={form.date} onChange={(e) => patch({ date: e.target.value })} />
            </div>
            <div>
              <Label>Jenis</Label>
              <Select value={form.refType} onChange={(e) => patch({ refType: e.target.value })}>
                <option value="SALES_RECEIPT">Penerimaan Penjualan</option>
                <option value="PURCHASE_PAYMENT">Pembayaran Pembelian</option>
                <option value="JOURNAL">Jurnal Umum</option>
                <option value="OTHER">Lainnya</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Keterangan</Label>
              <Input value={form.description} onChange={(e) => patch({ description: e.target.value })} placeholder="Keterangan transaksi" />
            </div>
            <div>
              <Label>Debit</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.debit}
                onChange={(e) => patch({ debit: e.target.value, credit: "0" })}
                className="text-right tabular-nums"
              />
            </div>
            <div>
              <Label>Kredit</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.credit}
                onChange={(e) => patch({ credit: e.target.value, debit: "0" })}
                className="text-right tabular-nums"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Referensi (Opsional)</Label>
              <Input value={form.refId} onChange={(e) => patch({ refId: e.target.value })} placeholder="ID dokumen terkait" />
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
        <EmptyState title="Belum ada transaksi bank" description="Tambahkan transaksi kas/bank untuk mencatat masuk/keluar dana." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Tanggal</th>
                  <th className="px-4 py-2.5 font-medium">Keterangan</th>
                  <th className="px-4 py-2.5 text-right font-medium">Debit</th>
                  <th className="px-4 py-2.5 text-right font-medium">Kredit</th>
                  <th className="px-4 py-2.5 text-right font-medium">Saldo</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  {canManage ? <th className="px-4 py-2.5" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">{formatDate(r.date)}</td>
                    <td className="px-4 py-2 text-slate-700">{r.description || "-"}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-emerald-600">{Number(r.debit) > 0 ? formatCurrency(r.debit) : "-"}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-red-600">{Number(r.credit) > 0 ? formatCurrency(r.credit) : "-"}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-900">{formatCurrency(r.balance)}</td>
                    <td className="px-4 py-2">
                      <Badge tone={r.isReconciled ? "green" : "amber"}>
                        {r.isReconciled ? "Direkonsiliasi" : "Belum"}
                      </Badge>
                    </td>
                    {canManage ? (
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={() => {
                              setError(null);
                              setForm({
                                id: r.id,
                                bankAccountId: r.bankAccountId,
                                date: r.date,
                                description: r.description ?? "",
                                debit: r.debit,
                                credit: r.credit,
                                refType: r.refType ?? "OTHER",
                                refId: r.refId ?? "",
                              });
                            }}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            Ubah
                          </button>
                          <button
                            disabled={pending}
                            onClick={() => run(() => deleteBankTransaction(r.id), `Hapus transaksi ini?`)}
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