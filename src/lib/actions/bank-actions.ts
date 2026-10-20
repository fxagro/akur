"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-context";
import { Prisma } from "@/generated/prisma/client";

const bankAccountSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Nama rekening wajib diisi").max(100),
  bankName: z.string().trim().max(100).optional().nullable(),
  accountNumber: z.string().trim().max(50).optional().nullable(),
  accountId: z.string().min(1, "Akun buku besar wajib dipilih"),
  currency: z.string().trim().min(3).max(3).default("IDR"),
  openingBalance: z.coerce.number().min(0).default(0),
  isActive: z.boolean().optional().default(true),
});

export type BankAccountResult = { ok: true; id: string } | { ok: false; error: string };

function isUniqueError(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function saveBankAccount(input: unknown): Promise<BankAccountResult> {
  const ctx = await requirePermission("bank.manage");
  const parsed = bankAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;

  try {
    if (data.id) {
      const existing = await prisma.bankAccount.findFirst({
        where: { id: data.id, companyId: ctx.company.id },
        select: { id: true },
      });
      if (!existing) return { ok: false, error: "Rekening tidak ditemukan." };

      await prisma.bankAccount.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          accountId: data.accountId,
          currency: data.currency,
          openingBalance: data.openingBalance,
          isActive: data.isActive,
        },
      });
      revalidatePath("/bank/accounts");
      return { ok: true, id: existing.id };
    }

    const created = await prisma.bankAccount.create({
      data: {
        companyId: ctx.company.id,
        name: data.name,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountId: data.accountId,
        currency: data.currency,
        openingBalance: data.openingBalance,
        isActive: data.isActive,
      },
    });
    revalidatePath("/bank/accounts");
    return { ok: true, id: created.id };
  } catch (e) {
    if (isUniqueError(e)) {
      return { ok: false, error: `Rekening dengan nama "${data.name}" sudah ada.` };
    }
    throw e;
  }
}

export async function toggleBankAccountActive(
  id: string,
  isActive: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await requirePermission("bank.manage");
  const res = await prisma.bankAccount.updateMany({
    where: { id, companyId: ctx.company.id },
    data: { isActive },
  });
  if (res.count === 0) return { ok: false, error: "Rekening tidak ditemukan." };
  revalidatePath("/bank/accounts");
  return { ok: true };
}

export async function deleteBankAccount(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await requirePermission("bank.manage");
  const ba = await prisma.bankAccount.findFirst({
    where: { id, companyId: ctx.company.id },
    include: { _count: { select: { transactions: true, salesReceipts: true, purchasePayments: true } } },
  });
  if (!ba) return { ok: false, error: "Rekening tidak ditemukan." };
  if (ba._count.transactions + ba._count.salesReceipts + ba._count.purchasePayments > 0) {
    return { ok: false, error: "Rekening sudah dipakai transaksi, tidak bisa dihapus." };
  }
  await prisma.bankAccount.delete({ where: { id } });
  revalidatePath("/bank/accounts");
  return { ok: true };
}