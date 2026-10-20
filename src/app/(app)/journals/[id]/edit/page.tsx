import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { JournalForm } from "../../new/journal-form";

export const dynamic = "force-dynamic";

export default async function EditJournalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("journal.create");
  const { id } = await params;

  const entry = await prisma.journalEntry.findFirst({
    where: { id, companyId: ctx.company.id },
    include: { lines: { orderBy: { sortOrder: "asc" } } },
  });

  if (!entry) notFound();
  if (entry.status !== "DRAFT") redirect(`/journals/${entry.id}`);

  const accounts = await prisma.account.findMany({
    where: { companyId: ctx.company.id, isGroup: false, isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true, type: true },
  });

  return (
    <JournalForm
      accounts={accounts}
      initial={{
        id: entry.id,
        date: entry.date.toISOString().slice(0, 10),
        description: entry.description ?? "",
        reference: entry.reference ?? "",
        lines: entry.lines.map((l) => ({
          accountId: l.accountId,
          description: l.description ?? "",
          debit: Number(l.debit) > 0 ? l.debit.toString() : "",
          credit: Number(l.credit) > 0 ? l.credit.toString() : "",
        })),
      }}
    />
  );
}
