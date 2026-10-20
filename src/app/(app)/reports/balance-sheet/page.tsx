import { requirePermission } from "@/lib/auth-context";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
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

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const ctx = await requirePermission("report.view");
  const sp = await searchParams;

  const now = new Date();
  const toDate = parseDay(sp.to, now);

  const accounts = await getCompanyAccounts(ctx.company.id);
  const balances = await getAccountBalances(ctx.company.id, { to: endOfDay(toDate) });

  const assets = buildAccountTree(accounts, balances, ["ASSET"]);
  const liabilities = buildAccountTree(accounts, balances, ["LIABILITY"]);
  const equity = buildAccountTree(accounts, balances, ["EQUITY"]);
  const revenue = buildAccountTree(accounts, balances, ["REVENUE"]);
  const expense = buildAccountTree(accounts, balances, ["EXPENSE"]);

  const netIncome = revenue.total.minus(expense.total);
  const totalEquity = equity.total.plus(netIncome);
  const totalAssets = assets.total;
  const totalLiabEquity = liabilities.total.plus(totalEquity);
  const balanced = totalAssets.equals(totalLiabEquity);

  const empty =
    totalAssets.isZero() && liabilities.total.isZero() && totalEquity.isZero();

  const equityRows = pruneZero(equity.tree);

  return (
    <div>
      <PageHeader title="Neraca" description={`Posisi keuangan per ${formatDate(toDate)}`}>
        <Badge tone={balanced ? "green" : "red"}>
          {balanced ? "Seimbang" : "Selisih " + formatCurrency(totalAssets.minus(totalLiabEquity).toString())}
        </Badge>
      </PageHeader>

      <ReportFilters
        action="/reports/balance-sheet"
        from={isoDay(toDate)}
        to={isoDay(toDate)}
        showFrom={false}
      />

      {empty ? (
        <EmptyState
          title="Belum ada saldo"
          description="Belum ada jurnal terposting sampai tanggal ini."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                <SectionHeader label="Aset" />
                <TreeRows nodes={pruneZero(assets.tree)} />
                <ReportTotalRow
                  label="Total Aset"
                  value={formatCurrency(totalAssets.toString())}
                />

                <SectionHeader label="Liabilitas" />
                <TreeRows nodes={pruneZero(liabilities.tree)} />
                <ReportTotalRow
                  label="Total Liabilitas"
                  value={formatCurrency(liabilities.total.toString())}
                />

                <SectionHeader label="Ekuitas" />
                <TreeRows nodes={equityRows} />
                <tr>
                  <td className="px-4 py-2 font-semibold text-slate-800">
                    Laba (Rugi) Tahun Berjalan
                  </td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums text-slate-800">
                    {formatCurrency(netIncome.toString())}
                  </td>
                </tr>
                <ReportTotalRow
                  label="Total Ekuitas"
                  value={formatCurrency(totalEquity.toString())}
                />

                <tr className="border-t-2 border-slate-300 bg-slate-50">
                  <td className="px-4 py-3 text-base font-bold text-slate-900">
                    Total Liabilitas + Ekuitas
                  </td>
                  <td
                    className={`px-4 py-3 text-right text-base font-bold tabular-nums ${
                      balanced ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {formatCurrency(totalLiabEquity.toString())}
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
