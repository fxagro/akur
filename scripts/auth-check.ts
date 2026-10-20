import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@accurate.local";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("admin user tidak ditemukan");
  console.log("user:", user.email, "superAdmin:", user.isSuperAdmin);

  const ok = await bcrypt.compare("admin123", user.passwordHash);
  console.log("password verify:", ok);
  if (!ok) throw new Error("password tidak cocok");

  const wrong = await bcrypt.compare("salah", user.passwordHash);
  console.log("password reject salah:", wrong === false);

  // simulasi getAuthContext query
  const token = "test-session-" + Date.now();
  await prisma.session.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + 3600_000) },
  });

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          memberships: {
            where: { isActive: true },
            include: {
              company: true,
              role: { include: { rolePermissions: { include: { permission: true } } } },
            },
          },
        },
      },
    },
  });

  if (!session) throw new Error("session gagal dibaca");
  const m = session.user.memberships[0];
  const perms = m.role.rolePermissions.map((rp) => rp.permission.code);
  console.log("active company:", m.company.name);
  console.log("role:", m.role.name, "| permissions:", perms.length);
  console.log("memberships:", session.user.memberships.length);

  await prisma.session.deleteMany({ where: { token } });
  console.log("session cleanup: ok");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("AUTH CHECK FAILED:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
