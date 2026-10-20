import "dotenv/config";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  validateJournal,
  nextJournalNumber,
  findPeriod,
  toDecimal,
  type JournalLineInput,
} from "../src/lib/accounting/journal";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const company = await prisma.company.findFirstOrThrow();
  const kas = await prisma.account.findFirstOrThrow({
    where: { companyId: company.id, code: "1-1100" },
  });
  const pendapatan = await prisma.account.findFirstOrThrow({
    where: { companyId: company.id, code: "4-1000" },
  });
  console.log("coa ok:", kas.code, "->", pendapatan.code);

  const unbalanced: JournalLineInput[] = [
    { accountId: kas.id, debit: 100, credit: 0, partnerType: "NONE" },
    { accountId: pendapatan.id, debit: 0, credit: 90, partnerType: "NONE" },
  ];
  console.log("validasi tidak balance:", validateJournal(unbalanced) !== null);

  const lines: JournalLineInput[] = [
    { accountId: kas.id, debit: 1_000_000, credit: 0, partnerType: "NONE" },
    { accountId: pendapatan.id, debit: 0, credit: 1_000_000, partnerType: "NONE" },
  ];
  console.log("validasi balance:", validateJournal(lines) === null);

  const date = new Date();

  const entryId = await prisma.$transaction(async (tx) => {
    const number = await nextJournalNumber(tx, company.id, date);
    const period = await findPeriod(tx, company.id, date);
    const entry = await tx.journalEntry.create({
      data: {
        companyId: company.id,
        number,
        date,
        description: "Uji jurnal otomatis",
        reference: "TEST",
        status: "POSTED",
        postedAt: new Date(),
        periodId: period?.id ?? null,
      },
    });
    await tx.journalLine.createMany({
      data: lines.map((l, i) => ({
        journalEntryId: entry.id,
        accountId: l.accountId,
        debit: toDecimal(l.debit),
        credit: toDecimal(l.credit),
        sortOrder: i,
      })),
    });
    const d = lines.reduce((a, l) => a.plus(toDecimal(l.debit)), new Prisma.Decimal(0));
    const c = lines.reduce((a, l) => a.plus(toDecimal(l.credit)), new Prisma.Decimal(0));
    await tx.journalEntry.update({
      where: { id: entry.id },
      data: { totalDebit: d, totalCredit: c },
    });
    console.log("created:", number, "| periode:", period?.name ?? "-");
    return entry.id;
  });

  // ledger aggregation
  const sums = await prisma.journalLine.aggregate({
    where: {
      accountId: kas.id,
      journalEntry: { companyId: company.id, status: "POSTED" },
    },
    _sum: { debit: true, credit: true },
  });
  const net = (sums._sum.debit ?? new Prisma.Decimal(0)).minus(
    sums._sum.credit ?? new Prisma.Decimal(0)
  );
  console.log("saldo Kas (debit-debit):", net.toString());

  await prisma.journalEntry.delete({ where: { id: entryId } });
  console.log("cleanup: ok");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("JOURNAL CHECK FAILED:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
