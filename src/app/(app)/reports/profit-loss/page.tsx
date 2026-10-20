import { requirePermission } from "@/lib/auth-context";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { ReportFilters, ReportTotalRow, TreeRows, pruneZero } from "@/components/reports";
import {
  buildAccountTree,
  endOfDay,
  getAccountBalances,
  getCompanyAccounts,
  isoDay,
  parseDay,
} from "@/lib/accounting/reports";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function SectionHeader({ label }: { label: string }) {
  return (
    <tr className="bg-slate-100/80">
      <td className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600" colSpan={2}>
        {label}
      </td>
    </tr>
  );
}

export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const ctx = await requirePermission("report.view");
  const sp = await searchParams;

  const now = new Date();
  const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const fromDate = parseDay(sp.from, defaultFrom);
  const toDate = parseDay(sp.to, now);

  const accounts = await getCompanyAccounts(ctx.company.id);
  const balances = await getAccountBalances(ctx.company.id, {
    from: fromDate,
    to: endOfDay(toDate),
  });

  const revenue = buildAccountTree(accounts, balances, ["REVENUE"]);
  const expense = buildAccountTree(accounts, balances, ["EXPENSE"]);
  const totalRevenue = revenue.total;
  const totalExpense = expense.total;
  const netIncome = totalRevenue.minus(totalExpense);

  const empty = totalRevenue.isZero() && totalExpense.isZero();
  const tone = netIncome.gte(0) ? "green" : "red";

  return (
    <div>
      <PageHeader
        title="Laba Rugi"
        description={`Periode ${formatDate(fromDate)} — ${formatDate(toDate)}`}
      />

      <ReportFilters
        action="/reports/profit-loss"
        from={isoDay(fromDate)}
        to={isoDay(toDate)}
      />

      {empty ? (
        <EmptyState
          title="Belum ada pendapatan/beban"
          description="Belum ada jurnal pendapatan atau beban pada periode ini."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                <SectionHeader label="Pendapatan" />
                <TreeRows nodes={pruneZero(revenue.tree)} />
                <ReportTotalRow
                  label="Total Pendapatan"
                  value={formatCurrency(totalRevenue.toString())}
                />

                <SectionHeader label="Beban" />
                <TreeRows nodes={pruneZero(expense.tree)} />
                <ReportTotalRow
                  label="Total Beban"
                  value={formatCurrency(totalExpense.toString())}
                />

                <tr className="border-t-2 border-slate-300 bg-slate-50">
                  <td className="px-4 py-3 text-base font-bold text-slate-900">
                    {netIncome.gte(0) ? "Laba Bersih" : "Rugi Bersih"}
                  </td>
                  <td
                    className={`px-4 py-3 text-right text-base font-bold tabular-nums ${
                      tone === "green" ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {formatCurrency(netIncome.toString())}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
