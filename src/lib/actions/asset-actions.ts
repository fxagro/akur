"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-context";
import { Prisma } from "@/generated/prisma/client";

const assetSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(1, "Kode wajib diisi").max(30),
  name: z.string().trim().min(1, "Nama wajib diisi").max(150),
  category: z.string().trim().max(100).optional().nullable(),
  status: z.enum(["ACTIVE", "DISPOSED"]).default("ACTIVE"),
  acquisitionDate: z.string().min(1, "Tanggal perolehan wajib diisi"),
  acquisitionCost: z.coerce.number().min(0, "Harga perolehan harus >= 0"),
  usefulLifeMonths: z.coerce.number().int().min(1, "Masa manfaat minimal 1 bulan"),
  salvageValue: z.coerce.number().min(0).default(0),
  method: z.enum(["STRAIGHT_LINE", "DECLINING_BALANCE"]).default("STRAIGHT_LINE"),
  assetAccountId: z.string().optional().nullable(),
  accumDepAccountId: z.string().optional().nullable(),
  depExpenseAccountId: z.string().optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export type AssetResult = { ok: true; id: string } | { ok: false; error: string };

function isUniqueError(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function saveFixedAsset(input: unknown): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const ctx = await requirePermission("asset.manage");
  const parsed = assetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;

  const acquisitionDate = new Date(`${data.acquisitionDate}T00:00:00.000Z`);

  try {
    if (data.id) {
      const existing = await prisma.fixedAsset.findFirst({
        where: { id: data.id, companyId: ctx.company.id },
        select: { id: true, accumulatedDepreciation: true },
      });
      if (!existing) return { ok: false, error: "Aset tidak ditemukan." };

      await prisma.fixedAsset.update({
        where: { id: existing.id },
        data: {
          code: data.code,
          name: data.name,
          category: data.category,
          status: data.status,
          acquisitionDate,
          acquisitionCost: data.acquisitionCost,
          usefulLifeMonths: data.usefulLifeMonths,
          salvageValue: data.salvageValue,
          method: data.method,
          assetAccountId: data.assetAccountId,
          accumDepAccountId: data.accumDepAccountId,
          depExpenseAccountId: data.depExpenseAccountId,
          note: data.note,
        },
      });
      revalidatePath("/assets");
      return { ok: true, id: existing.id };
    }

    const created = await prisma.fixedAsset.create({
      data: {
        companyId: ctx.company.id,
        code: data.code,
        name: data.name,
        category: data.category,
        status: data.status,
        acquisitionDate,
        acquisitionCost: data.acquisitionCost,
        usefulLifeMonths: data.usefulLifeMonths,
        salvageValue: data.salvageValue,
        method: data.method,
        assetAccountId: data.assetAccountId,
        accumDepAccountId: data.accumDepAccountId,
        depExpenseAccountId: data.depExpenseAccountId,
        note: data.note,
        bookValue: data.acquisitionCost - data.salvageValue,
      },
    });
    revalidatePath("/assets");
    return { ok: true, id: created.id };
  } catch (e) {
    if (isUniqueError(e)) {
      return { ok: false, error: `Aset dengan kode "${data.code}" sudah ada.` };
    }
    throw e;
  }
}

export async function toggleAssetActive(
  id: string,
  isActive: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await requirePermission("asset.manage");
  const res = await prisma.fixedAsset.updateMany({
    where: { id, companyId: ctx.company.id },
    data: { isActive },
  });
  if (res.count === 0) return { ok: false, error: "Aset tidak ditemukan." };
  revalidatePath("/assets");
  return { ok: true };
}

export async function disposeAsset(
  id: string,
  disposedAt: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await requirePermission("asset.manage");
  const date = new Date(`${disposedAt}T00:00:00.000Z`);

  const asset = await prisma.fixedAsset.findFirst({
    where: { id, companyId: ctx.company.id },
  });
  if (!asset) return { ok: false, error: "Aset tidak ditemukan." };
  if (asset.status === "DISPOSED") return { ok: false, error: "Aset sudah dibuang." };

  await prisma.fixedAsset.update({
    where: { id: asset.id },
    data: { status: "DISPOSED", disposedAt: date },
  });
  revalidatePath("/assets");
  return { ok: true };
}

export async function deleteAsset(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await requirePermission("asset.manage");
  const asset = await prisma.fixedAsset.findFirst({
    where: { id, companyId: ctx.company.id },
    include: { _count: { select: { depreciations: true } } },
  });
  if (!asset) return { ok: false, error: "Aset tidak ditemukan." };
  if (asset._count.depreciations > 0) {
    return { ok: false, error: "Aset sudah punya catatan penyusutan, tidak bisa dihapus." };
  }
  await prisma.fixedAsset.delete({ where: { id: asset.id } });
  revalidatePath("/assets");
  return { ok: true };
}