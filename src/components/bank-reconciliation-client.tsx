"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveReconciliation, getReconciliationData } from "@/lib/actions/bank-transaction-actions";
import { Card, Input, Label, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";

export type BankAccountSummary = {
  id: string;
  name: string;
  openingBalance: string;
  accountId: string;
};

export type ReconciliationTransaction = {
  id: string;
  date: string;
  description: string | null;
  debit: string;
  credit: string;
  balance: string;
  isReconciled: boolean;
  reconciledAt: string | null;
};

export type ReconciliationData = {
  bankAccount: BankAccountSummary;
  transactions: ReconciliationTransaction[];
  bookBalance: string;
};

export function ReconciliationClient({
  bankAccountId,
  canManage,
}: {
  bankAccountId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [statementDate, setStatementDate] = useState(new Date().toISOString().slice(0, 10));
  const [statementEndingBalance, setStatementEndingBalance] = useState("");
  const [reconciliationData, setReconciliationData] = useState<{
    bankAccount: { id: string; name: string; openingBalance: string; accountId: string };
    transactions: ReconciliationTransaction[];
    bookBalance: string;
  } | null>(null);
  const [clearedIds, setClearedIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, startTransitionAction] = useTransition();
  const [reconciledResult, setReconciledResult] = useState<string | null>(null);

  const loadData = () => {
    startTransition(async () => {
      try {
        const data = await getReconciliationData(bankAccountId, statementDate);
        setReconciliationData(data);
        setClearedIds({});
        setReconciledResult(null);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat data");
      }
    });
  };

  const toggleClear = (id: string) => {
    setClearedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const clearAll = () => {
    const data = reconciliationData;
    if (!data) return;
    const allCleared = data.transactions.every((t) => clearedIds[t.id]);
    const next = allCleared
      ? {}
      : data.transactions.reduce((acc, t) => ({ ...acc, [t.id]: true }), {});
    setClearedIds(next);
  };

  const handleReconcile = () => {
    setError(null);
    startTransitionAction(async () => {
      const clearedIdsArray = Object.keys(clearedIds).filter((id) => clearedIds[id]);
      const res = await saveReconciliation({
        bankAccountId,
        statementDate,
        statementEndingBalance: Number(statementEndingBalance) || 0,
        clearedTransactionIds: clearedIdsArray,
      });
      if (res.ok) {
        setReconciledResult("Rekonsiliasi berhasil disimpan");
        loadData();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const clearedCount = Object.values(clearedIds).filter(Boolean).length;
  const clearedAmount = reconciliationData?.transactions
    .filter((t) => clearedIds[t.id])
    .reduce((sum, t) => sum + Number(t.debit) - Number(t.credit), 0) || 0;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={loadData}
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Memuat..." : "Muat Data"}
        </button>
      </div>

      {reconciliationData ? (
        <Card className="mb-4 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-4">
            <div>
              <Label>Tanggal Pernyataan</Label>
              <Input
                type="date"
                value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Saldo Akhir Pernyataan Bank</Label>
              <Input
                type="number"
                step="0.01"
                value={statementEndingBalance}
                onChange={(e) => setStatementEndingBalance(e.target.value)}
                className="text-right tabular-nums"
                placeholder="0"
              />
            </div>
            <div className="flex items-end">
              {canManage && (
                <button
                  onClick={handleReconcile}
                  disabled={pendingAction}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:bg-slate-400"
                >
                  {pendingAction ? "Menyimpan..." : "Simpan Rekonsiliasi"}
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <Card className="p-4">
              <Label>Saldo Buku (Book Balance)</Label>
              <p className="text-2xl font-bold text-slate-900">{reconciliationData.bookBalance}</p>
            </Card>
            <Card className="p-4">
              <Label>Saldo Bank (Statement)</Label>
              <p className="text-2xl font-bold text-emerald-600">{statementEndingBalance ? formatCurrency(statementEndingBalance) : "0"}</p>
            </Card>
            <Card className="p-4">
              <Label>Selisih</Label>
              <p className={`text-2xl font-bold ${reconciliationData.bookBalance && statementEndingBalance && Number(reconciliationData.bookBalance) === Number(statementEndingBalance) ? "text-emerald-600" : "text-red-600"}`}>
                {reconciliationData.bookBalance && statementEndingBalance
                  ? formatCurrency(Math.abs(Number(statementEndingBalance) - Number(reconciliationData.bookBalance)))
                  : "0"}
              </p>
            </Card>
          </div>

          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-900">Transaksi ({reconciliationData.transactions.length})</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">{clearedCount} direkonsiliasi</span>
              {reconciliationData.transactions.length > 0 ? (
                <button
                  onClick={clearAll}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  {Object.values(clearedIds).every(Boolean) ? "Bersihkan semua" : "Pilih semua"}
                </button>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium w-10">
                    <input
                      type="checkbox"
                      checked={reconciliationData.transactions.length > 0 && Object.values(clearedIds).every(Boolean)}
                      onChange={clearAll}
                    />
                  </th>
                  <th className="px-4 py-2.5 font-medium">Tanggal</th>
                  <th className="px-4 py-2.5 font-medium">Keterangan</th>
                  <th className="px-4 py-2.5 text-right font-medium">Debit</th>
                  <th className="px-4 py-2.5 text-right font-medium">Kredit</th>
                  <th className="px-4 py-2.5 text-right font-medium">Saldo</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reconciliationData.transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={!!clearedIds[t.id]}
                        onChange={() => toggleClear(t.id)}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">{formatDate(t.date)}</td>
                    <td className="px-4 py-2 text-slate-700">{t.description || "-"}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-emerald-600">
                      {Number(t.debit) > 0 ? formatCurrency(t.debit) : "-"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-red-600">
                      {Number(t.credit) > 0 ? formatCurrency(t.credit) : "-"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-900">{formatCurrency(t.balance)}</td>
                    <td className="px-4 py-2">
                      <Badge tone={t.isReconciled ? "green" : "amber"}>
                        {t.isReconciled ? "Direkonsiliasi" : "Belum"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                <tr>
                  <td className="px-4 py-3 text-slate-700" colSpan={3}>
                    Total Direkonsiliasi: {formatCurrency(clearedAmount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-900" colSpan={3} />
                  <td className="px-4 py-3 text-slate-600" />
                </tr>
              </tfoot>
            </table>
          </div>

          {reconciledResult && (
            <div className="mt-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              {reconciledResult}
            </div>
          )}
        </Card>
      ) : (
        <div className="text-center py-8">
          <button onClick={loadData} disabled={pending} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
            Pilih Tanggal &amp; Muat Data
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}