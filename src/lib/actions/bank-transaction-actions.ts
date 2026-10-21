"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-context";
import { Prisma } from "@/generated/prisma/client";
import { money } from "@/lib/accounting/posting";

const transactionSchema = z.object({
  id: z.string().optional(),
  bankAccountId: z.string().min(1, "Rekening bank wajib dipilih"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  description: z.string().trim().max(500).optional().nullable(),
  debit: z.coerce.number().min(0).default(0),
  credit: z.coerce.number().min(0).default(0),
  refType: z.enum(["SALES_RECEIPT", "PURCHASE_PAYMENT", "JOURNAL", "OTHER"]).optional().default("OTHER"),
  refId: z.string().optional().nullable(),
});

export type BankTransactionResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveBankTransaction(input: unknown): Promise<BankTransactionResult> {
  const ctx = await requirePermission("bank.manage");
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;
  const date = new Date(`${data.date}T00:00:00.000Z`);

  if (data.debit === 0 && data.credit === 0) {
    return { ok: false, error: "Debit atau kredit harus diisi." };
  }
  if (data.debit > 0 && data.credit > 0) {
    return { ok: false, error: "Isi salah satu saja (debit atau kredit)." };
  }

  try {
    const id = await prisma.$transaction(async (tx) => {
      const ba = await tx.bankAccount.findFirst({
        where: { id: data.bankAccountId, companyId: ctx.company.id },
        select: { id: true, accountId: true },
      });
      if (!ba) throw new Error("Rekening bank tidak ditemukan.");

      if (data.id) {
        const existing = await tx.bankTransaction.findFirst({
          where: { id: data.id, bankAccountId: ba.id },
          select: { id: true },
        });
        if (!existing) throw new Error("Transaksi tidak ditemukan.");

        const prev = await tx.bankTransaction.findFirst({
          where: { bankAccountId: ba.id, date: { lt: date } },
          orderBy: { date: "desc" },
          select: { balance: true },
        });
        const prevBalance = prev?.balance ?? new Prisma.Decimal(0);
        const balance = prevBalance.plus(data.debit).minus(data.credit);

        await tx.bankTransaction.update({
          where: { id: existing.id },
          data: {
            date,
            description: data.description ?? null,
            debit: money(data.debit),
            credit: money(data.credit),
            balance,
            refType: data.refType ?? "OTHER",
            refId: data.refId ?? null,
          },
        });

        // recompute subsequent balances
        await recomputeBalances(tx, ba.id, date, balance);

        return existing.id;
      }

      const prev = await tx.bankTransaction.findFirst({
        where: { bankAccountId: ba.id, date: { lt: date } },
        orderBy: { date: "desc" },
        select: { balance: true },
      });
      const prevBalance = prev?.balance ?? new Prisma.Decimal(0);
      const balance = prevBalance.plus(data.debit).minus(data.credit);

      const created = await tx.bankTransaction.create({
        data: {
          bankAccountId: ba.id,
          date,
          description: data.description ?? null,
          debit: money(data.debit),
          credit: money(data.credit),
          balance,
          refType: data.refType ?? "OTHER",
          refId: data.refId ?? null,
        },
      });

      // recompute subsequent balances
      await recomputeBalances(tx, ba.id, date, balance);

      return created.id;
    });

    revalidatePath("/bank/transactions");
    revalidatePath("/bank/accounts");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan transaksi bank." };
  }
}

async function recomputeBalances(
  tx: Prisma.TransactionClient,
  bankAccountId: string,
  fromDate: Date,
  startingBalance: Prisma.Decimal
) {
  const later = await tx.bankTransaction.findMany({
    where: { bankAccountId, date: { gt: fromDate } },
    orderBy: { date: "asc" },
    select: { id: true, debit: true, credit: true },
  });

  let running = startingBalance;
  for (const t of later) {
    running = running.plus(t.debit).minus(t.credit);
    await tx.bankTransaction.update({
      where: { id: t.id },
      data: { balance: running },
    });
  }
}

export async function deleteBankTransaction(id: string): Promise<BankTransactionResult> {
  const ctx = await requirePermission("bank.manage");
  const txn = await prisma.bankTransaction.findFirst({
    where: { id, bankAccount: { companyId: ctx.company.id } },
    select: { id: true, bankAccountId: true, date: true, debit: true, credit: true },
  });
  if (!txn) return { ok: false, error: "Transaksi tidak ditemukan." };

  await prisma.$transaction(async (tx) => {
    await tx.bankTransaction.delete({ where: { id: txn.id } });

    const prev = await tx.bankTransaction.findFirst({
      where: { bankAccountId: txn.bankAccountId, date: { lt: txn.date } },
      orderBy: { date: "desc" },
      select: { balance: true },
    });
    const prevBalance = prev?.balance ?? new Prisma.Decimal(0);

    await recomputeBalances(tx, txn.bankAccountId, txn.date, prevBalance);
  });

  revalidatePath("/bank/transactions");
  revalidatePath("/bank/accounts");
  return { ok: true, id };
}

// ============================================================================
// BANK RECONCILIATION
// ============================================================================

const reconcileSchema = z.object({
  bankAccountId: z.string().min(1),
  statementDate: z.string().min(1),
  statementEndingBalance: z.coerce.number().min(0),
  clearedTransactionIds: z.array(z.string()).default([]),
});

export async function saveReconciliation(input: unknown): Promise<{ ok: true; id: string; difference: string } | { ok: false; error: string }> {
  const ctx = await requirePermission("bank.manage");
  const parsed = reconcileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;
  const statementDate = new Date(`${data.statementDate}T23:59:59.999Z`);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const ba = await tx.bankAccount.findFirst({
        where: { id: data.bankAccountId, companyId: ctx.company.id },
        select: { id: true, accountId: true },
      });
      if (!ba) throw new Error("Rekening bank tidak ditemukan.");

      // Mark transactions as reconciled
      if (data.clearedTransactionIds.length > 0) {
        await tx.bankTransaction.updateMany({
          where: { id: { in: data.clearedTransactionIds }, bankAccountId: ba.id },
          data: { isReconciled: true, reconciledAt: new Date() },
        });
      }

      // Get book balance at statement date
      const bookBalanceAgg = await tx.bankTransaction.aggregate({
        where: { bankAccountId: ba.id, date: { lte: statementDate } },
        _sum: { debit: true, credit: true },
      });
      const bookBalance = (bookBalanceAgg._sum.debit ?? new Prisma.Decimal(0)).minus(
        bookBalanceAgg._sum.credit ?? new Prisma.Decimal(0)
      );

      const statementBalance = new Prisma.Decimal(data.statementEndingBalance);
      const difference = statementBalance.minus(bookBalance);

      return { statementBalance: data.statementEndingBalance, bookBalance: bookBalance.toString(), difference: difference.toString() };
    });

    revalidatePath("/bank/reconcile");
    revalidatePath("/bank/transactions");
    revalidatePath("/bank/accounts");
    return { ok: true, id: "reconciled", difference: result.difference };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal merekonsiliasi." };
  }
}

export async function getReconciliationData(bankAccountId: string, statementDate: string) {
  const ctx = await requirePermission("bank.view");

  const ba = await prisma.bankAccount.findFirst({
    where: { id: bankAccountId, companyId: ctx.company.id },
    select: { id: true, name: true, openingBalance: true, accountId: true },
  });
  if (!ba) throw new Error("Rekening bank tidak ditemukan.");

  const transactions = await prisma.bankTransaction.findMany({
    where: { bankAccountId, date: { lte: new Date(`${statementDate}T23:59:59.999Z`) } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      date: true,
      description: true,
      debit: true,
      credit: true,
      balance: true,
      isReconciled: true,
      reconciledAt: true,
    },
  });

  const bookBalanceAgg = await prisma.bankTransaction.aggregate({
    where: { bankAccountId, date: { lte: new Date(`${statementDate}T23:59:59.999Z`) } },
    _sum: { debit: true, credit: true },
  });
  const bookBalance = (bookBalanceAgg._sum.debit ?? new Prisma.Decimal(0)).minus(
    bookBalanceAgg._sum.credit ?? new Prisma.Decimal(0)
  );

  return {
    bankAccount: {
      id: ba.id,
      name: ba.name,
      openingBalance: ba.openingBalance.toString(),
      accountId: ba.accountId,
    },
    transactions: transactions.map((t) => ({
      id: t.id,
      date: t.date.toISOString().slice(0, 10),
      description: t.description,
      debit: t.debit.toString(),
      credit: t.credit.toString(),
      balance: t.balance.toString(),
      isReconciled: t.isReconciled,
      reconciledAt: t.reconciledAt?.toISOString() ?? null,
    })),
    bookBalance: bookBalance.toString(),
  };
}