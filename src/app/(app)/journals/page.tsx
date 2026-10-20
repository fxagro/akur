import Link from "next/link";
import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { JournalRowActions } from "./row-actions";

export const dynamic = "force-dynamic";

export default async function JournalsPage() {
  const ctx = await requirePermission("journal.view");

  const entries = await prisma.journalEntry.findMany({
    where: { companyId: ctx.company.id },
    orderBy: [{ date: "desc" }, { number: "desc" }],
    take: 200,
    include: { _count: { select: { lines: true } } },
  });

  const canCreate = ctx.isSuperAdmin || ctx.permissions.has("journal.create");
  const canPost = ctx.isSuperAdmin || ctx.permissions.has("journal.post");
  const canVoid = ctx.isSuperAdmin || ctx.permissions.has("journal.void");

  return (
    <div>
      <PageHeader
        title="Jurnal Umum"
        description={`${entries.length} jurnal terakhir`}
      >
        {canCreate ? (
          <Link
            href="/journals/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Buat Jurnal
          </Link>
        ) : null}
      </PageHeader>

      {entries.length === 0 ? (
        <EmptyState
          title="Belum ada jurnal"
          description="Mulai dengan membuat jurnal umum pertama Anda."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Nomor</th>
                  <th className="px-4 py-2.5 font-medium">Tanggal</th>
                  <th className="px-4 py-2.5 font-medium">Keterangan</th>
                  <th className="px-4 py-2.5 text-right font-medium">Debit</th>
                  <th className="px-4 py-2.5 text-center font-medium">Baris</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-700">
                      <Link href={`/journals/${e.id}`} className="hover:underline">
                        {e.number}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                      {formatDate(e.date)}
                    </td>
                    <td className="max-w-xs truncate px-4 py-2 text-slate-700">
                      {e.description || e.reference || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-slate-700">
                      {formatCurrency(e.totalDebit.toString())}
                    </td>
                    <td className="px-4 py-2 text-center text-slate-500">
                      {e._count.lines}
                    </td>
                    <td className="px-4 py-2">
                      {e.status === "POSTED" ? (
                        <Badge tone="green">Posted</Badge>
                      ) : e.status === "VOID" ? (
                        <Badge tone="red">Void</Badge>
                      ) : (
                        <Badge tone="amber">Draft</Badge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">
                      <JournalRowActions
                        id={e.id}
                        status={e.status}
                        canPost={canPost}
                        canVoid={canVoid}
                        canDelete={canCreate}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
