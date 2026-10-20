"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-context";
import { Prisma } from "@/generated/prisma/client";

const optionalText = z
  .string()
  .trim()
  .max(255)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

const partnerSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(["customer", "supplier"]),
  code: z.string().trim().min(1, "Kode wajib diisi").max(30),
  name: z.string().trim().min(1, "Nama wajib diisi").max(150),
  npwp: optionalText,
  email: optionalText,
  phone: optionalText,
  address: optionalText,
  city: optionalText,
  contactPerson: optionalText,
  creditLimit: z.coerce.number().min(0).optional().default(0),
  paymentTermDays: z.coerce.number().int().min(0).max(3650).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export type PartnerResult = { ok: true; id: string } | { ok: false; error: string };

function isUniqueError(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function savePartner(input: unknown): Promise<PartnerResult> {
  const parsed = partnerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;

  const ctx = await requirePermission(
    data.kind === "customer" ? "customer.manage" : "supplier.manage"
  );

  const base = {
    code: data.code,
    name: data.name,
    npwp: data.npwp,
    email: data.email,
    phone: data.phone,
    address: data.address,
    city: data.city,
    contactPerson: data.contactPerson,
    paymentTermDays: data.paymentTermDays ?? 0,
    isActive: data.isActive ?? true,
  };

  try {
    if (data.kind === "customer") {
      if (data.id) {
        const existing = await prisma.customer.findFirst({
          where: { id: data.id, companyId: ctx.company.id },
          select: { id: true },
        });
        if (!existing) return { ok: false, error: "Pelanggan tidak ditemukan." };
        await prisma.customer.update({
          where: { id: existing.id },
          data: { ...base, creditLimit: data.creditLimit ?? 0 },
        });
        revalidatePath("/customers");
        return { ok: true, id: existing.id };
      }
      const created = await prisma.customer.create({
        data: { ...base, creditLimit: data.creditLimit ?? 0, companyId: ctx.company.id },
      });
      revalidatePath("/customers");
      return { ok: true, id: created.id };
    }

    if (data.id) {
      const existing = await prisma.supplier.findFirst({
        where: { id: data.id, companyId: ctx.company.id },
        select: { id: true },
      });
      if (!existing) return { ok: false, error: "Supplier tidak ditemukan." };
      await prisma.supplier.update({ where: { id: existing.id }, data: base });
      revalidatePath("/suppliers");
      return { ok: true, id: existing.id };
    }
    const created = await prisma.supplier.create({
      data: { ...base, companyId: ctx.company.id },
    });
    revalidatePath("/suppliers");
    return { ok: true, id: created.id };
  } catch (e) {
    if (isUniqueError(e)) {
      const label = data.kind === "customer" ? "Pelanggan" : "Supplier";
      return { ok: false, error: `${label} dengan kode "${data.code}" sudah ada.` };
    }
    throw e;
  }
}

export async function togglePartnerActive(
  kind: "customer" | "supplier",
  id: string,
  isActive: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await requirePermission(
    kind === "customer" ? "customer.manage" : "supplier.manage"
  );

  if (kind === "customer") {
    const res = await prisma.customer.updateMany({
      where: { id, companyId: ctx.company.id },
      data: { isActive },
    });
    if (res.count === 0) return { ok: false, error: "Pelanggan tidak ditemukan." };
    revalidatePath("/customers");
  } else {
    const res = await prisma.supplier.updateMany({
      where: { id, companyId: ctx.company.id },
      data: { isActive },
    });
    if (res.count === 0) return { ok: false, error: "Supplier tidak ditemukan." };
    revalidatePath("/suppliers");
  }
  return { ok: true };
}

export async function deletePartner(
  kind: "customer" | "supplier",
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await requirePermission(
    kind === "customer" ? "customer.manage" : "supplier.manage"
  );

  if (kind === "customer") {
    const partner = await prisma.customer.findFirst({
      where: { id, companyId: ctx.company.id },
      include: { _count: { select: { salesInvoices: true, salesReceipts: true } } },
    });
    if (!partner) return { ok: false, error: "Pelanggan tidak ditemukan." };
    if (partner._count.salesInvoices + partner._count.salesReceipts > 0) {
      return { ok: false, error: "Pelanggan sudah dipakai transaksi, tidak bisa dihapus." };
    }
    await prisma.customer.delete({ where: { id } });
    revalidatePath("/customers");
    return { ok: true };
  }

  const partner = await prisma.supplier.findFirst({
    where: { id, companyId: ctx.company.id },
    include: { _count: { select: { purchaseInvoices: true, purchasePayments: true } } },
  });
  if (!partner) return { ok: false, error: "Supplier tidak ditemukan." };
  if (partner._count.purchaseInvoices + partner._count.purchasePayments > 0) {
    return { ok: false, error: "Supplier sudah dipakai transaksi, tidak bisa dihapus." };
  }
  await prisma.supplier.delete({ where: { id } });
  revalidatePath("/suppliers");
  return { ok: true };
}
