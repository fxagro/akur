import { requirePermission } from "@/lib/auth-context";
import { Card, PageHeader, Badge, Label } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { getSptPpn, listOutputTaxInvoices, listInputTaxInvoices, listPphRecords } from "@/lib/actions/tax-actions";

export const dynamic = "force-dynamic";

export default async function SptPpnPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const ctx = await requirePermission("tax.view");
  const sp = await searchParams;
  const year = Number(sp.year) || new Date().getUTCFullYear();
  const month = Number(sp.month) || new Date().getUTCMonth() + 1;

  const [spt, outputInvoices, inputInvoices, pphRecords] = await Promise.all([
    getSptPpn(ctx.company.id, year, month),
    listOutputTaxInvoices(ctx.company.id, year, month),
    listInputTaxInvoices(ctx.company.id, year, month),
    listPphRecords(ctx.company.id, year, month),
  ]);

  return (
    <div>
      <PageHeader
        title="SPT PPN Masa"
        description={`Periode ${month}/${year} — Surat Pemberitahuan PPN Masa (e-Faktur).`}
      >
        <form method="get" className="flex items-center gap-2">
          <select name="month" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" defaultValue={String(month)}>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={String(m)}>{String(m).padStart(2,"0")}</option>)}
          </select>
          <select name="year" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" defaultValue={String(year)}>
            {Array.from({length:5}, (_,i) => year - 2 + i).map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <button type="submit" className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800">
            Tampilkan
          </button>
        </form>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="p-4">
          <Label>PPN Keluaran (Output)</Label>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(spt.output.totalPpn.toString())}</p>
          <p className="text-sm text-slate-500">{spt.output.count} faktur · DPP {formatCurrency(spt.output.totalDpp.toString())}</p>
        </Card>
        <Card className="p-4">
          <Label>PPN Masukan (Input)</Label>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(spt.input.totalPpn.toString())}</p>
          <p className="text-sm text-slate-500">{spt.input.count} faktur · DPP {formatCurrency(spt.input.totalDpp.toString())}</p>
        </Card>
        <Card className="p-4">
          <Label>PPnBM Keluaran</Label>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(spt.output.totalPpnbm.toString())}</p>
        </Card>
        <Card className="p-4">
          <Label className="text-lg">Status SPT</Label>
          <div className="mt-1 flex items-center gap-2">
            <Badge tone={spt.status === "KB" ? "red" : spt.status === "LB" ? "green" : "amber"}>
              {spt.status === "KB" ? "Kurang Bayar" : spt.status === "LB" ? "Lebih Bayar" : "Nol"}
            </Badge>
            <span className="font-mono text-base text-slate-700">Rp {formatCurrency(Math.abs(Number(spt.lb)).toString())}</span>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Faktur Pajak Keluaran ({outputInvoices.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Tanggal</th>
                  <th className="px-4 py-2 font-medium">No. Faktur Pajak</th>
                  <th className="px-4 py-2 font-medium">Faktur Jual</th>
                  <th className="px-4 py-2 font-medium">Pembeli</th>
                  <th className="px-4 py-2 text-right font-medium">DPP</th>
                  <th className="px-4 py-2 text-right font-medium">PPN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outputInvoices.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">{formatDate(r.date)}</td>
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-500">{r.number}</td>
                    <td className="px-4 py-2 text-slate-600">{r.salesInvoice?.number || "-"}</td>
                    <td className="px-4 py-2 text-slate-700">{r.partnerName}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-800">{formatCurrency(r.dpp.toString())}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-800">{formatCurrency(r.ppn.toString())}</td>
                  </tr>
                ))}
                {outputInvoices.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Tidak ada faktur pajak keluaran.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Faktur Pajak Masukan ({inputInvoices.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Tanggal</th>
                  <th className="px-4 py-2 font-medium">No. Faktur Pajak</th>
                  <th className="px-4 py-2 font-medium">Faktur Beli</th>
                  <th className="px-4 py-2 font-medium">Penjual</th>
                  <th className="px-4 py-2 text-right font-medium">DPP</th>
                  <th className="px-4 py-2 text-right font-medium">PPN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inputInvoices.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">{formatDate(r.date)}</td>
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-500">{r.number}</td>
                    <td className="px-4 py-2 text-slate-600">{r.purchaseInvoice?.number || "-"}</td>
                    <td className="px-4 py-2 text-slate-700">{r.partnerName}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-800">{formatCurrency(r.dpp.toString())}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-800">{formatCurrency(r.ppn.toString())}</td>
                  </tr>
                ))}
                {inputInvoices.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Tidak ada faktur pajak masukan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {pphRecords.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">PPh (Pemotongan/Pemungutan) - {pphRecords.length} catatan</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Tanggal</th>
                  <th className="px-4 py-2 font-medium">Jenis</th>
                  <th className="px-4 py-2 font-medium">Lawan Transaksi</th>
                  <th className="px-4 py-2 text-right font-medium">Bruto</th>
                  <th className="px-4 py-2 text-right font-medium">PPh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pphRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">{formatDate(r.date)}</td>
                    <td className="px-4 py-2">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {r.refType === "SALARY" ? "Gaji" : r.refType === "PURCHASE_PAYMENT" ? "Supplier" : "Lainnya"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-700">{r.partnerName}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-800">{formatCurrency(r.dpp.toString())}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-red-600 font-medium">{formatCurrency(r.ppn.toString())}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="mt-6 p-4 border-emerald-200 bg-emerald-50/50">
        <p className="text-sm font-semibold text-emerald-800 mb-2">Siap lapor e-Faktur</p>
        <ul className="text-sm text-emerald-700 space-y-1 list-disc pl-5">
          <li>Total PPN Keluaran: <strong>{formatCurrency(spt.output.totalPpn.toString())}</strong></li>
          <li>Total PPN Masukan (kredit): <strong>{formatCurrency(spt.input.totalPpn.toString())}</strong></li>
          <li>PPN Terutang / (Lebih): <strong>{formatCurrency(spt.lb.toString())}</strong> ({spt.status === "KB" ? "KB" : spt.status === "LB" ? "LB" : "Nol"})</li>
          <li>PPnBM: <strong>{formatCurrency(spt.output.totalPpnbm.toString())}</strong></li>
        </ul>
      </Card>
    </div>
  );
}