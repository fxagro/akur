import "server-only";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export type AccountNode = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: "DEBIT" | "CREDIT";
  level: number;
  isGroup: boolean;
  /** saldo akun ini saja (mengikuti saldo normal) */
  own: Prisma.Decimal;
  /** saldo + seluruh turunan */
  total: Prisma.Decimal;
  children: AccountNode[];
};

/**
 * Tanda saldo berdasarkan kelas akun (untuk laporan keuangan).
 * Aset/Beban = debit - kredit; Liabilitas/Ekuitas/Pendapatan = kredit - debit.
 * Akun kontra (mis. akumulasi penyusutan) otomatis mengurangi kelompoknya.
 */
export function typeSigned(
  type: AccountType,
  debit: Prisma.Decimal,
  credit: Prisma.Decimal
): Prisma.Decimal {
  return type === "ASSET" || type === "EXPENSE"
    ? debit.minus(credit)
    : credit.minus(debit);
}

export type BalanceMap = Map<
  string,
  { debit: Prisma.Decimal; credit: Prisma.Decimal }
>;

/** Saldo (debit/kredit) per akun pada rentang tanggal. */
export async function getAccountBalances(
  companyId: string,
  range: { from?: Date; to?: Date } = {}
): Promise<BalanceMap> {
  const dateFilter: Prisma.DateTimeFilter = {};
  if (range.from) dateFilter.gte = range.from;
  if (range.to) dateFilter.lte = range.to;

  const rows = await prisma.journalLine.groupBy({
    by: ["accountId"],
    where: {
      journalEntry: {
        companyId,
        status: "POSTED",
        ...(range.from || range.to ? { date: dateFilter } : {}),
      },
    },
    _sum: { debit: true, credit: true },
  });

  const map: BalanceMap = new Map();
  for (const r of rows) {
    map.set(r.accountId, {
      debit: r._sum.debit ?? new Prisma.Decimal(0),
      credit: r._sum.credit ?? new Prisma.Decimal(0),
    });
  }
  return map;
}

type FlatAccount = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: "DEBIT" | "CREDIT";
  parentId: string | null;
  level: number;
  isGroup: boolean;
};

/**
 * Bangun pohon akun untuk sekumpulan tipe akun, dengan agregasi saldo
 * dari anak ke induk.
 */
export function buildAccountTree(
  accounts: FlatAccount[],
  balances: BalanceMap,
  types: AccountType[]
): { tree: AccountNode[]; total: Prisma.Decimal } {
  const filtered = accounts.filter((a) => types.includes(a.type));
  const included = new Set(filtered.map((a) => a.id));

  const nodeMap = new Map<string, AccountNode>();
  for (const a of filtered) {
    const b = balances.get(a.id);
    const debit = b?.debit ?? new Prisma.Decimal(0);
    const credit = b?.credit ?? new Prisma.Decimal(0);
    nodeMap.set(a.id, {
      id: a.id,
      code: a.code,
      name: a.name,
      type: a.type,
      normalBalance: a.normalBalance,
      level: a.level,
      isGroup: a.isGroup,
      own: typeSigned(a.type, debit, credit),
      total: new Prisma.Decimal(0),
      children: [],
    });
  }

  const roots: AccountNode[] = [];
  for (const a of filtered) {
    const node = nodeMap.get(a.id)!;
    const parent = a.parentId ? nodeMap.get(a.parentId) : undefined;
    if (parent && included.has(parent.id)) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // hitung total (post-order)
  function computeTotal(node: AccountNode): Prisma.Decimal {
    let total = node.own;
    for (const c of node.children) {
      total = total.plus(computeTotal(c));
    }
    node.total = total;
    return total;
  }

  const sortByCode = (nodes: AccountNode[]) => {
    nodes.sort((a, b) => a.code.localeCompare(b.code));
    nodes.forEach((n) => sortByCode(n.children));
  };
  sortByCode(roots);

  let grand = new Prisma.Decimal(0);
  for (const r of roots) grand = grand.plus(computeTotal(r));

  return { tree: roots, total: grand };
}

export async function getCompanyAccounts(companyId: string): Promise<FlatAccount[]> {
  return prisma.account.findMany({
    where: { companyId },
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      normalBalance: true,
      parentId: true,
      level: true,
      isGroup: true,
    },
  });
}

// ============================================================================
// UTILITAS TANGGAL
// ============================================================================

export function parseDay(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export function endOfDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59)
  );
}

export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ============================================================================
// ARUS KAS (metode langsung, dikelompokkan per aktivitas)
// ============================================================================

export type CashFlowGroup = {
  operating: Prisma.Decimal;
  investing: Prisma.Decimal;
  financing: Prisma.Decimal;
};

export type CashFlowResult = {
  opening: Prisma.Decimal;
  closing: Prisma.Decimal;
  groups: CashFlowGroup;
  netChange: Prisma.Decimal;
};

/**
 * Kas diidentifikasi dari akun "1-1000 Kas & Bank" beserta seluruh turunannya.
 */
async function getCashAccountIds(companyId: string): Promise<Set<string>> {
  const accounts = await prisma.account.findMany({
    where: { companyId },
    select: { id: true, code: true, parentId: true },
  });
  const root = accounts.find((a) => a.code === "1-1000");
  const ids = new Set<string>();
  if (!root) {
    // fallback: kode diawali 1-1
    for (const a of accounts) if (a.code.startsWith("1-1")) ids.add(a.id);
    return ids;
  }
  const childrenOf = new Map<string, string[]>();
  for (const a of accounts) {
    if (a.parentId) {
      const arr = childrenOf.get(a.parentId) ?? [];
      arr.push(a.id);
      childrenOf.set(a.parentId, arr);
    }
  }
  const stack = [root.id];
  while (stack.length) {
    const id = stack.pop()!;
    ids.add(id);
    for (const c of childrenOf.get(id) ?? []) stack.push(c);
  }
  return ids;
}

export async function getCashFlow(
  companyId: string,
  range: { from: Date; to: Date }
): Promise<CashFlowResult> {
  const cashIds = await getCashAccountIds(companyId);

  const lines = await prisma.journalLine.findMany({
    where: {
      journalEntry: {
        companyId,
        status: "POSTED",
        date: { gte: range.from, lte: range.to },
      },
      OR: [{ accountId: { in: Array.from(cashIds) } }],
    },
    select: {
      journalEntryId: true,
      accountId: true,
      debit: true,
      credit: true,
      account: { select: { type: true } },
    },
  });

  // kumpulkan per jurnal, hanya yang menyentuh kas
  const cashEntryIds = new Set(lines.map((l) => l.journalEntryId));
  const allLines = await prisma.journalLine.findMany({
    where: { journalEntryId: { in: Array.from(cashEntryIds) } },
    select: { journalEntryId: true, accountId: true, debit: true, credit: true, account: { select: { type: true } } },
  });

  const byEntry = new Map<string, typeof allLines>();
  for (const l of allLines) {
    const arr = byEntry.get(l.journalEntryId) ?? [];
    arr.push(l);
    byEntry.set(l.journalEntryId, arr);
  }

  const groups: CashFlowGroup = {
    operating: new Prisma.Decimal(0),
    investing: new Prisma.Decimal(0),
    financing: new Prisma.Decimal(0),
  };

  for (const [entryId, entryLines] of byEntry) {
    const cashNet = entryLines
      .filter((l) => cashIds.has(l.accountId))
      .reduce((a, l) => a.plus(l.debit).minus(l.credit), new Prisma.Decimal(0));
    if (cashNet.isZero()) continue;

    const nonCash = entryLines.filter((l) => !cashIds.has(l.accountId));
    const types = new Set(nonCash.map((l) => l.account.type));

    if (types.has("REVENUE") || types.has("EXPENSE")) {
      groups.operating = groups.operating.plus(cashNet);
    } else if (types.has("LIABILITY") || types.has("EQUITY")) {
      groups.financing = groups.financing.plus(cashNet);
    } else {
      groups.investing = groups.investing.plus(cashNet);
    }
    void entryId;
  }

  const openingRows = await prisma.journalLine.aggregate({
    where: {
      accountId: { in: Array.from(cashIds) },
      journalEntry: {
        companyId,
        status: "POSTED",
        date: { lt: range.from },
      },
    },
    _sum: { debit: true, credit: true },
  });
  const opening = (openingRows._sum.debit ?? new Prisma.Decimal(0)).minus(
    openingRows._sum.credit ?? new Prisma.Decimal(0)
  );

  const netChange = groups.operating
    .plus(groups.investing)
    .plus(groups.financing);

  return {
    opening,
    closing: opening.plus(netChange),
    groups,
    netChange,
  };
}
