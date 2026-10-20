import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { JournalForm } from "./journal-form";

export const dynamic = "force-dynamic";

export default async function NewJournalPage() {
  const ctx = await requirePermission("journal.create");

  const accounts = await prisma.account.findMany({
    where: { companyId: ctx.company.id, isGroup: false, isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true, type: true },
  });

  return <JournalForm accounts={accounts} />;
}
