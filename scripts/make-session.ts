import "dotenv/config";
import crypto from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findFirstOrThrow({
    where: { email: "admin@accurate.local" },
  });
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.session.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + 3600_000) },
  });
  console.log(token);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
