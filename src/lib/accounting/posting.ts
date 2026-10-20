import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { nextJournalNumber, findPeriod } from "@/lib/accounting/journal";

/** Akun standar yang dipakai untuk posting otomatis dokumen. */
export const POSTING_CODES = {
  AR: "1-2100",
  AP: "2-1100",
  SALES: "4-1000",
  SALES_DISCOUNT: "4-1100",
  PPN_OUT: "2-1210",
  PPN_IN: "1-4900",
  INVENTORY: "1-3000",
  COGS: "5-1000",
  CASH: "1-1100",
  BANK: "1-1200",
} as const;

export type PostingLine = {
  accountId: string;
  description?: string | null;
  debit?: number | Prisma.Decimal;
  credit?: number | Prisma.Decimal;
  partnerType?: "CUSTOMER" | "SUPPLIER" | "NONE";
  partnerId?: string | null;
};

function dec(v: number | Prisma.Decimal | undefined): Prisma.Decimal {
  if (v === undefined) return new Prisma.Decimal(0);
  return v instanceof Prisma.Decimal ? v : new Prisma.Decimal(v);
}

export function money(v: number | Prisma.Decimal | undefined): Prisma.Decimal {
  if (v === undefined) return new Prisma.Decimal(0);
  return v instanceof Prisma.Decimal ? v : new Prisma.Decimal(v);
}

export function parseDay(value: string): Date {
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error("Tanggal tidak valid.");
  return d;
}

export function endOfDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59)
  );
}

export async function resolveAccountsByCode(
  tx: Prisma.TransactionClient,
  companyId: string,
  codes: string[]
): Promise<Map<string, string>> {
  const rows = await tx.account.findMany({
    where: { companyId, code: { in: codes } },
    select: { id: true, code: true },
  });
  return new Map(rows.map((r) => [r.code, r.id]));
}

export async function requireAccountId(
  tx: Prisma.TransactionClient,
  companyId: string,
  code: string
): Promise<string> {
  const acc = await tx.account.findFirst({
    where: { companyId, code },
    select: { id: true, name: true, isGroup: true },
  });
  if (!acc) throw new Error(`Akun standar dengan kode ${code} tidak ditemukan.`);
  if (acc.isGroup) throw new Error(`Akun ${code} (${acc.name}) adalah akun induk.`);
  return acc.id;
}

/** Akun kas/bank berdasarkan metode pembayaran. */
export async function resolveCashAccountId(
  tx: Prisma.TransactionClient,
  companyId: string,
  method: "CASH" | "BANK" | "TRANSFER" | "CREDIT_CARD" | "OTHER",
  bankAccountId?: string | null
): Promise<string> {
  if (bankAccountId) {
    const bank = await tx.bankAccount.findFirst({
      where: { id: bankAccountId, companyId },
      select: { accountId: true },
    });
    if (bank?.accountId) return bank.accountId;
  }
  return requireAccountId(
    tx,
    companyId,
    method === "CASH" ? POSTING_CODES.CASH : POSTING_CODES.BANK
  );
}

/**
 * Buat jurnal POSTED dari sebuah dokumen. Melempar Error bila tidak valid.
 */
export async function postEntry(
  tx: Prisma.TransactionClient,
  opts: {
    companyId: string;
    userId: string;
    date: Date;
    description?: string | null;
    reference?: string | null;
    sourceType: string;
    sourceId: string;
    lines: PostingLine[];
  }
): Promise<string> {
  const lines = opts.lines
    .map((l) => ({
      accountId: l.accountId,
      description: l.description ?? null,
      debit: dec(l.debit),
      credit: dec(l.credit),
      partnerType: l.partnerType ?? "NONE",
      partnerId: l.partnerId ?? null,
    }))
    .filter((l) => l.debit.gt(0) || l.credit.gt(0));

  if (lines.length < 2) throw new Error("Jurnal otomatis minimal 2 baris.");

  for (const [i, l] of lines.entries()) {
    if (l.debit.gt(0) && l.credit.gt(0)) {
      throw new Error(`Baris ${i + 1}: debit dan kredit tidak boleh terisi keduanya.`);
    }
  }

  const totalDebit = lines.reduce((a, l) => a.plus(l.debit), new Prisma.Decimal(0));
  const totalCredit = lines.reduce((a, l) => a.plus(l.credit), new Prisma.Decimal(0));
  if (!totalDebit.equals(totalCredit)) {
    throw new Error(
      `Jurnal tidak balance: debit ${totalDebit.toString()} vs kredit ${totalCredit.toString()}.`
    );
  }
  if (totalDebit.lte(0)) throw new Error("Total jurnal harus lebih dari nol.");

  const period = await findPeriod(tx, opts.companyId, opts.date);
  if (period?.status === "CLOSED") {
    throw new Error(`Periode ${period.name} sudah ditutup.`);
  }

  const number = await nextJournalNumber(tx, opts.companyId, opts.date);

  const entry = await tx.journalEntry.create({
    data: {
      companyId: opts.companyId,
      number,
      date: opts.date,
      description: opts.description ?? null,
      reference: opts.reference ?? null,
      status: "POSTED",
      postedAt: new Date(),
      periodId: period?.id ?? null,
      createdById: opts.userId,
      sourceType: opts.sourceType,
      sourceId: opts.sourceId,
      totalDebit,
      totalCredit,
      lines: {
        create: lines.map((l, index) => ({ ...l, sortOrder: index })),
      },
    },
  });

  return entry.id;
}

export async function voidEntry(
  tx: Prisma.TransactionClient,
  companyId: string,
  journalEntryId: string | null
) {
  if (!journalEntryId) return;
  await tx.journalEntry.updateMany({
    where: { id: journalEntryId, companyId },
    data: { status: "VOID" },
  });
}

export async function deleteEntry(
  tx: Prisma.TransactionClient,
  companyId: string,
  journalEntryId: string | null
) {
  if (!journalEntryId) return;
  await tx.journalEntry.deleteMany({ where: { id: journalEntryId, companyId } });
}

async function nextNumber(
  tx: Prisma.TransactionClient,
  table: { findFirst: unknown },
  companyId: string,
  prefix: string
): Promise<string> {
  const delegate = table as unknown as {
    findFirst: (args: unknown) => Promise<{ number: string } | null>;
  };
  const last = await delegate.findFirst({
    where: { companyId, number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const seq = last ? Number.parseInt(last.number.slice(prefix.length), 10) + 1 : 1;
  return prefix + String(seq).padStart(4, "0");
}

export function yearPrefix(prefix: string, date: Date): string {
  return `${prefix}-${date.getUTCFullYear()}-`;
}

export const nextSalesInvoiceNumber = (tx: Prisma.TransactionClient, companyId: string, date: Date) =>
  nextNumber(tx, tx.salesInvoice, companyId, yearPrefix("SI", date));

export const nextSalesReceiptNumber = (tx: Prisma.TransactionClient, companyId: string, date: Date) =>
  nextNumber(tx, tx.salesReceipt, companyId, yearPrefix("RC", date));

export const nextPurchaseInvoiceNumber = (tx: Prisma.TransactionClient, companyId: string, date: Date) =>
  nextNumber(tx, tx.purchaseInvoice, companyId, yearPrefix("PI", date));

export const nextPurchasePaymentNumber = (tx: Prisma.TransactionClient, companyId: string, date: Date) =>
  nextNumber(tx, tx.purchasePayment, companyId, yearPrefix("PY", date));

export function decOrZero(v: unknown): Prisma.Decimal {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : 0;
  return new Prisma.Decimal(Number.isFinite(n) ? n : 0);
}
