"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-context";
import {
  journalSchema,
  validateJournal,
  nextJournalNumber,
  findPeriod,
  toDecimal,
  type JournalLineInput,
} from "@/lib/accounting/journal";
import { Prisma } from "@/generated/prisma/client";

export type JournalResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function parseDate(value: string): Date {
  const d = new Date(`${value}T00:00:00.000Z`);
  return d;
}

async function assertAccountsValid(
  tx: Prisma.TransactionClient,
  companyId: string,
  lines: JournalLineInput[]
): Promise<string | null> {
  const ids = Array.from(new Set(lines.map((l) => l.accountId).filter(Boolean)));
  const accounts = await tx.account.findMany({
    where: { id: { in: ids }, companyId },
    select: { id: true, isGroup: true, isActive: true, name: true },
  });
  const map = new Map(accounts.map((a) => [a.id, a]));
  for (const id of ids) {
    const acc = map.get(id);
    if (!acc) return "Ada akun yang tidak valid untuk perusahaan ini.";
    if (acc.isGroup) return `Akun "${acc.name}" adalah akun induk, tidak bisa dijurnal.`;
    if (!acc.isActive) return `Akun "${acc.name}" tidak aktif.`;
  }
  return null;
}

function buildLinesData(lines: JournalLineInput[]) {
  return lines
    .filter((l) => toDecimal(l.debit).gt(0) || toDecimal(l.credit).gt(0))
    .map((l, index) => ({
      accountId: l.accountId,
      description: l.description || null,
      debit: toDecimal(l.debit),
      credit: toDecimal(l.credit),
      partnerType: l.partnerType ?? "NONE",
      partnerId: l.partnerId || null,
      sortOrder: index,
    }));
}

async function persistLines(
  tx: Prisma.TransactionClient,
  entryId: string,
  lines: JournalLineInput[]
) {
  const data = buildLinesData(lines);
  await tx.journalLine.createMany({
    data: data.map((d) => ({ ...d, journalEntryId: entryId })),
  });
  const debit = data.reduce((a, l) => a.plus(l.debit), new Prisma.Decimal(0));
  const credit = data.reduce((a, l) => a.plus(l.credit), new Prisma.Decimal(0));
  return { debit, credit };
}

export async function createJournal(input: unknown): Promise<JournalResult> {
  const ctx = await requirePermission("journal.create");
  const parsed = journalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;

  const balanceError = validateJournal(data.lines);
  if (balanceError) return { ok: false, error: balanceError };

  const date = parseDate(data.date);

  try {
    const id = await prisma.$transaction(async (tx) => {
      const accError = await assertAccountsValid(tx, ctx.company.id, data.lines);
      if (accError) throw new Error(accError);

      const number = await nextJournalNumber(tx, ctx.company.id, date);
      const period = await findPeriod(tx, ctx.company.id, date);
      if (period?.status === "CLOSED") {
        throw new Error(`Periode ${period.name} sudah ditutup.`);
      }

      const entry = await tx.journalEntry.create({
        data: {
          companyId: ctx.company.id,
          number,
          date,
          description: data.description || null,
          reference: data.reference || null,
          status: "DRAFT",
          periodId: period?.id ?? null,
          createdById: ctx.user.id,
        },
      });

      const { debit, credit } = await persistLines(tx, entry.id, data.lines);
      await tx.journalEntry.update({
        where: { id: entry.id },
        data: { totalDebit: debit, totalCredit: credit },
      });

      return entry.id;
    });

    revalidatePath("/journals");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan jurnal." };
  }
}

export async function updateJournal(input: unknown): Promise<JournalResult> {
  const ctx = await requirePermission("journal.create");
  const parsed = journalSchema.safeParse(input);
  if (!parsed.success || !parsed.data.id) {
    return { ok: false, error: "Data tidak valid." };
  }
  const data = parsed.data;

  const balanceError = validateJournal(data.lines);
  if (balanceError) return { ok: false, error: balanceError };

  const existing = await prisma.journalEntry.findFirst({
    where: { id: data.id, companyId: ctx.company.id },
  });
  if (!existing) return { ok: false, error: "Jurnal tidak ditemukan." };
  if (existing.status !== "DRAFT") {
    return { ok: false, error: "Hanya jurnal berstatus DRAFT yang bisa diubah." };
  }

  const date = parseDate(data.date);

  try {
    await prisma.$transaction(async (tx) => {
      const accError = await assertAccountsValid(tx, ctx.company.id, data.lines);
      if (accError) throw new Error(accError);

      const period = await findPeriod(tx, ctx.company.id, date);
      if (period?.status === "CLOSED") {
        throw new Error(`Periode ${period.name} sudah ditutup.`);
      }

      await tx.journalLine.deleteMany({ where: { journalEntryId: existing.id } });
      const { debit, credit } = await persistLines(tx, existing.id, data.lines);
      await tx.journalEntry.update({
        where: { id: existing.id },
        data: {
          date,
          description: data.description || null,
          reference: data.reference || null,
          periodId: period?.id ?? null,
          totalDebit: debit,
          totalCredit: credit,
        },
      });
    });

    revalidatePath("/journals");
    revalidatePath(`/journals/${existing.id}`);
    return { ok: true, id: existing.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal mengubah jurnal." };
  }
}

export async function postJournal(id: string): Promise<JournalResult> {
  const ctx = await requirePermission("journal.post");
  const entry = await prisma.journalEntry.findFirst({
    where: { id, companyId: ctx.company.id },
    include: { lines: true, period: true },
  });
  if (!entry) return { ok: false, error: "Jurnal tidak ditemukan." };
  if (entry.status !== "DRAFT") {
    return { ok: false, error: "Hanya jurnal DRAFT yang bisa diposting." };
  }
  if (entry.period?.status === "CLOSED") {
    return { ok: false, error: `Periode ${entry.period.name} sudah ditutup.` };
  }
  if (!entry.totalDebit.equals(entry.totalCredit) || entry.totalDebit.lte(0)) {
    return { ok: false, error: "Jurnal tidak balance." };
  }

  await prisma.journalEntry.update({
    where: { id: entry.id },
    data: { status: "POSTED", postedAt: new Date() },
  });

  revalidatePath("/journals");
  revalidatePath(`/journals/${id}`);
  revalidatePath("/ledger");
  return { ok: true, id };
}

export async function voidJournal(id: string): Promise<JournalResult> {
  const ctx = await requirePermission("journal.void");
  const entry = await prisma.journalEntry.findFirst({
    where: { id, companyId: ctx.company.id },
  });
  if (!entry) return { ok: false, error: "Jurnal tidak ditemukan." };
  if (entry.status === "VOID") {
    return { ok: false, error: "Jurnal sudah dibatalkan." };
  }

  await prisma.journalEntry.update({
    where: { id: entry.id },
    data: { status: "VOID" },
  });

  revalidatePath("/journals");
  revalidatePath(`/journals/${id}`);
  revalidatePath("/ledger");
  return { ok: true, id };
}

export async function deleteJournal(id: string): Promise<JournalResult> {
  const ctx = await requirePermission("journal.create");
  const entry = await prisma.journalEntry.findFirst({
    where: { id, companyId: ctx.company.id },
  });
  if (!entry) return { ok: false, error: "Jurnal tidak ditemukan." };
  if (entry.status !== "DRAFT") {
    return { ok: false, error: "Hanya jurnal DRAFT yang bisa dihapus." };
  }

  await prisma.journalEntry.delete({ where: { id: entry.id } });
  revalidatePath("/journals");
  return { ok: true, id };
}
