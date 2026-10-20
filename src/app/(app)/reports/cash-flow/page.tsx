import { requirePermission } from "@/lib/auth-context";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { ReportFilters } from "@/components/reports";
import {
  endOfDay,
  getCashFlow,
  isoDay,
  parseDay,
} from "@/lib/accounting/reports";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function Line({
  label,
  value,
  indent = false,
  strong = false,
}: {
  label: string;
  value: string;
  indent?: boolean;
  strong?: boolean;
}) {
  return (
    <tr className={strong ? "border-t border-slate-200 bg-slate-50/80" : undefined}>
      <td className={`px-4 py-2 ${indent ? "pl-8" : ""} ${strong ? "font-semibold text-slate-900" : "text-slate-700"}`}>
        {label}
      </td>
      <td className={`px-4 py-2 text-right tabular-nums ${strong ? "font-semibold text-slate-900" : "text-slate-800"}`}>
        {value}
      </td>
    </tr>
  );
}

export default async function CashFlowPage({
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

  const cf = await getCashFlow(ctx.company.id, {
    from: fromDate,
    to: endOfDay(toDate),
  });

  const noMovement =
    cf.groups.operating.isZero() &&
    cf.groups.investing.isZero() &&
    cf.groups.financing.isZero();

  return (
    <div>
      <PageHeader
        title="Arus Kas"
        description={`Periode ${formatDate(fromDate)} — ${formatDate(toDate)}`}
      />

      <ReportFilters action="/reports/cash-flow" from={isoDay(fromDate)} to={isoDay(toDate)} />

      {noMovement && cf.opening.isZero() ? (
        <EmptyState
          title="Belum ada mutasi kas"
          description="Belum ada jurnal terposting yang menyentuh akun kas/bank pada periode ini."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                <Line label="Saldo Awal Kas" value={formatCurrency(cf.opening.toString())} strong />

                <tr className="bg-slate-100/80">
                  <td className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600" colSpan={2}>
                    Aktivitas Operasi
                  </td>
                </tr>
                <Line
                  label="Arus kas dari operasi"
                  value={formatCurrency(cf.groups.operating.toString())}
                  indent
                />

                <tr className="bg-slate-100/80">
                  <td className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600" colSpan={2}>
                    Aktivitas Investasi
                  </td>
                </tr>
                <Line
                  label="Arus kas dari investasi"
                  value={formatCurrency(cf.groups.investing.toString())}
                  indent
                />

                <tr className="bg-slate-100/80">
                  <td className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600" colSpan={2}>
                    Aktivitas Pendanaan
                  </td>
                </tr>
                <Line
                  label="Arus kas dari pendanaan"
                  value={formatCurrency(cf.groups.financing.toString())}
                  indent
                />

                <Line
                  label="Kenaikan (Penurunan) Kas Bersih"
                  value={formatCurrency(cf.netChange.toString())}
                  strong
                />

                <tr className="border-t-2 border-slate-300 bg-slate-50">
                  <td className="px-4 py-3 text-base font-bold text-slate-900">
                    Saldo Akhir Kas
                  </td>
                  <td className="px-4 py-3 text-right text-base font-bold tabular-nums text-slate-900">
                    {formatCurrency(cf.closing.toString())}
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
