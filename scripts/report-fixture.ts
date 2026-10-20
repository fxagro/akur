import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const COMPANY = "seed-company";
const PREFIX = "RT-";

const D = (s: string) => new Date(`${s}T00:00:00.000Z`);

type Def = {
  number: string;
  date: string;
  description: string;
  lines: Array<[code: string, debit: number, credit: number]>;
};

const DEFS: Def[] = [
  {
    number: "RT-0001",
    date: "2026-03-01",
    description: "Setoran modal awal",
    lines: [["1-1100", 50_000_000, 0], ["3-1000", 0, 50_000_000]],
  },
  {
    number: "RT-0002",
    date: "2026-03-05",
    description: "Penjualan tunai",
    lines: [["1-1100", 11_000_000, 0], ["4-1000", 0, 11_000_000]],
  },
  {
    number: "RT-0003",
    date: "2026-03-10",
    description: "Beli peralatan tunai",
    lines: [["1-5400", 5_000_000, 0], ["1-1100", 0, 5_000_000]],
  },
  {
    number: "RT-0004",
    date: "2026-03-12",
    description: "Bayar gaji karyawan",
    lines: [["6-1100", 3_000_000, 0], ["1-1100", 0, 3_000_000]],
  },
  {
    number: "RT-0005",
    date: "2026-03-15",
    description: "Beli perlengkapan kredit",
    lines: [["1-4000", 2_000_000, 0], ["2-1100", 0, 2_000_000]],
  },
  {
    number: "RT-0006",
    date: "2026-03-31",
    description: "Penyusutan peralatan bulan Maret",
    lines: [["6-1600", 1_000_000, 0], ["1-5410", 0, 1_000_000]],
  },
];

async function cleanup() {
  const entries = await prisma.journalEntry.findMany({
    where: { companyId: COMPANY, number: { startsWith: PREFIX } },
    select: { id: true },
  });
  const ids = entries.map((e) => e.id);
  if (ids.length) {
    await prisma.journalLine.deleteMany({ where: { journalEntryId: { in: ids } } });
    await prisma.journalEntry.deleteMany({ where: { id: { in: ids } } });
  }
  console.log("cleanup: removed", ids.length, "entries");
}

async function create() {
  await cleanup();

  const accounts = await prisma.account.findMany({
    where: { companyId: COMPANY },
    select: { id: true, code: true },
  });
  const byCode = new Map(accounts.map((a) => [a.code, a.id]));

  const admin = await prisma.user.findFirst({ select: { id: true } });
  const period = await prisma.accountingPeriod.findFirst({
    where: { companyId: COMPANY, startDate: { lte: D("2026-03-01") }, endDate: { gte: D("2026-03-15") } },
    select: { id: true },
  });

  for (const def of DEFS) {
    const lines = def.lines.map(([code, debit, credit], i) => {
      const accountId = byCode.get(code);
      if (!accountId) throw new Error(`akun tidak ditemukan: ${code}`);
      return { accountId, debit, credit, sortOrder: i };
    });
    const totalDebit = lines.reduce((a, l) => a + l.debit, 0);
    const totalCredit = lines.reduce((a, l) => a + l.credit, 0);
    if (totalDebit !== totalCredit) throw new Error(`tidak balance: ${def.number}`);

    await prisma.journalEntry.create({
      data: {
        companyId: COMPANY,
        periodId: period?.id ?? null,
        number: def.number,
        date: D(def.date),
        description: def.description,
        status: "POSTED",
        postedAt: new Date(),
        createdById: admin?.id ?? null,
        totalDebit,
        totalCredit,
        lines: { create: lines },
      },
    });
    console.log("created", def.number, def.description);
  }
}

const cmd = process.argv[2] ?? "create";

(cmd === "cleanup" ? cleanup() : create())
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
