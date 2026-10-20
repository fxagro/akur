"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-context";
import { Prisma } from "@/generated/prisma/client";

const accountSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(1, "Kode wajib diisi").max(20),
  name: z.string().trim().min(1, "Nama wajib diisi").max(150),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
  normalBalance: z.enum(["DEBIT", "CREDIT"]).optional(),
  parentId: z.string().optional().nullable(),
  isGroup: z.boolean().optional().default(false),
  description: z.string().max(500).optional().nullable(),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

const DEFAULT_NORMAL: Record<string, "DEBIT" | "CREDIT"> = {
  ASSET: "DEBIT",
  EXPENSE: "DEBIT",
  LIABILITY: "CREDIT",
  EQUITY: "CREDIT",
  REVENUE: "CREDIT",
};

function isUniqueError(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
  );
}

export async function createAccount(input: unknown): Promise<ActionResult> {
  const ctx = await requirePermission("account.manage");
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;

  let level = 1;
  if (data.parentId) {
    const parent = await prisma.account.findFirst({
      where: { id: data.parentId, companyId: ctx.company.id },
      select: { level: true },
    });
    if (!parent) return { ok: false, error: "Akun induk tidak ditemukan." };
    level = parent.level + 1;
  }

  try {
    await prisma.account.create({
      data: {
        companyId: ctx.company.id,
        code: data.code,
        name: data.name,
        type: data.type,
        normalBalance: data.normalBalance ?? DEFAULT_NORMAL[data.type],
        parentId: data.parentId || null,
        isGroup: data.isGroup ?? false,
        level,
        description: data.description || null,
      },
    });
  } catch (e) {
    if (isUniqueError(e)) {
      return { ok: false, error: `Kode akun "${data.code}" sudah dipakai.` };
    }
    throw e;
  }

  revalidatePath("/accounts");
  return { ok: true };
}

export async function updateAccount(input: unknown): Promise<ActionResult> {
  const ctx = await requirePermission("account.manage");
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success || !parsed.data.id) {
    return { ok: false, error: "Data tidak valid." };
  }
  const data = parsed.data;

  const existing = await prisma.account.findFirst({
    where: { id: data.id, companyId: ctx.company.id },
  });
  if (!existing) return { ok: false, error: "Akun tidak ditemukan." };
  if (data.parentId === data.id) {
    return { ok: false, error: "Akun tidak boleh menjadi induk dirinya sendiri." };
  }

  let level = 1;
  if (data.parentId) {
    const parent = await prisma.account.findFirst({
      where: { id: data.parentId, companyId: ctx.company.id },
      select: { level: true },
    });
    if (!parent) return { ok: false, error: "Akun induk tidak ditemukan." };
    level = parent.level + 1;
  }

  try {
    await prisma.account.update({
      where: { id: existing.id },
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        normalBalance: data.normalBalance ?? DEFAULT_NORMAL[data.type],
        parentId: data.parentId || null,
        isGroup: data.isGroup ?? false,
        level,
        description: data.description || null,
      },
    });
  } catch (e) {
    if (isUniqueError(e)) {
      return { ok: false, error: `Kode akun "${data.code}" sudah dipakai.` };
    }
    throw e;
  }

  revalidatePath("/accounts");
  return { ok: true };
}

export async function toggleAccountActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const ctx = await requirePermission("account.manage");
  const existing = await prisma.account.findFirst({
    where: { id, companyId: ctx.company.id },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Akun tidak ditemukan." };

  await prisma.account.update({ where: { id }, data: { isActive } });
  revalidatePath("/accounts");
  return { ok: true };
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  const ctx = await requirePermission("account.manage");
  const account = await prisma.account.findFirst({
    where: { id, companyId: ctx.company.id },
    include: {
      _count: { select: { children: true, journalLines: true } },
    },
  });
  if (!account) return { ok: false, error: "Akun tidak ditemukan." };
  if (account._count.children > 0) {
    return { ok: false, error: "Akun masih punya sub-akun, hapus sub-akun dulu." };
  }
  if (account._count.journalLines > 0) {
    return { ok: false, error: "Akun sudah dipakai di jurnal, tidak bisa dihapus." };
  }

  await prisma.account.delete({ where: { id } });
  revalidatePath("/accounts");
  return { ok: true };
}
