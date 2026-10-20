import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHeader } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { JournalRowActions } from "../row-actions";

export const dynamic = "force-dynamic";

export default async function JournalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("journal.view");
  const { id } = await params;

  const entry = await prisma.journalEntry.findFirst({
    where: { id, companyId: ctx.company.id },
    include: {
      lines: {
        orderBy: { sortOrder: "asc" },
        include: { account: { select: { code: true, name: true } } },
      },
      period: { select: { name: true, status: true } },
      createdBy: { select: { name: true } },
    },
  });

  if (!entry) notFound();

  const canCreate = ctx.isSuperAdmin || ctx.permissions.has("journal.create");
  const canPost = ctx.isSuperAdmin || ctx.permissions.has("journal.post");
  const canVoid = ctx.isSuperAdmin || ctx.permissions.has("journal.void");

  return (
    <div>
      <PageHeader title={`Jurnal ${entry.number}`}>
        <Link
          href="/journals"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Kembali
        </Link>
        {entry.status === "DRAFT" && canCreate ? (
          <Link
            href={`/journals/${entry.id}/edit`}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Ubah
          </Link>
        ) : null}
      </PageHeader>

      <Card className="p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
            <div className="mt-1">
              {entry.status === "POSTED" ? (
                <Badge tone="green">Posted</Badge>
              ) : entry.status === "VOID" ? (
                <Badge tone="red">Void</Badge>
              ) : (
                <Badge tone="amber">Draft</Badge>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Tanggal</p>
            <p className="mt-1 text-sm text-slate-800">{formatDate(entry.date)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Periode</p>
            <p className="mt-1 text-sm text-slate-800">{entry.period?.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Referensi</p>
            <p className="mt-1 text-sm text-slate-800">{entry.reference || "-"}</p>
          </div>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Keterangan</p>
          <p className="mt-1 text-sm text-slate-800">{entry.description || "-"}</p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400">
            Dibuat oleh {entry.createdBy?.name ?? "-"}
            {entry.postedAt ? ` · diposting ${formatDate(entry.postedAt)}` : ""}
          </p>
          <JournalRowActions
            id={entry.id}
            status={entry.status}
            canPost={canPost}
            canVoid={canVoid}
            canDelete={canCreate}
          />
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Akun</th>
              <th className="px-4 py-2.5 font-medium">Keterangan</th>
              <th className="px-4 py-2.5 text-right font-medium">Debit</th>
              <th className="px-4 py-2.5 text-right font-medium">Kredit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entry.lines.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2 text-slate-700">
                  <span className="font-mono text-xs text-slate-500">
                    {l.account.code}
                  </span>{" "}
                  {l.account.name}
                </td>
                <td className="px-4 py-2 text-slate-600">{l.description || "-"}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-800">
                  {Number(l.debit) > 0 ? formatCurrency(l.debit.toString()) : "-"}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-800">
                  {Number(l.credit) > 0 ? formatCurrency(l.credit.toString()) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold">
            <tr>
              <td className="px-4 py-3 text-slate-700" colSpan={2}>
                Total
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                {formatCurrency(entry.totalDebit.toString())}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                {formatCurrency(entry.totalCredit.toString())}
              </td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  );
}
