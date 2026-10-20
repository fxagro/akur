"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveBankAccount,
  deleteBankAccount,
  toggleBankAccountActive,
} from "@/lib/actions/bank-actions";
import { Card, EmptyState, Input, Label, Select, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/format";

export type BankAccountRow = {
  id: string;
  name: string;
  bankName: string | null;
  accountNumber: string | null;
  accountId: string;
  accountCode: string;
  accountName: string;
  currency: string;
  openingBalance: string;
  isActive: boolean;
  transactionCount: number;
};

function emptyForm(): { id?: string; name: string; bankName: string; accountNumber: string; accountId: string; currency: string; openingBalance: string; isActive: boolean } {
  return { id: undefined, name: "", bankName: "", accountNumber: "", accountId: "", currency: "IDR", openingBalance: "0", isActive: true };
}

function toForm(r: BankAccountRow) {
  return {
    id: r.id,
    name: r.name,
    bankName: r.bankName ?? "",
    accountNumber: r.accountNumber ?? "",
    accountId: r.accountId,
    currency: r.currency,
    openingBalance: r.openingBalance,
    isActive: r.isActive,
  };
}

export function BankAccountsClient({
  rows,
  accounts,
  canManage,
}: {
  rows: BankAccountRow[];
  accounts: { id: string; code: string; name: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ReturnType<typeof emptyForm> | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch(p: Partial<typeof form>) {
    setForm((prev) => (prev ? { ...prev, ...p } : prev));
  }

  function submit() {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const res = await saveBankAccount({
        id: form.id,
        name: form.name,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        accountId: form.accountId,
        currency: form.currency,
        openingBalance: Number(form.openingBalance) || 0,
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
            + Tambah Rekening
          </button>
        ) : null}
      </div>

      {form ? (
        <Card className="mb-4 p-5">
          <p className="mb-4 text-sm font-semibold text-slate-900">
            {form.id ? "Ubah Rekening" : "Tambah Rekening Bank"}
          </p>
          {error ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Nama Rekening</Label>
              <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Kas Utama / Bank BCA" />
            </div>
            <div>
              <Label>Nama Bank</Label>
              <Input value={form.bankName} onChange={(e) => patch({ bankName: e.target.value })} placeholder="BCA / Mandiri / BRI" />
            </div>
            <div>
              <Label>No. Rekening</Label>
              <Input value={form.accountNumber} onChange={(e) => patch({ accountNumber: e.target.value })} placeholder="1234567890" />
            </div>
            <div>
              <Label>Mata Uang</Label>
              <Select value={form.currency} onChange={(e) => patch({ currency: e.target.value })}>
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
                <option value="SGD">SGD</option>
              </Select>
            </div>
            <div>
              <Label>Akun Buku Besar</Label>
              <Select value={form.accountId} onChange={(e) => patch({ accountId: e.target.value })}>
                <option value="">Pilih akun...</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Saldo Awal</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.openingBalance}
                onChange={(e) => patch({ openingBalance: e.target.value })}
                className="text-right tabular-nums"
              />
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
        <EmptyState title="Belum ada rekening bank" description="Tambahkan rekening bank untuk mencatat transaksi kas/bank." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Nama</th>
                  <th className="px-4 py-2.5 font-medium">Bank</th>
                  <th className="px-4 py-2.5 font-medium">No. Rekening</th>
                  <th className="px-4 py-2.5 font-medium">Akun GL</th>
                  <th className="px-4 py-2.5 text-right font-medium">Saldo Awal</th>
                  <th className="px-4 py-2.5 text-right font-medium">Transaksi</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  {canManage ? <th className="px-4 py-2.5" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2 text-slate-800">{r.name}</td>
                    <td className="px-4 py-2 text-slate-600">{r.bankName || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">{r.accountNumber || "-"}</td>
                    <td className="px-4 py-2 text-slate-600">{r.accountCode} - {r.accountName}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-800">{formatCurrency(r.openingBalance)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">{r.transactionCount}</td>
                    <td className="px-4 py-2">
                      <Badge tone={r.isActive ? "green" : "slate"}>
                        {r.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    {canManage ? (
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={() => { setError(null); setForm(toForm(r)); }}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            Ubah
                          </button>
                          <button
                            disabled={pending}
                            onClick={() => run(() => toggleBankAccountActive(r.id, !r.isActive))}
                            className="font-medium text-amber-600 hover:underline disabled:opacity-50"
                          >
                            {r.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                          <button
                            disabled={pending}
                            onClick={() => run(() => deleteBankAccount(r.id), `Hapus rekening ${r.name}?`)}
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