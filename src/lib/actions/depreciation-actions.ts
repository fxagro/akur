"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-context";
import { Prisma } from "@/generated/prisma/client";
import { postEntry } from "@/lib/accounting/posting";

const depreciationRunSchema = z.object({
  periodDate: z.string().min(1, "Periode wajib diisi"),
  assetIds: z.array(z.string()).min(1, "Pilih minimal 1 aset"),
});

export type DepreciationResult =
  | { ok: true; count: number; journalIds: string[] }
  | { ok: false; error: string };

function toDec(v: number | string | null | undefined): Prisma.Decimal {
  const n = typeof v === "string" ? Number(v) : v ?? 0;
  return new Prisma.Decimal(Number.isFinite(n) ? n : 0);
}

function monthDiff(d1: Date, d2: Date): number {
  return (
    (d1.getUTCFullYear() - d2.getUTCFullYear()) * 12 +
    (d1.getUTCMonth() - d2.getUTCMonth())
  );
}

async function requireAccountsByCode(
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

async function requireAccountId(
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

export async function getAssetsForDepreciation(periodDate: string) {
  const ctx = await requirePermission("asset.view");
  const period = new Date(`${periodDate}-01T00:00:00.000Z`);
  const periodEnd = new Date(
    Date.UTC(period.getUTCFullYear(), period.getUTCMonth() + 1, 0, 23, 59, 59)
  );

  const assets = await prisma.fixedAsset.findMany({
    where: { companyId: ctx.company.id, status: "ACTIVE" },
    select: {
      id: true,
      code: true,
      name: true,
      acquisitionDate: true,
      acquisitionCost: true,
      usefulLifeMonths: true,
      salvageValue: true,
      method: true,
      accumulatedDepreciation: true,
      bookValue: true,
    },
  });

  let total = new Prisma.Decimal(0);
  const rows = assets
    .filter((a) => new Date(a.acquisitionDate) <= periodEnd)
    .map((asset) => {
      const depreciableBase = toDec(asset.acquisitionCost).minus(
        toDec(asset.salvageValue)
      );
      let depAmount = new Prisma.Decimal(0);
      if (asset.usefulLifeMonths > 0) {
        if (asset.method === "STRAIGHT_LINE") {
          depAmount = depreciableBase.div(asset.usefulLifeMonths);
        } else {
          depAmount = toDec(asset.bookValue).times(
            new Prisma.Decimal(2).div(asset.usefulLifeMonths)
          );
        }
      }
      total = total.plus(depAmount);
      return {
        ...asset,
        acquisitionCost: asset.acquisitionCost.toString(),
        bookValue: asset.bookValue.toString(),
        monthlyDepreciation: depAmount.toFixed(2),
      };
    });

  return { assets: rows, total: total.toFixed(2) };
}

export async function runDepreciation(
  input: unknown
): Promise<DepreciationResult> {
  const ctx = await requirePermission("asset.manage");
  const parsed = depreciationRunSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid",
    };
  }
  const { periodDate, assetIds } = parsed.data;
  const period = new Date(`${periodDate}-01T00:00:00.000Z`);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const assets = await tx.fixedAsset.findMany({
        where: {
          id: { in: assetIds },
          companyId: ctx.company.id,
          status: "ACTIVE",
        },
        select: {
          id: true,
          code: true,
          name: true,
          acquisitionDate: true,
          acquisitionCost: true,
          usefulLifeMonths: true,
          salvageValue: true,
          method: true,
          accumulatedDepreciation: true,
          bookValue: true,
          assetAccountId: true,
          accumDepAccountId: true,
          depExpenseAccountId: true,
          disposedAt: true,
        },
      });

      const periodStart = new Date(
        Date.UTC(period.getUTCFullYear(), period.getUTCMonth(), 1)
      );
      const periodEnd = new Date(
        Date.UTC(period.getUTCFullYear(), period.getUTCMonth() + 1, 0, 23, 59, 59)
      );

      const existing = await tx.depreciationEntry.findMany({
        where: {
          fixedAssetId: { in: assetIds },
          periodDate: { gte: periodStart, lte: periodEnd },
        },
        select: { fixedAssetId: true },
      });
      const alreadyDone = new Set(existing.map((d) => d.fixedAssetId));

      const journalIds: string[] = [];
      let processed = 0;

      for (const asset of assets) {
        if (alreadyDone.has(asset.id)) continue;
        if (asset.disposedAt && asset.disposedAt <= periodEnd) continue;

        const acquisitionDate = new Date(asset.acquisitionDate);
        if (acquisitionDate > periodEnd) continue;

        const monthsElapsed = monthDiff(periodEnd, acquisitionDate);
        if (monthsElapsed <= 0) continue;

        let depAmount: Prisma.Decimal;
        const depreciableBase = toDec(asset.acquisitionCost).minus(
          toDec(asset.salvageValue)
        );
        const totalMonths = asset.usefulLifeMonths;

        if (asset.method === "STRAIGHT_LINE") {
          depAmount = depreciableBase.div(totalMonths);
        } else {
          depAmount = toDec(asset.bookValue).times(
            new Prisma.Decimal(2).div(totalMonths)
          );
          const remainingDepreciable = toDec(asset.bookValue).minus(
            toDec(asset.salvageValue)
          );
          if (depAmount.gt(remainingDepreciable))
            depAmount = remainingDepreciable;
        }

        if (depAmount.lte(0)) continue;

        const newAccumDep = toDec(asset.accumulatedDepreciation).plus(depAmount);
        const newBookValue = toDec(asset.acquisitionCost).minus(newAccumDep);
        if (newBookValue.lt(toDec(asset.salvageValue))) {
          const excess = toDec(asset.salvageValue).minus(newBookValue);
          depAmount = depAmount.plus(excess);
        }

        const depAmountNum = depAmount.toNumber();
        const debitVal = depAmountNum;
        const creditVal = depAmountNum;

        const codes = await requireAccountsByCode(tx, ctx.company.id, [
          "6-1600",
          "1-5210",
        ]);
        const expenseAccId =
          codes.get("6-1600") ??
          (await requireAccountId(tx, ctx.company.id, "6-1600"));
        const accumAccId =
          codes.get("1-5210") ??
          (await requireAccountId(tx, ctx.company.id, "1-5210"));

        const periodEndDate = new Date(
          Date.UTC(
            period.getUTCFullYear(),
            period.getUTCMonth() + 1,
            0,
            23,
            59,
            59
          )
        );

        const journalLines = [
          {
            accountId: expenseAccId,
            description: `Beban penyusutan ${asset.code}`,
            debit: debitVal,
          },
          {
            accountId: accumAccId,
            description: `Akumulasi penyusutan ${asset.code}`,
            credit: creditVal,
          },
        ];

        const entryId = await postEntry(tx, {
          companyId: ctx.company.id,
          userId: ctx.user.id,
          date: periodEndDate,
          description: `Penyusutan ${asset.code} - ${asset.name} (${period.getUTCFullYear()}-${String(
            period.getUTCMonth() + 1
          ).padStart(2, "0")})`,
          sourceType: "DEPRECIATION",
          sourceId: asset.id,
          lines: journalLines,
        } as any);

        await tx.fixedAsset.update({
          where: { id: asset.id },
          data: {
            accumulatedDepreciation: { increment: depAmountNum },
            bookValue: { decrement: depAmountNum },
          } as any,
        });

        const depreciationData: Prisma.DepreciationEntryCreateInput = {
          fixedAsset: { connect: { id: asset.id } },
          periodDate: periodStart,
          amount: depAmount,
          journalEntry: { connect: { id: entryId } },
        };
        await tx.depreciationEntry.create({
          data: depreciationData,
        });

        journalIds.push(entryId);
        processed++;
      }

      return { count: processed, journalIds };
    });

    revalidatePath("/assets");
    revalidatePath("/assets/depreciation");
    revalidatePath("/ledger");
    return { ok: true, count: result.count, journalIds: result.journalIds };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Gagal menghitung penyusutan.",
    };
  }
}
