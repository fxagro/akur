import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, PageHeader, Label } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { DocumentActions } from "@/components/document-actions";

export const dynamic = "force-dynamic";

export default async function PurchasePaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("purchase.view");
  const { id } = await params;

  const pay = await prisma.purchasePayment.findFirst({
    where: { id, companyId: ctx.company.id },
    include: {
      supplier: { select: { id: true, code: true, name: true } },
      allocations: {
        include: {
          invoice: { select: { id: true, number: true, total: true, paidAmount: true } },
        },
      },
      journalEntry: { select: { id: true, number: true, date: true } },
    },
  });

  if (!pay) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Pembayaran tidak ditemukan.</p>
      </div>
    );
  }

  const canPost = ctx.permissions.has("purchase.post");
  const canManage = ctx.permissions.has("purchase.manage");

  return (
    <div>
      <PageHeader
        title={`Pembayaran ${pay.number}`}
        description={`Tanggal: ${formatDate(pay.date)} · Status: ${pay.status}`}
      >
        <div className="flex items-center gap-2">
          <DocumentActions
            kind="purchase-payment"
            id={pay.id}
            status={pay.status}
            canManage={canManage}
            canPost={canPost}
            variant="detail"
          />
          <Link
            href="/purchases/payments"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            Kembali
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <Card className="p-4">
          <Label>Supplier</Label>
          <p className="text-slate-800 font-medium">
            {pay.supplier.code} - {pay.supplier.name}
          </p>
        </Card>
        <Card className="p-4">
          <Label>Metode</Label>
          <p className="text-slate-800 font-medium">{pay.method}</p>
        </Card>
        <Card className="p-4">
          <Label>Jumlah</Label>
          <p className="text-red-600 font-semibold text-lg">{formatCurrency(pay.amount.toString())}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Alokasi ke Faktur</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Faktur</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
                <th className="px-4 py-2.5 text-right font-medium">Dibayar Sebelumnya</th>
                <th className="px-4 py-2.5 text-right font-medium">Alokasi Ini</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pay.allocations.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-500">
                    {a.invoice.number}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatCurrency(a.invoice.total.toString())}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                    {formatCurrency(a.invoice.paidAmount.toString())}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-900">
                    {formatCurrency(a.amount.toString())}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
              <tr>
                <td className="px-4 py-3 text-slate-900" colSpan={3}>Total Alokasi</td>
                <td className="px-4 py-3 text-right tabular-nums text-red-600 text-lg">
                  {formatCurrency(pay.amount.toString())}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {pay.journalEntry && (
        <Card className="mt-4 p-4 border-emerald-200 bg-emerald-50/50">
          <Label>Jurnal Otomatis</Label>
          <p className="text-slate-700">
            {pay.journalEntry.number} · {formatDate(pay.journalEntry.date)}
          </p>
        </Card>
      )}
    </div>
  );
}