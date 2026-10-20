import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, PageHeader, Label } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { DocumentActions } from "@/components/document-actions";

export const dynamic = "force-dynamic";

export default async function SalesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("sales.view");
  const { id } = await params;

  const inv = await prisma.salesInvoice.findFirst({
    where: { id, companyId: ctx.company.id },
    include: {
      customer: { select: { id: true, code: true, name: true, npwp: true, address: true, city: true } },
      lines: { orderBy: { sortOrder: "asc" }, include: { item: true, taxCode: true } },
      journalEntry: { select: { id: true, number: true, date: true } },
    },
  });

  if (!inv) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Faktur tidak ditemukan.</p>
      </div>
    );
  }

  const canPost = ctx.permissions.has("sales.post");
  const canManage = ctx.permissions.has("sales.manage");

  const total = Number(inv.total);
  const paid = Number(inv.paidAmount);
  const remaining = total - paid;

  return (
    <div>
      <PageHeader
        title={`Faktur ${inv.number}`}
        description={`Tanggal: ${formatDate(inv.date)} · Status: ${inv.status}`}
      >
        <div className="flex items-center gap-2">
          <DocumentActions
            kind="sales-invoice"
            id={inv.id}
            status={inv.status}
            canManage={canManage}
            canPost={canPost}
            blocksVoid={paid > 0}
            variant="detail"
          />
          <Link
            href="/sales"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            Kembali
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <Card className="p-4">
          <Label>Pelanggan</Label>
          <p className="text-slate-800 font-medium">
            {inv.customer.code} - {inv.customer.name}
          </p>
        </Card>
        <Card className="p-4">
          <Label>Jatuh Tempo</Label>
          <p className="text-slate-800 font-medium">{formatDate(inv.dueDate) || "-"}</p>
        </Card>
        <Card className="p-4">
          <Label>Total</Label>
          <p className="text-emerald-700 font-semibold text-lg">{formatCurrency(inv.total.toString())}</p>
        </Card>
        <Card className="p-4">
          <Label>Sisa Tagihan</Label>
          <p className={remaining > 0 ? "text-red-600" : "text-emerald-600"} font-semibold text-lg>
            {formatCurrency(remaining)}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Baris</th>
                <th className="px-4 py-2.5 font-medium">Item / Keterangan</th>
                <th className="px-4 py-2.5 text-right font-medium">Qty</th>
                <th className="px-4 py-2.5 text-right font-medium">Harga</th>
                <th className="px-4 py-2.5 text-right font-medium">Diskon</th>
                <th className="px-4 py-2.5 font-medium">Pajak</th>
                <th className="px-4 py-2.5 text-right font-medium">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inv.lines.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-500">
                    {l.sortOrder + 1}
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    <div>{l.item ? `${l.item.code} - ${l.item.name}` : l.description}</div>
                    {l.description && l.item ? (
                      <div className="text-xs text-slate-400">{l.description}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{l.qty.toString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatCurrency(l.unitPrice.toString())}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                    {l.discount.gt(0) ? formatCurrency(l.discount.toString()) : "-"}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {l.taxCode ? `${l.taxCode.code} (${(Number(l.taxCode.rate) * 100).toFixed(1)}%)` : "-"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-900">
                    {formatCurrency(l.lineTotal.toString())}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
              <tr>
                <td className="px-4 py-3 text-slate-700" colSpan={6}>Subtotal</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                  {formatCurrency(inv.subtotal.toString())}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-700" colSpan={6}>Diskon</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                  {formatCurrency(inv.discount.toString())}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-700" colSpan={6}>Pajak</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                  {formatCurrency(inv.taxAmount.toString())}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-900" colSpan={6}>Total</td>
                <td className="px-4 py-3 text-right tabular-nums text-emerald-700 text-lg">
                  {formatCurrency(inv.total.toString())}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {inv.journalEntry && (
        <Card className="mt-4 p-4 border-emerald-200 bg-emerald-50/50">
          <Label>Jurnal Otomatis</Label>
          <p className="text-slate-700">
            {inv.journalEntry.number} · {formatDate(inv.journalEntry.date)}
          </p>
        </Card>
      )}
    </div>
  );
}