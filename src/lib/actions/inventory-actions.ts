"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-context";
import { Prisma } from "@/generated/prisma/client";

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Nama kategori wajib diisi").max(100),
});

export type CategoryResult = { ok: true; id: string } | { ok: false; error: string };

function isUniqueError(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function saveItemCategory(input: unknown): Promise<CategoryResult> {
  const ctx = await requirePermission("inventory.manage");
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const { id, name } = parsed.data;

  try {
    if (id) {
      const existing = await prisma.itemCategory.findFirst({
        where: { id, companyId: ctx.company.id },
      });
      if (!existing) return { ok: false, error: "Kategori tidak ditemukan." };
      await prisma.itemCategory.update({ where: { id }, data: { name } });
      revalidatePath("/inventory/categories");
      return { ok: true, id };
    }
    const created = await prisma.itemCategory.create({
      data: { companyId: ctx.company.id, name },
    });
    revalidatePath("/inventory/categories");
    return { ok: true, id: created.id };
  } catch (e) {
    if (isUniqueError(e)) return { ok: false, error: "Nama kategori sudah dipakai." };
    throw e;
  }
}

export async function deleteItemCategory(id: string): Promise<CategoryResult> {
  const ctx = await requirePermission("inventory.manage");
  const cat = await prisma.itemCategory.findFirst({
    where: { id, companyId: ctx.company.id },
    include: { _count: { select: { items: true } } },
  });
  if (!cat) return { ok: false, error: "Kategori tidak ditemukan." };
  if (cat._count.items > 0) {
    return { ok: false, error: "Kategori masih dipakai item, hapus item dulu." };
  }
  await prisma.itemCategory.delete({ where: { id } });
  revalidatePath("/inventory/categories");
  return { ok: true, id };
}

const warehouseSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(1, "Kode wajib diisi").max(20),
  name: z.string().trim().min(1, "Nama wajib diisi").max(100),
  address: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export type WarehouseResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveWarehouse(input: unknown): Promise<WarehouseResult> {
  const ctx = await requirePermission("inventory.manage");
  const parsed = warehouseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;

  try {
    if (data.id) {
      const existing = await prisma.warehouse.findFirst({
        where: { id: data.id, companyId: ctx.company.id },
      });
      if (!existing) return { ok: false, error: "Gudang tidak ditemukan." };
      await prisma.warehouse.update({
        where: { id: existing.id },
        data: { code: data.code, name: data.name, address: data.address, isActive: data.isActive },
      });
      revalidatePath("/inventory/warehouses");
      return { ok: true, id: existing.id };
    }
    const created = await prisma.warehouse.create({
      data: { companyId: ctx.company.id, code: data.code, name: data.name, address: data.address, isActive: data.isActive },
    });
    revalidatePath("/inventory/warehouses");
    return { ok: true, id: created.id };
  } catch (e) {
    if (isUniqueError(e)) return { ok: false, error: `Kode gudang "${data.code}" sudah ada.` };
    throw e;
  }
}

export async function deleteWarehouse(id: string): Promise<WarehouseResult> {
  const ctx = await requirePermission("inventory.manage");
  const wh = await prisma.warehouse.findFirst({
    where: { id, companyId: ctx.company.id },
    include: { _count: { select: { items: true, stockMovements: true } } },
  });
  if (!wh) return { ok: false, error: "Gudang tidak ditemukan." };
  if (wh._count.items + wh._count.stockMovements > 0) {
    return { ok: false, error: "Gudang sudah dipakai, tidak bisa dihapus." };
  }
  await prisma.warehouse.delete({ where: { id } });
  revalidatePath("/inventory/warehouses");
  return { ok: true, id };
}

// ============================================================================
// ITEM
// ============================================================================

const itemSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(1, "Kode wajib diisi").max(30),
  name: z.string().trim().min(1, "Nama wajib diisi").max(150),
  categoryId: z.string().optional().nullable(),
  type: z.enum(["INVENTORY", "SERVICE"]).default("INVENTORY"),
  uom: z.string().trim().min(1).max(20).default("PCS"),
  purchasePrice: z.coerce.number().min(0).default(0),
  salePrice: z.coerce.number().min(0).default(0),
  minStock: z.coerce.number().min(0).default(0),
  defaultWarehouseId: z.string().optional().nullable(),
  inventoryAccountId: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export type ItemResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveItem(input: unknown): Promise<ItemResult> {
  const ctx = await requirePermission("inventory.manage");
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;

  try {
    if (data.id) {
      const existing = await prisma.item.findFirst({
        where: { id: data.id, companyId: ctx.company.id },
      });
      if (!existing) return { ok: false, error: "Item tidak ditemukan." };
      await prisma.item.update({
        where: { id: existing.id },
        data: {
          code: data.code,
          name: data.name,
          categoryId: data.categoryId,
          type: data.type,
          uom: data.uom,
          purchasePrice: data.purchasePrice,
          salePrice: data.salePrice,
          minStock: data.minStock,
          defaultWarehouseId: data.defaultWarehouseId,
          inventoryAccountId: data.inventoryAccountId,
          isActive: data.isActive,
        },
      });
      revalidatePath("/inventory/items");
      return { ok: true, id: existing.id };
    }
    const created = await prisma.item.create({
      data: {
        companyId: ctx.company.id,
        code: data.code,
        name: data.name,
        categoryId: data.categoryId,
        type: data.type,
        uom: data.uom,
        purchasePrice: data.purchasePrice,
        salePrice: data.salePrice,
        minStock: data.minStock,
        defaultWarehouseId: data.defaultWarehouseId,
        inventoryAccountId: data.inventoryAccountId,
        isActive: data.isActive,
      },
    });
    revalidatePath("/inventory/items");
    return { ok: true, id: created.id };
  } catch (e) {
    if (isUniqueError(e)) return { ok: false, error: `Kode item "${data.code}" sudah ada.` };
    throw e;
  }
}

export async function toggleItemActive(id: string, isActive: boolean): Promise<ItemResult> {
  const ctx = await requirePermission("inventory.manage");
  const res = await prisma.item.updateMany({
    where: { id, companyId: ctx.company.id },
    data: { isActive },
  });
  if (res.count === 0) return { ok: false, error: "Item tidak ditemukan." };
  revalidatePath("/inventory/items");
  return { ok: true, id };
}

export async function deleteItem(id: string): Promise<ItemResult> {
  const ctx = await requirePermission("inventory.manage");
  const item = await prisma.item.findFirst({
    where: { id, companyId: ctx.company.id },
    include: { _count: { select: { salesInvoiceLines: true, purchaseInvoiceLines: true, stockMovements: true } } },
  });
  if (!item) return { ok: false, error: "Item tidak ditemukan." };
  if (item._count.salesInvoiceLines + item._count.purchaseInvoiceLines + item._count.stockMovements > 0) {
    return { ok: false, error: "Item sudah dipakai transaksi, tidak bisa dihapus." };
  }
  await prisma.item.delete({ where: { id } });
  revalidatePath("/inventory/items");
  return { ok: true, id };
}

// ============================================================================
// STOCK MOVEMENT (manual adjustment / opname)
// ============================================================================

const movementSchema = z.object({
  id: z.string().optional(),
  itemId: z.string().min(1, "Item wajib dipilih"),
  warehouseId: z.string().min(1, "Gudang wajib dipilih"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  direction: z.enum(["IN", "OUT", "ADJUST"]),
  qty: z.coerce.number().min(0.001, "Qty > 0"),
  unitCost: z.coerce.number().min(0).default(0),
  note: z.string().trim().max(500).optional().nullable(),
});

export type MovementResult = { ok: true; id: string } | { ok: false; error: string };

function toDec(v: number | string | null | undefined): Prisma.Decimal {
  const n = typeof v === "string" ? Number(v) : v ?? 0;
  return new Prisma.Decimal(Number.isFinite(n) ? n : 0);
}

export async function saveStockMovement(input: unknown): Promise<MovementResult> {
  const ctx = await requirePermission("inventory.manage");
  const parsed = movementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;
  const date = new Date(`${data.date}T00:00:00.000Z`);

  try {
    const id = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findFirst({
        where: { id: data.itemId, companyId: ctx.company.id },
        select: { id: true, avgCost: true, stockQty: true },
      });
      if (!item) throw new Error("Item tidak ditemukan.");

      const wh = await tx.warehouse.findFirst({
        where: { id: data.warehouseId, companyId: ctx.company.id, isActive: true },
      });
      if (!wh) throw new Error("Gudang tidak ditemukan atau tidak aktif.");

      const qty = toDec(data.qty);
      const unitCost = toDec(data.unitCost);
      const totalCost = money(qty.times(unitCost));

      // ambil balanceQty terakhir
      const lastMove = await tx.stockMovement.findFirst({
        where: { itemId: data.itemId, warehouseId: data.warehouseId },
        orderBy: { date: "desc" },
        select: { balanceQty: true },
      });
      const prevBalance = lastMove?.balanceQty ?? new Prisma.Decimal(0);

      let newBalance: Prisma.Decimal;
      if (data.direction === "IN") {
        newBalance = prevBalance.plus(qty);
      } else if (data.direction === "OUT") {
        newBalance = prevBalance.minus(qty);
        if (newBalance.lt(0)) throw new Error("Stok tidak cukup untuk keluar.");
      } else {
        newBalance = qty;
      }

      if (data.id) {
        // update existing - only DRAFT-like; but stockmovement has no status. Disallow edit for simplicity.
        throw new Error("Gerakan stok tidak bisa diubah, hapus dan buat baru.");
      }

      const created = await tx.stockMovement.create({
        data: {
          companyId: ctx.company.id,
          itemId: data.itemId,
          warehouseId: data.warehouseId,
          date,
          direction: data.direction,
          qty,
          unitCost,
          totalCost,
          balanceQty: newBalance,
          note: data.note ?? null,
        },
      });

      // update item avgCost & stockQty (global across warehouses? simplify: update global)
      if (data.direction === "IN" && unitCost.gt(0)) {
        const curQty = item.stockQty;
        const curCost = item.avgCost;
        const totalQty = curQty.plus(qty);
        const newAvg = totalQty.gt(0)
          ? curQty.times(curCost).plus(qty.times(unitCost)).div(totalQty)
          : unitCost;
        await tx.item.update({
          where: { id: item.id },
          data: { stockQty: totalQty, avgCost: newAvg },
        });
      } else if (data.direction === "OUT") {
        await tx.item.update({
          where: { id: item.id },
          data: { stockQty: item.stockQty.minus(qty) },
        });
      } else if (data.direction === "ADJUST") {
        const diff = qty.minus(item.stockQty);
        await tx.item.update({
          where: { id: item.id },
          data: { stockQty: qty },
        });
        // avgCost unchanged
      }

      return created.id;
    });

    revalidatePath("/inventory/items");
    revalidatePath("/inventory/movements");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan gerakan stok." };
  }
}

export async function deleteStockMovement(id: string): Promise<MovementResult> {
  const ctx = await requirePermission("inventory.manage");
  const mov = await prisma.stockMovement.findFirst({
    where: { id, companyId: ctx.company.id },
    select: { id: true, itemId: true, warehouseId: true, direction: true, qty: true, date: true },
  });
  if (!mov) return { ok: false, error: "Gerakan tidak ditemukan." };

  await prisma.$transaction(async (tx) => {
    // find previous balance
    const prevMove = await tx.stockMovement.findFirst({
      where: {
        itemId: mov.itemId,
        warehouseId: mov.warehouseId,
        date: { lt: mov.date },
      },
      orderBy: { date: "desc" },
      select: { balanceQty: true },
    });
    const prevBalance = prevMove?.balanceQty ?? new Prisma.Decimal(0);

    await tx.stockMovement.delete({ where: { id } });

    // recompute subsequent balances
    const laterMoves = await tx.stockMovement.findMany({
      where: {
        itemId: mov.itemId,
        warehouseId: mov.warehouseId,
        date: { gt: mov.date },
      },
      orderBy: { date: "asc" },
    });

    let running = prevBalance;
    for (const m of laterMoves) {
      let newBal: Prisma.Decimal;
      if (m.direction === "IN") newBal = running.plus(m.qty);
      else if (m.direction === "OUT") newBal = running.minus(m.qty);
      else newBal = m.qty;
      await tx.stockMovement.update({
        where: { id: m.id },
        data: { balanceQty: newBal },
      });
      running = newBal;
    }

    // update item global stockQty (approximate: sum of balances across warehouses)
    const whBalances = await tx.stockMovement.groupBy({
      by: ["warehouseId"],
      where: { itemId: mov.itemId },
      _max: { balanceQty: true },
    });
    const totalQty = whBalances.reduce(
      (a, w) => a.plus(w._max.balanceQty ?? new Prisma.Decimal(0)),
      new Prisma.Decimal(0)
    );
    await tx.item.update({
      where: { id: mov.itemId },
      data: { stockQty: totalQty },
    });
  });

  revalidatePath("/inventory/items");
  revalidatePath("/inventory/movements");
  return { ok: true, id };
}

function money(v: Prisma.Decimal): Prisma.Decimal {
  return v.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}