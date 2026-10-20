import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, Label, PageHeader, Select, Input } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

function toDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ accountId?: string; from?: string; to?: string }>;
}) {
  const ctx = await requirePermission("journal.view");
  const sp = await searchParams;

  const now = new Date();
  const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const fromDate = toDate(sp.from, defaultFrom);
  const toDateValue = toDate(sp.to, now);
  const endOfDay = new Date(
    Date.UTC(
      toDateValue.getUTCFullYear(),
      toDateValue.getUTCMonth(),
      toDateValue.getUTCDate(),
      23,
      59,
      59
    )
  );

  const accounts = await prisma.account.findMany({
    where: { companyId: ctx.company.id, isGroup: false },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true, normalBalance: true },
  });

  const selected = accounts.find((a) => a.id === sp.accountId) ?? null;

  let openingNet = new Prisma.Decimal(0);
  let rows: Array<{
    id: string;
    date: Date;
    number: string;
    description: string | null;
    debit: Prisma.Decimal;
    credit: Prisma.Decimal;
    running: Prisma.Decimal;
  }> = [];

  if (selected) {
    const opening = await prisma.journalLine.aggregate({
      where: {
        accountId: selected.id,
        journalEntry: {
          companyId: ctx.company.id,
          status: "POSTED",
          date: { lt: fromDate },
        },
      },
      _sum: { debit: true, credit: true },
    });
    openingNet = (opening._sum.debit ?? new Prisma.Decimal(0)).minus(
      opening._sum.credit ?? new Prisma.Decimal(0)
    );

    const lines = await prisma.journalLine.findMany({
      where: {
        accountId: selected.id,
        journalEntry: {
          companyId: ctx.company.id,
          status: "POSTED",
          date: { gte: fromDate, lte: endOfDay },
        },
      },
      include: {
        journalEntry: {
          select: { number: true, date: true, description: true },
        },
      },
      orderBy: [{ journalEntry: { date: "asc" } }, { sortOrder: "asc" }],
    });

    let running = openingNet;
    rows = lines.map((l) => {
      running = running.plus(l.debit).minus(l.credit);
      return {
        id: l.id,
        date: l.journalEntry.date,
        number: l.journalEntry.number,
        description: l.description ?? l.journalEntry.description,
        debit: l.debit,
        credit: l.credit,
        running,
      };
    });
  }

  const isDebit = selected?.normalBalance === "DEBIT";
  const signed = (net: Prisma.Decimal) => (isDebit ? net : net.neg());
  const totalDebit = rows.reduce(
    (a, r) => a.plus(r.debit),
    new Prisma.Decimal(0)
  );
  const totalCredit = rows.reduce(
    (a, r) => a.plus(r.credit),
    new Prisma.Decimal(0)
  );

  return (
    <div>
      <PageHeader
        title="Buku Besar"
        description="Mutasi dan saldo per akun"
      />

      <Card className="mb-4 p-4">
        <form method="get" className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Label htmlFor="accountId">Akun</Label>
            <Select id="accountId" name="accountId" defaultValue={sp.accountId ?? ""}>
              <option value="">Pilih akun...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="from">Dari</Label>
            <Input
              id="from"
              name="from"
              type="date"
              defaultValue={fromDate.toISOString().slice(0, 10)}
            />
          </div>
          <div>
            <Label htmlFor="to">Sampai</Label>
            <Input
              id="to"
              name="to"
              type="date"
              defaultValue={toDateValue.toISOString().slice(0, 10)}
            />
          </div>
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Tampilkan
            </button>
          </div>
        </form>
      </Card>

      {!selected ? (
        <EmptyState
          title="Pilih akun"
          description="Pilih akun dan rentang tanggal untuk melihat buku besar."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              <span className="font-mono text-xs text-slate-500">
                {selected.code}
              </span>{" "}
              {selected.name}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Tanggal</th>
                  <th className="px-4 py-2.5 font-medium">Nomor</th>
                  <th className="px-4 py-2.5 font-medium">Keterangan</th>
                  <th className="px-4 py-2.5 text-right font-medium">Debit</th>
                  <th className="px-4 py-2.5 text-right font-medium">Kredit</th>
                  <th className="px-4 py-2.5 text-right font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-slate-50/60 text-slate-500">
                  <td className="px-4 py-2" colSpan={5}>
                    Saldo awal
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatCurrency(signed(openingNet).toString())}
                  </td>
                </tr>
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                      {formatDate(r.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-600">
                      {r.number}
                    </td>
                    <td className="px-4 py-2 text-slate-700">{r.description || "-"}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-800">
                      {Number(r.debit) > 0 ? formatCurrency(r.debit.toString()) : "-"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-800">
                      {Number(r.credit) > 0 ? formatCurrency(r.credit.toString()) : "-"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-900">
                      {formatCurrency(signed(r.running).toString())}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada mutasi pada rentang ini.
                    </td>
                  </tr>
                ) : null}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold">
                <tr>
                  <td className="px-4 py-3 text-slate-700" colSpan={3}>
                    Total mutasi
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                    {formatCurrency(totalDebit.toString())}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                    {formatCurrency(totalCredit.toString())}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                    {formatCurrency(
                      signed(openingNet.plus(totalDebit).minus(totalCredit)).toString()
                    )}
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
