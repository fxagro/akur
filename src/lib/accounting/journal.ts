import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";

export const journalLineSchema = z.object({
  accountId: z.string().min(1, "Akun wajib dipilih"),
  description: z.string().max(500).optional().nullable(),
  debit: z.coerce.number().min(0).default(0),
  credit: z.coerce.number().min(0).default(0),
  partnerType: z.enum(["CUSTOMER", "SUPPLIER", "NONE"]).optional().default("NONE"),
  partnerId: z.string().optional().nullable(),
});

export const journalSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(1, "Tanggal wajib diisi"),
  description: z.string().max(500).optional().nullable(),
  reference: z.string().max(255).optional().nullable(),
  lines: z.array(journalLineSchema).min(2, "Minimal 2 baris jurnal"),
});

export type JournalLineInput = z.infer<typeof journalLineSchema>;
export type JournalInput = z.infer<typeof journalSchema>;

export function toDecimal(value: number | string): Prisma.Decimal {
  const n = typeof value === "string" ? Number(value) : value;
  return new Prisma.Decimal(Number.isFinite(n) ? n : 0);
}

export function sumDebit(lines: JournalLineInput[]): Prisma.Decimal {
  return lines.reduce((acc, l) => acc.plus(toDecimal(l.debit)), new Prisma.Decimal(0));
}

export function sumCredit(lines: JournalLineInput[]): Prisma.Decimal {
  return lines.reduce((acc, l) => acc.plus(toDecimal(l.credit)), new Prisma.Decimal(0));
}

/**
 * Validasi bisnis jurnal. Mengembalikan pesan error, atau null bila valid.
 */
export function validateJournal(lines: JournalLineInput[]): string | null {
  const active = lines.filter(
    (l) => toDecimal(l.debit).gt(0) || toDecimal(l.credit).gt(0)
  );

  if (active.length < 2) {
    return "Jurnal harus memiliki minimal 2 baris bernilai.";
  }

  for (const [i, l] of lines.entries()) {
    const d = toDecimal(l.debit);
    const c = toDecimal(l.credit);
    if (d.lt(0) || c.lt(0)) {
      return `Baris ${i + 1}: nilai debit/kredit tidak boleh negatif.`;
    }
    if (d.gt(0) && c.gt(0)) {
      return `Baris ${i + 1}: isi salah satu saja (debit atau kredit).`;
    }
  }

  const debit = sumDebit(lines);
  const credit = sumCredit(lines);
  if (!debit.equals(credit)) {
    return `Jurnal tidak balance: total debit ${debit.toString()} vs kredit ${credit.toString()}.`;
  }
  if (debit.lte(0)) {
    return "Total jurnal harus lebih dari nol.";
  }

  return null;
}

/** Nomor jurnal berikutnya, format JV-YYYY-0001 */
export async function nextJournalNumber(
  tx: Prisma.TransactionClient,
  companyId: string,
  date: Date
): Promise<string> {
  const prefix = `JV-${date.getUTCFullYear()}-`;
  const last = await tx.journalEntry.findFirst({
    where: { companyId, number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const seq = last ? Number.parseInt(last.number.slice(prefix.length), 10) + 1 : 1;
  return prefix + String(seq).padStart(4, "0");
}

/** Cari periode akuntansi untuk tanggal tertentu (opsional). */
export async function findPeriod(
  tx: Prisma.TransactionClient,
  companyId: string,
  date: Date
) {
  return tx.accountingPeriod.findFirst({
    where: { companyId, startDate: { lte: date }, endDate: { gte: date } },
    orderBy: { startDate: "desc" },
  });
}
