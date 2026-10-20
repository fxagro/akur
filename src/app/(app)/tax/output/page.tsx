import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { TaxOutputClient } from "@/components/tax-output-client";
import { listOutputTaxInvoices } from "@/lib/actions/tax-actions";

export const dynamic = "force-dynamic";

export default async function TaxOutputPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const ctx = await requirePermission("tax.view");
  const sp = await searchParams;
  const year = Number(sp.year) || new Date().getUTCFullYear();
  const month = Number(sp.month) || new Date().getUTCMonth() + 1;

  const canManage = ctx.permissions.has("tax.manage");

  const [rows, invoices] = await Promise.all([
    listOutputTaxInvoices(ctx.company.id, year, month),
    prisma.salesInvoice.findMany({
      where: { companyId: ctx.company.id, status: "POSTED" },
      orderBy: { date: "desc" },
      select: { id: true, number: true, date: true, total: true, taxAmount: true, customer: { select: { name: true, npwp: true } } },
    }),
  ]);

  const formattedInvoices = invoices.map(i => {
    const total = Number(i.total);
    const taxAmount = Number(i.taxAmount);
    return {
      id: i.id,
      label: `${i.number} (${i.date.toISOString().slice(0,10)})`,
      customerName: i.customer.name,
      customerNpwp: i.customer.npwp,
      total: i.total.toString(),
      taxAmount: i.taxAmount.toString(),
      dpp: String(total - taxAmount),
      date: i.date.toISOString().slice(0,10),
    };
  });

  return (
    <div>
      <PageHeader
        title="Faktur Pajak Keluaran"
        description={`Periode ${month}/${year} — Faktur pajak dari penjualan (PPN Keluaran).`}
      >
        <form method="get" className="flex items-center gap-2">
          <select name="month" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" defaultValue={String(month)}>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={String(m)}>{String(m).padStart(2,"0")}</option>)}
          </select>
          <select name="year" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" defaultValue={String(year)}>
            {Array.from({length:5}, (_,i) => year - 2 + i).map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <button type="submit" className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800">
            Filter
          </button>
        </form>
      </PageHeader>

      <Card className="p-5">
        <TaxOutputClient
          rows={rows}
          invoices={formattedInvoices}
          canManage={canManage}
        />
      </Card>
    </div>
  );
}