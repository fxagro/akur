"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-context";
import { Prisma } from "@/generated/prisma/client";
import {
  POSTING_CODES,
  postEntry,
  voidEntry,
  resolveAccountsByCode,
  resolveCashAccountId,
  requireAccountId,
  nextPurchaseInvoiceNumber,
  nextPurchasePaymentNumber,
  parseDay,
  decOrZero,
} from "@/lib/accounting/posting";

export type PurchaseResult = { ok: true; id: string } | { ok: false; error: string };

const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

const lineSchema = z.object({
  itemId: z.string().optional().nullable(),
  description: z.string().trim().min(1, "Keterangan baris wajib diisi").max(300),
  accountId: z.string().optional().nullable(),
  qty: z.coerce.number().min(0).default(1),
  unitPrice: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  taxCodeId: z.string().optional().nullable(),
});

const invoiceSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string().min(1, "Supplier wajib dipilih"),
  supplierNumber: optionalText,
  date: z.string().min(1, "Tanggal wajib diisi"),
  dueDate: z.string().optional().nullable(),
  reference: optionalText,
  note: optionalText,
  lines: z.array(lineSchema).min(1, "Minimal 1 baris"),
});

const paymentSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string().min(1, "Supplier wajib dipilih"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  method: z.enum(["CASH", "BANK", "TRANSFER", "CREDIT_CARD", "OTHER"]).default("TRANSFER"),
  bankAccountId: z.string().optional().nullable(),
  note: optionalText,
  allocations: z
    .array(z.object({ invoiceId: z.string().min(1), amount: z.coerce.number().min(0) }))
    .min(1, "Minimal 1 alokasi faktur"),
});

function money(v: unknown): Prisma.Decimal {
  return decOrZero(v).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

type ComputedLine = {
  itemId: string | null;
  description: string;
  accountId: string | null;
  qty: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  discount: Prisma.Decimal;
  taxCodeId: string | null;
  taxAmount: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
};

async function computeLines(
  tx: Prisma.TransactionClient,
  companyId: string,
  lines: z.infer<typeof lineSchema>[]
): Promise<{
  lines: ComputedLine[];
  subtotal: Prisma.Decimal;
  discount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  total: Prisma.Decimal;
  taxByAccount: Map<string, Prisma.Decimal>;
}> {
  const taxIds = Array.from(
    new Set(lines.map((l) => l.taxCodeId).filter((v): v is string => !!v))
  );
  const taxCodes = taxIds.length
    ? await tx.taxCode.findMany({
        where: { id: { in: taxIds }, companyId },
        select: { id: true, rate: true, accountId: true },
      })
    : [];
  const taxMap = new Map(taxCodes.map((t) => [t.id, t]));

  const computed: ComputedLine[] = [];
  let subtotal = new Prisma.Decimal(0);
  let discountTotal = new Prisma.Decimal(0);
  let taxTotal = new Prisma.Decimal(0);
  const taxByAccount = new Map<string, Prisma.Decimal>();

  for (const l of lines) {
    const qty = decOrZero(l.qty);
    const price = decOrZero(l.unitPrice);
    const gross = money(qty.times(price));
    const discount = money(l.discount);
    if (discount.gt(gross)) {
      throw new Error(`Diskon baris "${l.description}" melebihi nilai bruto.`);
    }
    const net = gross.minus(discount);
    let taxAmount = new Prisma.Decimal(0);
    let taxAccountId: string | null = null;
    if (l.taxCodeId) {
      const tc = taxMap.get(l.taxCodeId);
      if (!tc) throw new Error("Kode pajak tidak valid.");
      taxAmount = money(net.times(tc.rate));
      taxAccountId = tc.accountId ?? null;
    }
    subtotal = subtotal.plus(net);
    discountTotal = discountTotal.plus(discount);
    taxTotal = taxTotal.plus(taxAmount);
    if (taxAmount.gt(0) && taxAccountId) {
      taxByAccount.set(
        taxAccountId,
        (taxByAccount.get(taxAccountId) ?? new Prisma.Decimal(0)).plus(taxAmount)
      );
    }
    computed.push({
      itemId: l.itemId || null,
      description: l.description,
      accountId: l.accountId || null,
      qty,
      unitPrice: price,
      discount,
      taxCodeId: l.taxCodeId || null,
      taxAmount,
      lineTotal: net,
    });
  }

  return {
    lines: computed,
    subtotal,
    discount: discountTotal,
    taxAmount: taxTotal,
    total: subtotal.plus(taxTotal),
    taxByAccount,
  };
}

function lineData(c: ComputedLine, i: number) {
  return {
    itemId: c.itemId,
    description: c.description,
    accountId: c.accountId,
    qty: c.qty,
    unitPrice: c.unitPrice,
    discount: c.discount,
    taxCodeId: c.taxCodeId,
    taxAmount: c.taxAmount,
    lineTotal: c.lineTotal,
    sortOrder: i,
  };
}

// ============================================================================
// FAKTUR PEMBELIAN
// ============================================================================

export async function savePurchaseInvoice(input: unknown): Promise<PurchaseResult> {
  const ctx = await requirePermission("purchase.manage");
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;
  const date = parseDay(data.date);
  const dueDate = data.dueDate ? parseDay(data.dueDate) : null;

  try {
    const id = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findFirst({
        where: { id: data.supplierId, companyId: ctx.company.id, isActive: true },
        select: { id: true },
      });
      if (!supplier) throw new Error("Supplier tidak ditemukan atau tidak aktif.");

      const c = await computeLines(tx, ctx.company.id, data.lines);
      if (c.total.lte(0)) throw new Error("Total faktur harus lebih dari nol.");

      if (data.id) {
        const existing = await tx.purchaseInvoice.findFirst({
          where: { id: data.id, companyId: ctx.company.id },
          select: { id: true, status: true },
        });
        if (!existing) throw new Error("Faktur tidak ditemukan.");
        if (existing.status !== "DRAFT") {
          throw new Error("Hanya faktur DRAFT yang bisa diubah.");
        }
        await tx.purchaseInvoiceLine.deleteMany({ where: { invoiceId: existing.id } });
        await tx.purchaseInvoice.update({
          where: { id: existing.id },
          data: {
            date,
            dueDate,
            supplierId: supplier.id,
            supplierNumber: data.supplierNumber,
            reference: data.reference,
            note: data.note,
            subtotal: c.subtotal,
            discount: c.discount,
            taxAmount: c.taxAmount,
            total: c.total,
            lines: { create: c.lines.map(lineData) },
          },
        });
        return existing.id;
      }

      const number = await nextPurchaseInvoiceNumber(tx, ctx.company.id, date);
      const created = await tx.purchaseInvoice.create({
        data: {
          companyId: ctx.company.id,
          number,
          date,
          dueDate,
          supplierId: supplier.id,
          supplierNumber: data.supplierNumber,
          reference: data.reference,
          note: data.note,
          status: "DRAFT",
          subtotal: c.subtotal,
          discount: c.discount,
          taxAmount: c.taxAmount,
          total: c.total,
          lines: { create: c.lines.map(lineData) },
        },
      });
      return created.id;
    });

    revalidatePath("/purchases");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan faktur." };
  }
}

export async function postPurchaseInvoice(id: string): Promise<PurchaseResult> {
  const ctx = await requirePermission("purchase.post");

  try {
    await prisma.$transaction(async (tx) => {
      const inv = await tx.purchaseInvoice.findFirst({
        where: { id, companyId: ctx.company.id },
        include: { lines: { include: { item: true } } },
      });
      if (!inv) throw new Error("Faktur tidak ditemukan.");
      if (inv.status !== "DRAFT") throw new Error("Hanya faktur DRAFT yang bisa diposting.");
      if (inv.lines.length === 0) throw new Error("Faktur tidak punya baris.");

      const codes = await resolveAccountsByCode(tx, ctx.company.id, [
        POSTING_CODES.AP,
        POSTING_CODES.PPN_IN,
        POSTING_CODES.INVENTORY,
      ]);
      const apId = codes.get(POSTING_CODES.AP);
      if (!apId) throw new Error("Akun Utang Usaha (2-1100) tidak ditemukan.");
      const inventoryDefault =
        codes.get(POSTING_CODES.INVENTORY) ??
        (await requireAccountId(tx, ctx.company.id, POSTING_CODES.INVENTORY));
      const ppnInId = codes.get(POSTING_CODES.PPN_IN);

      const debitByAccount = new Map<string, Prisma.Decimal>();
      let taxTotal = new Prisma.Decimal(0);

      for (const l of inv.lines) {
        let accId = l.accountId;
        if (!accId) {
          if (l.item?.type === "INVENTORY") {
            accId = l.item.inventoryAccountId ?? inventoryDefault;
          } else {
            throw new Error(
              `Baris "${l.description}": pilih akun beban/persediaan untuk baris ini.`
            );
          }
        }
        debitByAccount.set(
          accId,
          (debitByAccount.get(accId) ?? new Prisma.Decimal(0)).plus(l.lineTotal)
        );
        taxTotal = taxTotal.plus(l.taxAmount);
      }

      if (taxTotal.gt(0) && !ppnInId) {
        throw new Error("Akun PPN Masukan (1-4900) tidak ditemukan.");
      }

      const lines = [
        ...[...debitByAccount.entries()].map(([accountId, amount]) => ({
          accountId,
          description: `Pembelian ${inv.number}`,
          debit: amount,
        })),
        ...(taxTotal.gt(0) && ppnInId
          ? [
              {
                accountId: ppnInId,
                description: `PPN masukan ${inv.number}`,
                debit: taxTotal,
              },
            ]
          : []),
        {
          accountId: apId,
          description: `Utang faktur ${inv.number}`,
          credit: inv.total,
          partnerType: "SUPPLIER" as const,
          partnerId: inv.supplierId,
        },
      ];

      const entryId = await postEntry(tx, {
        companyId: ctx.company.id,
        userId: ctx.user.id,
        date: inv.date,
        description: `Faktur Pembelian ${inv.number}`,
        reference: inv.reference,
        sourceType: "PURCHASE_INVOICE",
        sourceId: inv.id,
        lines,
      });

      await tx.purchaseInvoice.update({
        where: { id: inv.id },
        data: { status: "POSTED", postedAt: new Date(), journalEntryId: entryId },
      });
    });

    revalidatePath("/purchases");
    revalidatePath(`/purchases/${id}`);
    revalidatePath("/ledger");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal posting faktur." };
  }
}

export async function voidPurchaseInvoice(id: string): Promise<PurchaseResult> {
  const ctx = await requirePermission("purchase.post");

  try {
    await prisma.$transaction(async (tx) => {
      const inv = await tx.purchaseInvoice.findFirst({
        where: { id, companyId: ctx.company.id },
        include: { _count: { select: { allocations: true } } },
      });
      if (!inv) throw new Error("Faktur tidak ditemukan.");
      if (inv.status === "VOID") throw new Error("Faktur sudah dibatalkan.");
      if (inv.status !== "POSTED") throw new Error("Hanya faktur POSTED yang bisa dibatalkan.");
      if (inv.paidAmount.gt(0) || inv._count.allocations > 0) {
        throw new Error("Faktur sudah ada pembayaran, batalkan pembayarannya dulu.");
      }

      await voidEntry(tx, ctx.company.id, inv.journalEntryId);
      await tx.purchaseInvoice.update({ where: { id: inv.id }, data: { status: "VOID" } });
    });

    revalidatePath("/purchases");
    revalidatePath(`/purchases/${id}`);
    revalidatePath("/ledger");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal membatalkan faktur." };
  }
}

export async function deletePurchaseInvoice(id: string): Promise<PurchaseResult> {
  const ctx = await requirePermission("purchase.manage");
  const inv = await prisma.purchaseInvoice.findFirst({
    where: { id, companyId: ctx.company.id },
  });
  if (!inv) return { ok: false, error: "Faktur tidak ditemukan." };
  if (inv.status !== "DRAFT") return { ok: false, error: "Hanya faktur DRAFT yang bisa dihapus." };

  await prisma.purchaseInvoice.delete({ where: { id: inv.id } });
  revalidatePath("/purchases");
  return { ok: true, id };
}

// ============================================================================
// PEMBAYARAN (PURCHASE PAYMENT)
// ============================================================================

export async function savePurchasePayment(input: unknown): Promise<PurchaseResult> {
  const ctx = await requirePermission("purchase.manage");
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;
  const date = parseDay(data.date);

  try {
    const id = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findFirst({
        where: { id: data.supplierId, companyId: ctx.company.id },
        select: { id: true },
      });
      if (!supplier) throw new Error("Supplier tidak ditemukan.");

      const allocations = data.allocations.filter((a) => decOrZero(a.amount).gt(0));
      if (allocations.length === 0) throw new Error("Minimal 1 alokasi bernilai.");

      const invoices = await tx.purchaseInvoice.findMany({
        where: { id: { in: allocations.map((a) => a.invoiceId) }, companyId: ctx.company.id },
        select: { id: true, number: true, total: true, paidAmount: true, supplierId: true, status: true },
      });
      const map = new Map(invoices.map((i) => [i.id, i]));

      let amount = new Prisma.Decimal(0);
      for (const a of allocations) {
        const inv = map.get(a.invoiceId);
        if (!inv) throw new Error("Ada faktur yang tidak valid.");
        if (inv.supplierId !== supplier.id) {
          throw new Error(`Faktur ${inv.number} bukan milik supplier ini.`);
        }
        if (inv.status !== "POSTED") throw new Error(`Faktur ${inv.number} belum diposting.`);
        const value = money(a.amount);
        const remaining = inv.total.minus(inv.paidAmount);
        if (value.gt(remaining)) {
          throw new Error(
            `Alokasi untuk ${inv.number} melebihi sisa utang (${remaining.toString()}).`
          );
        }
        amount = amount.plus(value);
      }
      if (amount.lte(0)) throw new Error("Jumlah pembayaran harus lebih dari nol.");

      if (data.id) {
        const existing = await tx.purchasePayment.findFirst({
          where: { id: data.id, companyId: ctx.company.id },
          select: { id: true, status: true },
        });
        if (!existing) throw new Error("Pembayaran tidak ditemukan.");
        if (existing.status !== "DRAFT") {
          throw new Error("Hanya pembayaran DRAFT yang bisa diubah.");
        }
        await tx.purchasePaymentAllocation.deleteMany({ where: { paymentId: existing.id } });
        await tx.purchasePayment.update({
          where: { id: existing.id },
          data: {
            date,
            supplierId: supplier.id,
            method: data.method,
            bankAccountId: data.bankAccountId || null,
            amount,
            note: data.note,
            allocations: {
              create: allocations.map((a) => ({
                invoiceId: a.invoiceId,
                amount: money(a.amount),
              })),
            },
          },
        });
        return existing.id;
      }

      const number = await nextPurchasePaymentNumber(tx, ctx.company.id, date);
      const created = await tx.purchasePayment.create({
        data: {
          companyId: ctx.company.id,
          number,
          date,
          supplierId: supplier.id,
          method: data.method,
          bankAccountId: data.bankAccountId || null,
          amount,
          note: data.note,
          status: "DRAFT",
          allocations: {
            create: allocations.map((a) => ({
              invoiceId: a.invoiceId,
              amount: money(a.amount),
            })),
          },
        },
      });
      return created.id;
    });

    revalidatePath("/purchases/payments");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan pembayaran." };
  }
}

export async function postPurchasePayment(id: string): Promise<PurchaseResult> {
  const ctx = await requirePermission("purchase.post");

  try {
    await prisma.$transaction(async (tx) => {
      const pay = await tx.purchasePayment.findFirst({
        where: { id, companyId: ctx.company.id },
        include: { allocations: true },
      });
      if (!pay) throw new Error("Pembayaran tidak ditemukan.");
      if (pay.status !== "DRAFT") throw new Error("Hanya pembayaran DRAFT yang bisa diposting.");
      if (pay.allocations.length === 0) throw new Error("Pembayaran belum dialokasikan.");
      if (pay.amount.lte(0)) throw new Error("Jumlah pembayaran harus lebih dari nol.");

      const cashId = await resolveCashAccountId(tx, ctx.company.id, pay.method, pay.bankAccountId);
      const apId = await requireAccountId(tx, ctx.company.id, POSTING_CODES.AP);

      const entryId = await postEntry(tx, {
        companyId: ctx.company.id,
        userId: ctx.user.id,
        date: pay.date,
        description: `Pembayaran ${pay.number}`,
        sourceType: "PURCHASE_PAYMENT",
        sourceId: pay.id,
        lines: [
          {
            accountId: apId,
            description: `Pelunasan utang ${pay.number}`,
            debit: pay.amount,
            partnerType: "SUPPLIER",
            partnerId: pay.supplierId,
          },
          { accountId: cashId, description: `Pembayaran ${pay.number}`, credit: pay.amount },
        ],
      });

      for (const a of pay.allocations) {
        const inv = await tx.purchaseInvoice.findFirst({
          where: { id: a.invoiceId, companyId: ctx.company.id },
          select: { id: true, total: true, paidAmount: true },
        });
        if (!inv) throw new Error("Faktur alokasi tidak ditemukan.");
        const remaining = inv.total.minus(inv.paidAmount);
        if (a.amount.gt(remaining)) throw new Error("Alokasi melebihi sisa utang faktur.");
        await tx.purchaseInvoice.update({
          where: { id: inv.id },
          data: { paidAmount: inv.paidAmount.plus(a.amount) },
        });
      }

      await tx.purchasePayment.update({
        where: { id: pay.id },
        data: { status: "POSTED", postedAt: new Date(), journalEntryId: entryId },
      });
    });

    revalidatePath("/purchases/payments");
    revalidatePath(`/purchases/payments/${id}`);
    revalidatePath("/purchases");
    revalidatePath("/ledger");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal posting pembayaran." };
  }
}

export async function voidPurchasePayment(id: string): Promise<PurchaseResult> {
  const ctx = await requirePermission("purchase.post");

  try {
    await prisma.$transaction(async (tx) => {
      const pay = await tx.purchasePayment.findFirst({
        where: { id, companyId: ctx.company.id },
        include: { allocations: true },
      });
      if (!pay) throw new Error("Pembayaran tidak ditemukan.");
      if (pay.status === "VOID") throw new Error("Pembayaran sudah dibatalkan.");
      if (pay.status !== "POSTED") throw new Error("Hanya pembayaran POSTED yang bisa dibatalkan.");

      for (const a of pay.allocations) {
        const inv = await tx.purchaseInvoice.findFirst({
          where: { id: a.invoiceId, companyId: ctx.company.id },
          select: { id: true, paidAmount: true },
        });
        if (!inv) continue;
        const next = inv.paidAmount.minus(a.amount);
        await tx.purchaseInvoice.update({
          where: { id: inv.id },
          data: { paidAmount: next.lt(0) ? new Prisma.Decimal(0) : next },
        });
      }

      await voidEntry(tx, ctx.company.id, pay.journalEntryId);
      await tx.purchasePayment.update({ where: { id: pay.id }, data: { status: "VOID" } });
    });

    revalidatePath("/purchases/payments");
    revalidatePath(`/purchases/payments/${id}`);
    revalidatePath("/purchases");
    revalidatePath("/ledger");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal membatalkan pembayaran." };
  }
}

export async function deletePurchasePayment(id: string): Promise<PurchaseResult> {
  const ctx = await requirePermission("purchase.manage");
  const pay = await prisma.purchasePayment.findFirst({
    where: { id, companyId: ctx.company.id },
  });
  if (!pay) return { ok: false, error: "Pembayaran tidak ditemukan." };
  if (pay.status !== "DRAFT") return { ok: false, error: "Hanya pembayaran DRAFT yang bisa dihapus." };

  await prisma.purchasePayment.delete({ where: { id: pay.id } });
  revalidatePath("/purchases/payments");
  return { ok: true, id };
}
