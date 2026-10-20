"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runDepreciation, getAssetsForDepreciation } from "@/lib/actions/depreciation-actions";
import { Card, EmptyState, Input, Label, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";

export type DepreciationPreviewRow = {
  id: string;
  code: string;
  name: string;
  bookValue: string;
  monthlyDepreciation: string;
};

export function DepreciationClient({
  rows,
  canManage,
}: {
  rows: any[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [periodDate, setPeriodDate] = useState(new Date().toISOString().slice(0, 7));
  const [previewData, setPreviewData] = useState<{
    assets: any[];
    total: string;
  } | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [pendingAction, startTransitionAction] = useTransition();

  const loadPreview = async () => {
    setError(null);
    startTransition(async () => {
      try {
        const data = await getAssetsForDepreciation(periodDate);
        setPreviewData({ assets: data.assets, total: data.total.toString() });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat data");
      }
    });
  };

  const toggleAsset = (id: string) => {
    setSelectedAssets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    const data = previewData;
    if (!data) return;
    const allSelected = Object.values(selectedAssets).every(Boolean);
    const next = allSelected
      ? {}
      : data.assets.reduce((acc, a) => ({ ...acc, [a.id]: !allSelected }), {});
    setSelectedAssets(next);
  };

  const runDepreciationAction = () => {
    const selected = Object.keys(selectedAssets).filter((id) => selectedAssets[id]);
    if (selected.length === 0) {
      alert("Pilih minimal 1 aset");
      return;
    }
    startTransitionAction(async () => {
      const res = await runDepreciation({ periodDate, assetIds: selected });
      if (res.ok) {
        setRunResult(`Berhasil menjalankan penyusutan untuk ${res.count} aset. ${res.journalIds.length} jurnal dibuat.`);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={loadPreview}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Muat Pratinjau
        </button>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
          <div>
            <Label>Periode (Bulan/Tahun)</Label>
            <Input type="month" value={periodDate} onChange={(e) => setPeriodDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadPreview}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Muat Pratinjau
            </button>
          </div>
        </div>

        {previewData ? (
          <div>
            <div className="grid gap-4 sm:grid-cols-3 mb-4">
              <Card className="p-4">
                <Label>Total Aset Akan Disusutkan</Label>
                <p className="text-2xl font-bold text-slate-900">{previewData.assets.length}</p>
              </Card>
              <Card className="p-4">
                <Label>Total Penyusutan Bulanan</Label>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(previewData.total)}</p>
              </Card>
              <Card className="p-4">
                <Label>Total Nilai Buku</Label>
                <p className="text-2xl font-bold text-slate-900">
                  {previewData.assets.reduce((s, a) => s + Number(a.bookValue), 0).toLocaleString("id-ID")}
                </p>
              </Card>
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">Pilih Aset untuk Disusutkan</p>
              {previewData.assets.length > 0 && (
                <button onClick={toggleAll} className="text-xs font-medium text-blue-600 hover:underline">
                  {Object.values(selectedAssets).every(Boolean) ? "Batalkan semua" : "Pilih semua"}
                </button>
              )}
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-medium w-10">
                        <input
                          type="checkbox"
                          checked={previewData.assets.length > 0 && Object.values(selectedAssets).every(Boolean)}
                          onChange={toggleAll}
                        />
                      </th>
                    <th className="px-4 py-2.5 font-medium">Kode</th>
                    <th className="px-4 py-2.5 font-medium">Nama</th>
                    <th className="px-4 py-2.5 text-right font-medium">Nilai Buku</th>
                    <th className="px-4 py-2.5 text-right font-medium">Penyusutan Bulanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.assets.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={!!selectedAssets[a.id]}
                          onChange={() => setSelectedAssets((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-500">{a.code}</td>
                      <td className="px-4 py-2 text-slate-700">{a.name}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-800">{formatCurrency(a.bookValue)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-emerald-600">{formatCurrency(a.monthlyDepreciation)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {Object.values(selectedAssets).filter(Boolean).length} aset dipilih
            </p>
            <button
              onClick={runDepreciationAction}
              disabled={pendingAction || Object.values(selectedAssets).filter(Boolean).length === 0}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white transition ${
                Object.values(selectedAssets).filter(Boolean).length === 0 || pendingAction
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {pendingAction ? "Memproses..." : "Jalankan Penyusutan"}
            </button>
          </div>

          {runResult && (
            <div className="mt-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              {runResult}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <button
            onClick={loadPreview}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Pilih Tanggal & Muat Data
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      </Card>
    </div>
  );
}