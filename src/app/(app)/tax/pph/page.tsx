import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { TaxPphClient } from "@/components/tax-pph-client";

export const dynamic = "force-dynamic";

export default async function TaxPphPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const ctx = await requirePermission("tax.view");
  const sp = await searchParams;
  const year = Number(sp.year) || new Date().getUTCFullYear();
  const month = Number(sp.month) || new Date().getUTCMonth() + 1;

  const canManage = ctx.permissions.has("tax.manage");

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  const [rows, taxCodes] = await Promise.all([
    prisma.taxInvoice.findMany({
      where: { companyId: ctx.company.id, direction: "INPUT", refType: { not: "PURCHASE_INVOICE" }, date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    }),
    prisma.taxCode.findMany({
      where: { companyId: ctx.company.id, type: "PPH", isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true, rate: true, accountId: true },
    }),
  ]);

  const formattedTaxCodes = taxCodes.map(t => ({ ...t, rate: t.rate.toString() }));

  return (
    <div>
      <PageHeader
        title="PPh (Pemotongan / Pemungutan)"
        description={`Periode ${month}/${year} — Catat PPh 21, 23, 4(2), Final, dll.`}
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
        <TaxPphClient
          rows={rows}
          taxCodes={formattedTaxCodes}
          canManage={ctx.permissions.has("tax.manage")}
        />
      </Card>
    </div>
  );
}