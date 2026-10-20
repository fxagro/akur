import { requirePermission } from "@/lib/auth-context";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { ReportFilters } from "@/components/reports";
import {
  endOfDay,
  getAccountBalances,
  getCompanyAccounts,
  isoDay,
  parseDay,
} from "@/lib/accounting/reports";
import { formatCurrency } from "@/lib/format";
import { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function TrialBalancePage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const ctx = await requirePermission("report.view");
  const sp = await searchParams;

  const asOf = parseDay(sp.to, new Date());
  const accounts = await getCompanyAccounts(ctx.company.id);
  const balances = await getAccountBalances(ctx.company.id, { to: endOfDay(asOf) });

  const rows = accounts
    .filter((a) => !a.isGroup)
    .map((a) => {
      const b = balances.get(a.id);
      const net = (b?.debit ?? new Prisma.Decimal(0)).minus(
        b?.credit ?? new Prisma.Decimal(0)
      );
      return {
        id: a.id,
        code: a.code,
        name: a.name,
        debit: net.gt(0) ? net : new Prisma.Decimal(0),
        credit: net.lt(0) ? net.neg() : new Prisma.Decimal(0),
      };
    })
    .filter((r) => !r.debit.isZero() || !r.credit.isZero());

  const totalDebit = rows.reduce((a, r) => a.plus(r.debit), new Prisma.Decimal(0));
  const totalCredit = rows.reduce((a, r) => a.plus(r.credit), new Prisma.Decimal(0));
  const balanced = totalDebit.equals(totalCredit);

  return (
    <div>
      <PageHeader
        title="Neraca Saldo"
        description="Saldo setiap akun sampai tanggal tertentu"
      >
        <Badge tone={balanced ? "green" : "red"}>
          {balanced ? "Seimbang" : "Tidak seimbang"}
        </Badge>
      </PageHeader>

      <ReportFilters
        action="/reports/trial-balance"
        from={isoDay(asOf)}
        to={isoDay(asOf)}
        showFrom={false}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Belum ada saldo"
          description="Belum ada jurnal terposting sampai tanggal ini."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Kode</th>
                  <th className="px-4 py-2.5 font-medium">Nama Akun</th>
                  <th className="px-4 py-2.5 text-right font-medium">Debit</th>
                  <th className="px-4 py-2.5 text-right font-medium">Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-500">
                      {r.code}
                    </td>
                    <td className="px-4 py-2 text-slate-700">{r.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-800">
                      {r.debit.isZero() ? "-" : formatCurrency(r.debit.toString())}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-800">
                      {r.credit.isZero() ? "-" : formatCurrency(r.credit.toString())}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                <tr>
                  <td className="px-4 py-3 text-slate-700" colSpan={2}>
                    Total
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                    {formatCurrency(totalDebit.toString())}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                    {formatCurrency(totalCredit.toString())}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
