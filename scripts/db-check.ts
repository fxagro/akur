import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.$queryRawUnsafe<{ version: string }[]>(
    "select version() as version"
  );
  console.log("DB version:", result[0].version);
  const counts = {
    companies: await prisma.company.count(),
    accounts: await prisma.account.count(),
    users: await prisma.user.count(),
    journalEntries: await prisma.journalEntry.count(),
  };
  console.log("Row counts:", counts);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("DB check failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
