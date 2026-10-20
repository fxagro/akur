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
  deleteEntry,
  resolveAccountsByCode,
  resolveCashAccountId,
  requireAccountId,
  nextSalesInvoiceNumber,
  nextSalesReceiptNumber,
  parseDay,
  decOrZero,
} from "@/lib/accounting/posting";

export type DocResult = { ok: true; id: string } | { ok: false; error: string };

const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

const invoiceLineSchema = z.object({
  itemId: z.string().optional().nullable(),
  description: z.string().trim().min(1, "Keterangan baris wajib diisi").max(300),
  accountId: z.string().optional().nullable(),
  qty: z.coerce.number().min(0).default(1),
  unitPrice: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  taxCodeId: z.string().optional().nullable(),
});

const salesInvoiceSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "Pelanggan wajib dipilih"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  dueDate: z.string().optional().nullable(),
  reference: optionalText,
  note: optionalText,
  lines: z.array(invoiceLineSchema).min(1, "Minimal 1 baris"),
});

const receiptSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "Pelanggan wajib dipilih"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  method: z.enum(["CASH", "BANK", "TRANSFER", "CREDIT_CARD", "OTHER"]).default("TRANSFER"),
  bankAccountId: z.string().optional().nullable(),
  note: optionalText,
  allocations: z
    .array(
      z.object({
        invoiceId: z.string().min(1),
        amount: z.coerce.number().min(0),
      })
    )
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
  gross: Prisma.Decimal;
};

async function computeLines(
  tx: Prisma.TransactionClient,
  companyId: string,
  lines: z.infer<typeof invoiceLineSchema>[]
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
      gross,
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

// ============================================================================
// FAKTUR PENJUALAN
// ============================================================================

export async function saveSalesInvoice(input: unknown): Promise<DocResult> {
  const ctx = await requirePermission("sales.manage");
  const parsed = salesInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;
  const date = parseDay(data.date);
  const dueDate = data.dueDate ? parseDay(data.dueDate) : null;

  try {
    const id = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: data.customerId, companyId: ctx.company.id, isActive: true },
        select: { id: true },
      });
      if (!customer) throw new Error("Pelanggan tidak ditemukan atau tidak aktif.");

      const c = await computeLines(tx, ctx.company.id, data.lines);
      if (c.total.lte(0)) throw new Error("Total faktur harus lebih dari nol.");

      if (data.id) {
        const existing = await tx.salesInvoice.findFirst({
          where: { id: data.id, companyId: ctx.company.id },
          select: { id: true, status: true },
        });
        if (!existing) throw new Error("Faktur tidak ditemukan.");
        if (existing.status !== "DRAFT") {
          throw new Error("Hanya faktur DRAFT yang bisa diubah.");
        }
        await tx.salesInvoiceLine.deleteMany({ where: { invoiceId: existing.id } });
        await tx.salesInvoice.update({
          where: { id: existing.id },
          data: {
            date,
            dueDate,
            customerId: customer.id,
            reference: data.reference,
            note: data.note,
            subtotal: c.subtotal,
            discount: c.discount,
            taxAmount: c.taxAmount,
            total: c.total,
            lines: {
              create: c.lines.map((l, i) => ({
                itemId: l.itemId,
                description: l.description,
                accountId: l.accountId,
                qty: l.qty,
                unitPrice: l.unitPrice,
                discount: l.discount,
                taxCodeId: l.taxCodeId,
                taxAmount: l.taxAmount,
                lineTotal: l.lineTotal,
                sortOrder: i,
              })),
            },
          },
        });
        return existing.id;
      }

      const number = await nextSalesInvoiceNumber(tx, ctx.company.id, date);
      const created = await tx.salesInvoice.create({
        data: {
          companyId: ctx.company.id,
          number,
          date,
          dueDate,
          customerId: customer.id,
          reference: data.reference,
          note: data.note,
          status: "DRAFT",
          subtotal: c.subtotal,
          discount: c.discount,
          taxAmount: c.taxAmount,
          total: c.total,
          lines: {
            create: c.lines.map((l, i) => ({
              itemId: l.itemId,
              description: l.description,
              accountId: l.accountId,
              qty: l.qty,
              unitPrice: l.unitPrice,
              discount: l.discount,
              taxCodeId: l.taxCodeId,
              taxAmount: l.taxAmount,
              lineTotal: l.lineTotal,
              sortOrder: i,
            })),
          },
        },
      });
      return created.id;
    });

    revalidatePath("/sales");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan faktur." };
  }
}

export async function postSalesInvoice(id: string): Promise<DocResult> {
  const ctx = await requirePermission("sales.post");

  try {
    await prisma.$transaction(async (tx) => {
      const inv = await tx.salesInvoice.findFirst({
        where: { id, companyId: ctx.company.id },
        include: { lines: true },
      });
      if (!inv) throw new Error("Faktur tidak ditemukan.");
      if (inv.status !== "DRAFT") throw new Error("Hanya faktur DRAFT yang bisa diposting.");
      if (inv.lines.length === 0) throw new Error("Faktur tidak punya baris.");

      const codes = await resolveAccountsByCode(tx, ctx.company.id, [
        POSTING_CODES.AR,
        POSTING_CODES.SALES,
        POSTING_CODES.SALES_DISCOUNT,
        POSTING_CODES.PPN_OUT,
      ]);
      const arId = codes.get(POSTING_CODES.AR);
      if (!arId) throw new Error("Akun Piutang Usaha (1-2100) tidak ditemukan.");
      const defaultRevenueId =
        codes.get(POSTING_CODES.SALES) ?? (await requireAccountId(tx, ctx.company.id, POSTING_CODES.SALES));
      const discountId = codes.get(POSTING_CODES.SALES_DISCOUNT);
      const defaultTaxId = codes.get(POSTING_CODES.PPN_OUT);

      const revenueByAccount = new Map<string, Prisma.Decimal>();
      const taxByAccount = new Map<string, Prisma.Decimal>();
      let discountTotal = new Prisma.Decimal(0);

      for (const l of inv.lines) {
        const accId = l.accountId ?? defaultRevenueId;
        // kredit pendapatan sebesar bruto; diskon dicatat sebagai kontra-pendapatan
        revenueByAccount.set(
          accId,
          (revenueByAccount.get(accId) ?? new Prisma.Decimal(0))
            .plus(l.lineTotal)
            .plus(l.discount)
        );
        discountTotal = discountTotal.plus(l.discount);
        if (l.taxAmount.gt(0)) {
          const accIdTax = defaultTaxId;
          if (!accIdTax) throw new Error("Akun PPN Keluaran (2-1210) tidak ditemukan.");
          taxByAccount.set(
            accIdTax,
            (taxByAccount.get(accIdTax) ?? new Prisma.Decimal(0)).plus(l.taxAmount)
          );
        }
      }

      const lines = [
        {
          accountId: arId,
          description: `Piutang faktur ${inv.number}`,
          debit: inv.total,
          partnerType: "CUSTOMER" as const,
          partnerId: inv.customerId,
        },
        ...[...revenueByAccount.entries()].map(([accountId, amount]) => ({
          accountId,
          description: `Penjualan ${inv.number}`,
          credit: amount,
        })),
        ...(discountTotal.gt(0) && discountId
          ? [
              {
                accountId: discountId,
                description: `Diskon penjualan ${inv.number}`,
                debit: discountTotal,
              },
            ]
          : []),
        ...[...taxByAccount.entries()].map(([accountId, amount]) => ({
          accountId,
          description: `PPN keluaran ${inv.number}`,
          credit: amount,
        })),
      ];

      const entryId = await postEntry(tx, {
        companyId: ctx.company.id,
        userId: ctx.user.id,
        date: inv.date,
        description: `Faktur Penjualan ${inv.number}`,
        reference: inv.reference,
        sourceType: "SALES_INVOICE",
        sourceId: inv.id,
        lines,
      });

      await tx.salesInvoice.update({
        where: { id: inv.id },
        data: { status: "POSTED", postedAt: new Date(), journalEntryId: entryId },
      });
    });

    revalidatePath("/sales");
    revalidatePath(`/sales/${id}`);
    revalidatePath("/ledger");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal posting faktur." };
  }
}

export async function voidSalesInvoice(id: string): Promise<DocResult> {
  const ctx = await requirePermission("sales.post");

  try {
    await prisma.$transaction(async (tx) => {
      const inv = await tx.salesInvoice.findFirst({
        where: { id, companyId: ctx.company.id },
        include: { _count: { select: { allocations: true } } },
      });
      if (!inv) throw new Error("Faktur tidak ditemukan.");
      if (inv.status === "VOID") throw new Error("Faktur sudah dibatalkan.");
      if (inv.status !== "POSTED") throw new Error("Hanya faktur POSTED yang bisa dibatalkan.");
      if (inv.paidAmount.gt(0) || inv._count.allocations > 0) {
        throw new Error("Faktur sudah ada penerimaan, batalkan penerimaannya dulu.");
      }

      await voidEntry(tx, ctx.company.id, inv.journalEntryId);
      await tx.salesInvoice.update({
        where: { id: inv.id },
        data: { status: "VOID" },
      });
    });

    revalidatePath("/sales");
    revalidatePath(`/sales/${id}`);
    revalidatePath("/ledger");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal membatalkan faktur." };
  }
}

export async function deleteSalesInvoice(id: string): Promise<DocResult> {
  const ctx = await requirePermission("sales.manage");
  const inv = await prisma.salesInvoice.findFirst({
    where: { id, companyId: ctx.company.id },
  });
  if (!inv) return { ok: false, error: "Faktur tidak ditemukan." };
  if (inv.status !== "DRAFT") return { ok: false, error: "Hanya faktur DRAFT yang bisa dihapus." };

  await prisma.salesInvoice.delete({ where: { id: inv.id } });
  revalidatePath("/sales");
  return { ok: true, id };
}

// ============================================================================
// PENERIMAAN KAS (SALES RECEIPT)
// ============================================================================

export async function saveSalesReceipt(input: unknown): Promise<DocResult> {
  const ctx = await requirePermission("sales.manage");
  const parsed = receiptSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;
  const date = parseDay(data.date);

  try {
    const id = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: data.customerId, companyId: ctx.company.id },
        select: { id: true },
      });
      if (!customer) throw new Error("Pelanggan tidak ditemukan.");

      const allocations = data.allocations.filter((a) => decOrZero(a.amount).gt(0));
      if (allocations.length === 0) throw new Error("Minimal 1 alokasi bernilai.");

      const invoiceIds = allocations.map((a) => a.invoiceId);
      const invoices = await tx.salesInvoice.findMany({
        where: { id: { in: invoiceIds }, companyId: ctx.company.id },
        select: { id: true, number: true, total: true, paidAmount: true, customerId: true, status: true },
      });
      const map = new Map(invoices.map((i) => [i.id, i]));

      let amount = new Prisma.Decimal(0);
      for (const a of allocations) {
        const inv = map.get(a.invoiceId);
        if (!inv) throw new Error("Ada faktur yang tidak valid.");
        if (inv.customerId !== customer.id) {
          throw new Error(`Faktur ${inv.number} bukan milik pelanggan ini.`);
        }
        if (inv.status !== "POSTED") {
          throw new Error(`Faktur ${inv.number} belum diposting.`);
        }
        const value = money(a.amount);
        const remaining = inv.total.minus(inv.paidAmount);
        if (value.gt(remaining)) {
          throw new Error(
            `Alokasi untuk ${inv.number} melebihi sisa tagihan (${remaining.toString()}).`
          );
        }
        amount = amount.plus(value);
      }
      if (amount.lte(0)) throw new Error("Jumlah penerimaan harus lebih dari nol.");

      if (data.id) {
        const existing = await tx.salesReceipt.findFirst({
          where: { id: data.id, companyId: ctx.company.id },
          select: { id: true, status: true },
        });
        if (!existing) throw new Error("Penerimaan tidak ditemukan.");
        if (existing.status !== "DRAFT") {
          throw new Error("Hanya penerimaan DRAFT yang bisa diubah.");
        }
        await tx.salesPaymentAllocation.deleteMany({ where: { receiptId: existing.id } });
        await tx.salesReceipt.update({
          where: { id: existing.id },
          data: {
            date,
            customerId: customer.id,
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

      const number = await nextSalesReceiptNumber(tx, ctx.company.id, date);
      const created = await tx.salesReceipt.create({
        data: {
          companyId: ctx.company.id,
          number,
          date,
          customerId: customer.id,
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

    revalidatePath("/sales/receipts");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan penerimaan." };
  }
}

export async function postSalesReceipt(id: string): Promise<DocResult> {
  const ctx = await requirePermission("sales.post");

  try {
    await prisma.$transaction(async (tx) => {
      const rc = await tx.salesReceipt.findFirst({
        where: { id, companyId: ctx.company.id },
        include: { allocations: true },
      });
      if (!rc) throw new Error("Penerimaan tidak ditemukan.");
      if (rc.status !== "DRAFT") throw new Error("Hanya penerimaan DRAFT yang bisa diposting.");
      if (rc.allocations.length === 0) throw new Error("Penerimaan belum dialokasikan.");
      if (rc.amount.lte(0)) throw new Error("Jumlah penerimaan harus lebih dari nol.");

      const cashId = await resolveCashAccountId(
        tx,
        ctx.company.id,
        rc.method,
        rc.bankAccountId
      );
      const arId = await requireAccountId(tx, ctx.company.id, POSTING_CODES.AR);

      const entryId = await postEntry(tx, {
        companyId: ctx.company.id,
        userId: ctx.user.id,
        date: rc.date,
        description: `Penerimaan ${rc.number}`,
        sourceType: "SALES_RECEIPT",
        sourceId: rc.id,
        lines: [
          { accountId: cashId, description: `Penerimaan ${rc.number}`, debit: rc.amount },
          {
            accountId: arId,
            description: `Pelunasan piutang ${rc.number}`,
            credit: rc.amount,
            partnerType: "CUSTOMER",
            partnerId: rc.customerId,
          },
        ],
      });

      for (const a of rc.allocations) {
        const inv = await tx.salesInvoice.findFirst({
          where: { id: a.invoiceId, companyId: ctx.company.id },
          select: { id: true, total: true, paidAmount: true },
        });
        if (!inv) throw new Error("Faktur alokasi tidak ditemukan.");
        const remaining = inv.total.minus(inv.paidAmount);
        if (a.amount.gt(remaining)) {
          throw new Error("Alokasi melebihi sisa tagihan faktur.");
        }
        await tx.salesInvoice.update({
          where: { id: inv.id },
          data: { paidAmount: inv.paidAmount.plus(a.amount) },
        });
      }

      await tx.salesReceipt.update({
        where: { id: rc.id },
        data: { status: "POSTED", postedAt: new Date(), journalEntryId: entryId },
      });
    });

    revalidatePath("/sales/receipts");
    revalidatePath(`/sales/receipts/${id}`);
    revalidatePath("/sales");
    revalidatePath("/ledger");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal posting penerimaan." };
  }
}

export async function voidSalesReceipt(id: string): Promise<DocResult> {
  const ctx = await requirePermission("sales.post");

  try {
    await prisma.$transaction(async (tx) => {
      const rc = await tx.salesReceipt.findFirst({
        where: { id, companyId: ctx.company.id },
        include: { allocations: true },
      });
      if (!rc) throw new Error("Penerimaan tidak ditemukan.");
      if (rc.status === "VOID") throw new Error("Penerimaan sudah dibatalkan.");
      if (rc.status !== "POSTED") throw new Error("Hanya penerimaan POSTED yang bisa dibatalkan.");

      for (const a of rc.allocations) {
        const inv = await tx.salesInvoice.findFirst({
          where: { id: a.invoiceId, companyId: ctx.company.id },
          select: { id: true, paidAmount: true },
        });
        if (!inv) continue;
        const next = inv.paidAmount.minus(a.amount);
        await tx.salesInvoice.update({
          where: { id: inv.id },
          data: { paidAmount: next.lt(0) ? new Prisma.Decimal(0) : next },
        });
      }

      await voidEntry(tx, ctx.company.id, rc.journalEntryId);
      await tx.salesReceipt.update({
        where: { id: rc.id },
        data: { status: "VOID" },
      });
    });

    revalidatePath("/sales/receipts");
    revalidatePath(`/sales/receipts/${id}`);
    revalidatePath("/sales");
    revalidatePath("/ledger");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal membatalkan penerimaan." };
  }
}

export async function deleteSalesReceipt(id: string): Promise<DocResult> {
  const ctx = await requirePermission("sales.manage");
  const rc = await prisma.salesReceipt.findFirst({
    where: { id, companyId: ctx.company.id },
  });
  if (!rc) return { ok: false, error: "Penerimaan tidak ditemukan." };
  if (rc.status !== "DRAFT") return { ok: false, error: "Hanya penerimaan DRAFT yang bisa dihapus." };

  await deleteEntry(prisma, ctx.company.id, rc.journalEntryId);
  await prisma.salesReceipt.delete({ where: { id: rc.id } });
  revalidatePath("/sales/receipts");
  return { ok: true, id };
}
