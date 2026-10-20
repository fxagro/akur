"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-context";
import { Prisma } from "@/generated/prisma/client";

const taxCodeSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(1, "Kode wajib diisi").max(20),
  name: z.string().trim().min(1, "Nama wajib diisi").max(100),
  type: z.enum(["PPN", "PPH"]),
  rate: z.coerce.number().min(0).max(1),
  accountId: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export type TaxCodeResult = { ok: true; id: string } | { ok: false; error: string };

function isUniqueError(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function saveTaxCode(input: unknown): Promise<TaxCodeResult> {
  const ctx = await requirePermission("tax.manage");
  const parsed = taxCodeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;

  try {
    if (data.id) {
      const existing = await prisma.taxCode.findFirst({
        where: { id: data.id, companyId: ctx.company.id },
      });
      if (!existing) return { ok: false, error: "Kode pajak tidak ditemukan." };
      await prisma.taxCode.update({
        where: { id: existing.id },
        data: {
          code: data.code,
          name: data.name,
          type: data.type,
          rate: data.rate,
          accountId: data.accountId,
          isActive: data.isActive,
        },
      });
      revalidatePath("/tax/codes");
      return { ok: true, id: existing.id };
    }
    const created = await prisma.taxCode.create({
      data: {
        companyId: ctx.company.id,
        code: data.code,
        name: data.name,
        type: data.type,
        rate: data.rate,
        accountId: data.accountId,
        isActive: data.isActive,
      },
    });
    revalidatePath("/tax/codes");
    return { ok: true, id: created.id };
  } catch (e) {
    if (isUniqueError(e)) return { ok: false, error: `Kode pajak "${data.code}" sudah ada.` };
    throw e;
  }
}

export async function toggleTaxCodeActive(id: string, isActive: boolean): Promise<TaxCodeResult> {
  const ctx = await requirePermission("tax.manage");
  const res = await prisma.taxCode.updateMany({
    where: { id, companyId: ctx.company.id },
    data: { isActive },
  });
  if (res.count === 0) return { ok: false, error: "Kode pajak tidak ditemukan." };
  revalidatePath("/tax/codes");
  return { ok: true, id };
}

export async function deleteTaxCode(id: string): Promise<TaxCodeResult> {
  const ctx = await requirePermission("tax.manage");
  const tc = await prisma.taxCode.findFirst({
    where: { id, companyId: ctx.company.id },
    include: { _count: { select: { salesInvoiceLines: true, purchaseInvoiceLines: true } } },
  });
  if (!tc) return { ok: false, error: "Kode pajak tidak ditemukan." };
  if (tc._count.salesInvoiceLines + tc._count.purchaseInvoiceLines > 0) {
    return { ok: false, error: "Kode pajak sudah dipakai transaksi, tidak bisa dihapus." };
  }
  await prisma.taxCode.delete({ where: { id } });
  revalidatePath("/tax/codes");
  return { ok: true, id };
}

// ============================================================================
// FAKTUR PAJAK KELUARAN (OUTPUT) - dari Sales Invoice
// ============================================================================

const outputTaxInvoiceSchema = z.object({
  id: z.string().optional(),
  salesInvoiceId: z.string().min(1, "Faktur penjualan wajib dipilih"),
  number: z.string().trim().min(1, "Nomor faktur pajak wajib diisi").max(50),
  date: z.string().min(1, "Tanggal wajib diisi"),
  dpp: z.coerce.number().min(0),
  ppn: z.coerce.number().min(0),
  ppnbm: z.coerce.number().min(0).default(0),
  partnerName: z.string().trim().min(1, "Nama pembeli wajib diisi").max(150),
  partnerNpwp: z.string().trim().max(50).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
});

export type OutputTaxInvoiceResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveOutputTaxInvoice(input: unknown): Promise<OutputTaxInvoiceResult> {
  const ctx = await requirePermission("tax.manage");
  const parsed = outputTaxInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;
  const date = new Date(`${data.date}T00:00:00.000Z`);

  try {
    const id = await prisma.$transaction(async (tx) => {
      const inv = await tx.salesInvoice.findFirst({
        where: { id: data.salesInvoiceId, companyId: ctx.company.id },
        select: { id: true, number: true, total: true, taxAmount: true, customer: { select: { name: true, npwp: true } }, status: true },
      });
      if (!inv) throw new Error("Faktur penjualan tidak ditemukan.");
      if (inv.status !== "POSTED") throw new Error("Faktur penjualan belum diposting.");

      const dpp = new Prisma.Decimal(data.dpp);
      const ppn = new Prisma.Decimal(data.ppn);
      const ppnbm = new Prisma.Decimal(data.ppnbm);
      if (inv.taxAmount.gt(0) && !ppn.equals(inv.taxAmount)) {
        throw new Error(`PPN faktur pajak (${ppn}) tidak sama dengan PPN faktur penjualan (${inv.taxAmount}).`);
      }

      if (data.id) {
        const existing = await tx.taxInvoice.findFirst({
          where: { id: data.id, companyId: ctx.company.id },
          select: { id: true },
        });
        if (!existing) throw new Error("Faktur pajak tidak ditemukan.");
        await tx.taxInvoice.update({
          where: { id: existing.id },
          data: {
            number: data.number,
            date,
            direction: "OUTPUT",
            dpp,
            ppn,
            ppnbm,
            partnerName: data.partnerName,
            partnerNpwp: data.partnerNpwp ?? null,
            note: data.note ?? null,
            refType: "SALES_INVOICE",
            refId: inv.id,
          },
        });
        return existing.id;
      }

      const created = await tx.taxInvoice.create({
        data: {
          companyId: ctx.company.id,
          number: data.number,
          date,
          direction: "OUTPUT",
          dpp,
          ppn,
          ppnbm,
          partnerName: data.partnerName,
          partnerNpwp: data.partnerNpwp ?? null,
          note: data.note ?? null,
          refType: "SALES_INVOICE",
          refId: inv.id,
        },
      });
      return created.id;
    });

    revalidatePath("/tax/output");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan faktur pajak keluaran." };
  }
}

export async function deleteOutputTaxInvoice(id: string): Promise<OutputTaxInvoiceResult> {
  const ctx = await requirePermission("tax.manage");
  const ti = await prisma.taxInvoice.findFirst({
    where: { id, companyId: ctx.company.id, direction: "OUTPUT" },
  });
  if (!ti) return { ok: false, error: "Faktur pajak keluaran tidak ditemukan." };
  await prisma.taxInvoice.delete({ where: { id } });
  revalidatePath("/tax/output");
  return { ok: true, id };
}

// ============================================================================
// FAKTUR PAJAK MASUKAN (INPUT) - dari Purchase Invoice
// ============================================================================

const inputTaxInvoiceSchema = z.object({
  id: z.string().optional(),
  purchaseInvoiceId: z.string().min(1, "Faktur pembelian wajib dipilih"),
  number: z.string().trim().min(1, "Nomor faktur pajak wajib diisi").max(50),
  date: z.string().min(1, "Tanggal wajib diisi"),
  dpp: z.coerce.number().min(0),
  ppn: z.coerce.number().min(0),
  ppnbm: z.coerce.number().min(0).default(0),
  partnerName: z.string().trim().min(1, "Nama penjual wajib diisi").max(150),
  partnerNpwp: z.string().trim().max(50).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
});

export type InputTaxInvoiceResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveInputTaxInvoice(input: unknown): Promise<InputTaxInvoiceResult> {
  const ctx = await requirePermission("tax.manage");
  const parsed = inputTaxInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;
  const date = new Date(`${data.date}T00:00:00.000Z`);

  try {
    const id = await prisma.$transaction(async (tx) => {
      const inv = await tx.purchaseInvoice.findFirst({
        where: { id: data.purchaseInvoiceId, companyId: ctx.company.id },
        select: { id: true, number: true, taxAmount: true, supplier: { select: { name: true, npwp: true } }, status: true },
      });
      if (!inv) throw new Error("Faktur pembelian tidak ditemukan.");
      if (inv.status !== "POSTED") throw new Error("Faktur pembelian belum diposting.");

      const dpp = new Prisma.Decimal(data.dpp);
      const ppn = new Prisma.Decimal(data.ppn);
      const ppnbm = new Prisma.Decimal(data.ppnbm);
      if (inv.taxAmount.gt(0) && !ppn.equals(inv.taxAmount)) {
        throw new Error(`PPN faktur pajak (${ppn}) tidak sama dengan PPN faktur pembelian (${inv.taxAmount}).`);
      }

      if (data.id) {
        const existing = await tx.taxInvoice.findFirst({
          where: { id: data.id, companyId: ctx.company.id, direction: "INPUT" },
          select: { id: true },
        });
        if (!existing) throw new Error("Faktur pajak masukan tidak ditemukan.");
        await tx.taxInvoice.update({
          where: { id: existing.id },
          data: {
            number: data.number,
            date,
            direction: "INPUT",
            dpp,
            ppn,
            ppnbm,
            partnerName: data.partnerName,
            partnerNpwp: data.partnerNpwp ?? null,
            note: data.note ?? null,
            refType: "PURCHASE_INVOICE",
            refId: inv.id,
          },
        });
        return existing.id;
      }

      const created = await tx.taxInvoice.create({
        data: {
          companyId: ctx.company.id,
          number: data.number,
          date,
          direction: "INPUT",
          dpp,
          ppn,
          ppnbm,
          partnerName: data.partnerName,
          partnerNpwp: data.partnerNpwp ?? null,
          note: data.note ?? null,
          refType: "PURCHASE_INVOICE",
          refId: inv.id,
        },
      });
      return created.id;
    });

    revalidatePath("/tax/input");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan faktur pajak masukan." };
  }
}

export async function deleteInputTaxInvoice(id: string): Promise<InputTaxInvoiceResult> {
  const ctx = await requirePermission("tax.manage");
  const ti = await prisma.taxInvoice.findFirst({
    where: { id, companyId: ctx.company.id, direction: "INPUT" },
  });
  if (!ti) return { ok: false, error: "Faktur pajak masukan tidak ditemukan." };
  await prisma.taxInvoice.delete({ where: { id } });
  revalidatePath("/tax/input");
  return { ok: true, id };
}

// ============================================================================
// PPh (Withholding Tax) - untuk pembayaran ke supplier/employee
// ============================================================================

const pphSchema = z.object({
  id: z.string().optional(),
  paymentType: z.enum(["PURCHASE_PAYMENT", "SALARY", "OTHER"]),
  refId: z.string().optional(),
  taxCodeId: z.string().min(1, "Kode PPh wajib dipilih"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  grossAmount: z.coerce.number().min(0),
  tariff: z.coerce.number().min(0).max(1),
  partnerName: z.string().trim().min(1, "Nama lawan transaksi wajib diisi").max(150),
  partnerNpwp: z.string().trim().max(50).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
});

export type PphResult = { ok: true; id: string } | { ok: false; error: string };

export async function savePph(input: unknown): Promise<PphResult> {
  const ctx = await requirePermission("tax.manage");
  const parsed = pphSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;
  const date = new Date(`${data.date}T00:00:00.000Z`);

  try {
    const taxCode = await prisma.taxCode.findFirst({
      where: { id: data.taxCodeId, companyId: ctx.company.id, type: "PPH" },
      select: { id: true, rate: true, accountId: true },
    });
    if (!taxCode) throw new Error("Kode PPh tidak valid.");

    const pphAmount = new Prisma.Decimal(data.grossAmount).times(taxCode.rate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    if (data.id) {
      const existing = await prisma.taxInvoice.findFirst({
        where: { id: data.id, companyId: ctx.company.id, direction: "INPUT" }, // PPh stored as INPUT direction
      });
      if (!existing) return { ok: false, error: "PPh tidak ditemukan." };
      await prisma.taxInvoice.update({
        where: { id: existing.id },
        data: {
          date,
          dpp: new Prisma.Decimal(data.grossAmount),
          ppn: pphAmount,
          ppnbm: new Prisma.Decimal(0),
          partnerName: data.partnerName,
          partnerNpwp: data.partnerNpwp ?? null,
          note: data.note ?? null,
        },
      });
      revalidatePath("/tax/pph");
      return { ok: true, id: existing.id };
    }

    const created = await prisma.taxInvoice.create({
      data: {
        companyId: ctx.company.id,
        number: `PPh-${date.getUTCFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
        date,
        direction: "INPUT",
        dpp: new Prisma.Decimal(data.grossAmount),
        ppn: pphAmount,
        ppnbm: new Prisma.Decimal(0),
        partnerName: data.partnerName,
        partnerNpwp: data.partnerNpwp ?? null,
        note: data.note ?? null,
      },
    });
    revalidatePath("/tax/pph");
    return { ok: true, id: created.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan PPh." };
  }
}

export async function deletePph(id: string): Promise<PphResult> {
  const ctx = await requirePermission("tax.manage");
  const ti = await prisma.taxInvoice.findFirst({
    where: { id, companyId: ctx.company.id, direction: "INPUT", refType: { not: "PURCHASE_INVOICE" } }, // crude filter for PPh
  });
  if (!ti) return { ok: false, error: "PPh tidak ditemukan." };
  await prisma.taxInvoice.delete({ where: { id } });
  revalidatePath("/tax/pph");
  return { ok: true, id };
}

// ============================================================================
// SPT PPN (monthly report data)
// ============================================================================

export type SptPpnData = {
  period: string; // "2026-01"
  output: {
    count: number;
    totalDpp: Prisma.Decimal;
    totalPpn: Prisma.Decimal;
    totalPpnbm: Prisma.Decimal;
  };
  input: {
    count: number;
    totalDpp: Prisma.Decimal;
    totalPpn: Prisma.Decimal;
    totalPpnbm: Prisma.Decimal;
  };
  lb: Prisma.Decimal; // Ppn Keluaran - Ppn Masukan
  status: "LB" | "KB" | "NOL";
};

export async function getSptPpn(companyId: string, year: number, month: number): Promise<SptPpnData> {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  const [outputAgg, inputAgg] = await Promise.all([
    prisma.taxInvoice.aggregate({
      where: { companyId, direction: "OUTPUT", date: { gte: start, lte: end } },
      _count: { id: true },
      _sum: { dpp: true, ppn: true, ppnbm: true },
    }),
    prisma.taxInvoice.aggregate({
      where: { companyId, direction: "INPUT", date: { gte: start, lte: end }, refType: "PURCHASE_INVOICE" }, // only purchase invoices for PPN masukan
      _count: { id: true },
      _sum: { dpp: true, ppn: true, ppnbm: true },
    }),
  ]);

  const totalOutputPpn = outputAgg._sum.ppn ?? new Prisma.Decimal(0);
  const totalInputPpn = inputAgg._sum.ppn ?? new Prisma.Decimal(0);
  const lb = totalOutputPpn.minus(totalInputPpn);

  return {
    period: `${year}-${String(month).padStart(2, "0")}`,
    output: {
      count: outputAgg._count.id,
      totalDpp: outputAgg._sum.dpp ?? new Prisma.Decimal(0),
      totalPpn: totalOutputPpn,
      totalPpnbm: outputAgg._sum.ppnbm ?? new Prisma.Decimal(0),
    },
    input: {
      count: inputAgg._count.id,
      totalDpp: inputAgg._sum.dpp ?? new Prisma.Decimal(0),
      totalPpn: totalInputPpn,
      totalPpnbm: inputAgg._sum.ppnbm ?? new Prisma.Decimal(0),
    },
    lb,
    status: lb.gt(0) ? "KB" : lb.lt(0) ? "LB" : "NOL",
  };
}

export async function listOutputTaxInvoices(companyId: string, year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  const invoices = await prisma.taxInvoice.findMany({
    where: { companyId, direction: "OUTPUT", date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
    select: {
      id: true,
      number: true,
      date: true,
      dpp: true,
      ppn: true,
      ppnbm: true,
      partnerName: true,
      partnerNpwp: true,
      note: true,
      refId: true,
      refType: true,
    },
  });
  if (invoices.length === 0) return [];
  const refIds = Array.from(new Set(invoices.map((i) => i.refId).filter(Boolean) as string[]));
  const salesInvoices = refIds.length
    ? await prisma.salesInvoice.findMany({
        where: { id: { in: refIds } },
        select: { id: true, number: true },
      })
    : [];
  const salesMap = new Map(salesInvoices.map((s) => [s.id, s.number]));
  return invoices.map((i) => ({
    ...i,
    salesInvoice: i.refId && salesMap.has(i.refId) ? { number: salesMap.get(i.refId)! } : undefined,
  }));
}

export async function listInputTaxInvoices(companyId: string, year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  const invoices = await prisma.taxInvoice.findMany({
    where: { companyId, direction: "INPUT", date: { gte: start, lte: end }, refType: "PURCHASE_INVOICE" },
    orderBy: { date: "asc" },
    select: {
      id: true,
      number: true,
      date: true,
      dpp: true,
      ppn: true,
      ppnbm: true,
      partnerName: true,
      partnerNpwp: true,
      note: true,
      refId: true,
      refType: true,
    },
  });
  if (invoices.length === 0) return [];
  const refIds = Array.from(new Set(invoices.map((i) => i.refId).filter(Boolean) as string[]));
  const purchaseInvoices = refIds.length
    ? await prisma.purchaseInvoice.findMany({
        where: { id: { in: refIds } },
        select: { id: true, number: true },
      })
    : [];
  const purchaseMap = new Map(purchaseInvoices.map((p) => [p.id, p.number]));
  return invoices.map((i) => ({
    ...i,
    purchaseInvoice: i.refId && purchaseMap.has(i.refId) ? { number: purchaseMap.get(i.refId)! } : undefined,
  }));
}

export async function listPphRecords(companyId: string, year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  return prisma.taxInvoice.findMany({
    where: { companyId, direction: "INPUT", date: { gte: start, lte: end }, refType: { not: "PURCHASE_INVOICE" } },
    orderBy: { date: "asc" },
    select: {
      id: true,
      number: true,
      date: true,
      dpp: true,
      ppn: true,
      ppnbm: true,
      partnerName: true,
      partnerNpwp: true,
      note: true,
      refId: true,
      refType: true,
    },
  });
}