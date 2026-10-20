import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { DocumentActions } from "@/components/document-actions";

export const dynamic = "force-dynamic";

export default async function PurchasePaymentsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; supplierId?: string }>;
}) {
  const ctx = await requirePermission("purchase.view");
  const sp = await searchParams;
  const status = sp.status as "DRAFT" | "POSTED" | "VOID" | undefined;
  const supplierId = sp.supplierId;

  const where: Record<string, unknown> = { companyId: ctx.company.id };
  if (status) where.status = status;
  if (supplierId) where.supplierId = supplierId;

  const payments = await prisma.purchasePayment.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      supplier: { select: { code: true, name: true } },
    },
  });

  const canPost = ctx.permissions.has("purchase.post");
  const canManage = ctx.permissions.has("purchase.manage");

  return (
    <div>
      <PageHeader
        title="Pembayaran"
        description="Pembayaran ke supplier, dialokasikan ke faktur pembelian."
      >
        <div className="flex items-center gap-3">
          <form method="get" className="flex items-center gap-2">
            <select
              name="status"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              defaultValue={status ?? ""}
            >
              <option value="">Semua Status</option>
              <option value="DRAFT">Draft</option>
              <option value="POSTED">Posted</option>
              <option value="VOID">Void</option>
            </select>
            <select
              name="supplierId"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              defaultValue={supplierId ?? ""}
            >
              <option value="">Semua Supplier</option>
              {(await prisma.supplier.findMany({
                where: { companyId: ctx.company.id, isActive: true },
                orderBy: { name: "asc" },
                select: { id: true, code: true, name: true },
              })).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Filter
            </button>
          </form>
        </div>
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Nomor</th>
                <th className="px-4 py-2.5 font-medium">Tanggal</th>
                <th className="px-4 py-2.5 font-medium">Supplier</th>
                <th className="px-4 py-2.5 font-medium">Metode</th>
                <th className="px-4 py-2.5 text-right font-medium">Jumlah</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-500">
                    {pay.number}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                    {formatDate(pay.date)}
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {pay.supplier.code} - {pay.supplier.name}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{pay.method}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-800">
                    {formatCurrency(pay.amount.toString())}
                  </td>
                  <td className="px-4 py-2">
                    <Badge
                      tone={
                        pay.status === "POSTED"
                          ? "green"
                          : pay.status === "VOID"
                            ? "red"
                            : "amber"
                      }
                    >
                      {pay.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <DocumentActions
                      kind="purchase-payment"
                      id={pay.id}
                      status={pay.status}
                      canManage={canManage}
                      canPost={canPost}
                    />
                  </td>
                </tr>
              ))}
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada pembayaran.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}