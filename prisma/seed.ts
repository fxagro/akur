import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ============================================================================
// PERMISSIONS
// ============================================================================
const PERMISSIONS: { code: string; name: string; module: string }[] = [
  { code: "dashboard.view", name: "Lihat Dashboard", module: "dashboard" },

  { code: "account.view", name: "Lihat COA", module: "accounting" },
  { code: "account.manage", name: "Kelola COA", module: "accounting" },
  { code: "journal.view", name: "Lihat Jurnal", module: "accounting" },
  { code: "journal.create", name: "Buat Jurnal", module: "accounting" },
  { code: "journal.post", name: "Posting Jurnal", module: "accounting" },
  { code: "journal.void", name: "Void Jurnal", module: "accounting" },
  { code: "period.close", name: "Tutup Periode", module: "accounting" },
  { code: "report.view", name: "Lihat Laporan Keuangan", module: "report" },

  { code: "customer.view", name: "Lihat Pelanggan", module: "sales" },
  { code: "customer.manage", name: "Kelola Pelanggan", module: "sales" },
  { code: "sales.view", name: "Lihat Penjualan", module: "sales" },
  { code: "sales.manage", name: "Kelola Penjualan", module: "sales" },
  { code: "sales.post", name: "Posting Penjualan", module: "sales" },

  { code: "supplier.view", name: "Lihat Supplier", module: "purchase" },
  { code: "supplier.manage", name: "Kelola Supplier", module: "purchase" },
  { code: "purchase.view", name: "Lihat Pembelian", module: "purchase" },
  { code: "purchase.manage", name: "Kelola Pembelian", module: "purchase" },
  { code: "purchase.post", name: "Posting Pembelian", module: "purchase" },

  { code: "inventory.view", name: "Lihat Persediaan", module: "inventory" },
  { code: "inventory.manage", name: "Kelola Persediaan", module: "inventory" },

  { code: "tax.view", name: "Lihat Pajak", module: "tax" },
  { code: "tax.manage", name: "Kelola Pajak", module: "tax" },

  { code: "bank.view", name: "Lihat Kas & Bank", module: "bank" },
  { code: "bank.manage", name: "Kelola Kas & Bank", module: "bank" },

  { code: "asset.view", name: "Lihat Aset Tetap", module: "asset" },
  { code: "asset.manage", name: "Kelola Aset Tetap", module: "asset" },

  { code: "user.view", name: "Lihat User", module: "admin" },
  { code: "user.manage", name: "Kelola User", module: "admin" },
  { code: "role.manage", name: "Kelola Role", module: "admin" },
  { code: "company.manage", name: "Kelola Perusahaan", module: "admin" },
];

const ROLE_DEFS: {
  name: string;
  description: string;
  permissions: string[] | "*";
}[] = [
  { name: "Owner", description: "Akses penuh", permissions: "*" },
  {
    name: "Admin",
    description: "Administrator tanpa kelola perusahaan",
    permissions: PERMISSIONS.map((p) => p.code).filter(
      (c) => c !== "company.manage"
    ),
  },
  {
    name: "Akuntan",
    description: "Mengelola akuntansi & laporan",
    permissions: [
      "dashboard.view",
      "account.view",
      "account.manage",
      "journal.view",
      "journal.create",
      "journal.post",
      "journal.void",
      "period.close",
      "report.view",
      "customer.view",
      "supplier.view",
      "sales.view",
      "purchase.view",
      "inventory.view",
      "tax.view",
      "tax.manage",
      "bank.view",
      "bank.manage",
      "asset.view",
      "asset.manage",
    ],
  },
  {
    name: "Staf",
    description: "Entri transaksi harian",
    permissions: [
      "dashboard.view",
      "account.view",
      "journal.view",
      "journal.create",
      "report.view",
      "customer.view",
      "customer.manage",
      "sales.view",
      "sales.manage",
      "supplier.view",
      "supplier.manage",
      "purchase.view",
      "purchase.manage",
      "inventory.view",
      "inventory.manage",
      "bank.view",
      "asset.view",
    ],
  },
  {
    name: "Viewer",
    description: "Hanya lihat",
    permissions: PERMISSIONS.filter((p) => p.code.endsWith(".view")).map(
      (p) => p.code
    ),
  },
];

// ============================================================================
// CHART OF ACCOUNTS (standar Indonesia)
// ============================================================================
type CoaDef = {
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  normal: "DEBIT" | "CREDIT";
  group?: boolean;
  parent?: string;
};

const COA: CoaDef[] = [
  { code: "1", name: "ASET", type: "ASSET", normal: "DEBIT", group: true },
  { code: "1-1000", name: "Kas & Bank", type: "ASSET", normal: "DEBIT", group: true, parent: "1" },
  { code: "1-1100", name: "Kas", type: "ASSET", normal: "DEBIT", parent: "1-1000" },
  { code: "1-1200", name: "Bank", type: "ASSET", normal: "DEBIT", parent: "1-1000" },
  { code: "1-2000", name: "Piutang", type: "ASSET", normal: "DEBIT", group: true, parent: "1" },
  { code: "1-2100", name: "Piutang Usaha", type: "ASSET", normal: "DEBIT", parent: "1-2000" },
  { code: "1-2200", name: "Piutang Lain-lain", type: "ASSET", normal: "DEBIT", parent: "1-2000" },
  { code: "1-2300", name: "Cadangan Kerugian Piutang", type: "ASSET", normal: "CREDIT", parent: "1-2000" },
  { code: "1-3000", name: "Persediaan Barang Dagang", type: "ASSET", normal: "DEBIT", parent: "1" },
  { code: "1-4000", name: "Perlengkapan", type: "ASSET", normal: "DEBIT", parent: "1" },
  { code: "1-4500", name: "Sewa Dibayar Dimuka", type: "ASSET", normal: "DEBIT", parent: "1" },
  { code: "1-4900", name: "PPN Masukan", type: "ASSET", normal: "DEBIT", parent: "1" },
  { code: "1-5000", name: "Aset Tetap", type: "ASSET", normal: "DEBIT", group: true, parent: "1" },
  { code: "1-5100", name: "Tanah", type: "ASSET", normal: "DEBIT", parent: "1-5000" },
  { code: "1-5200", name: "Bangunan", type: "ASSET", normal: "DEBIT", parent: "1-5000" },
  { code: "1-5210", name: "Akumulasi Penyusutan Bangunan", type: "ASSET", normal: "CREDIT", parent: "1-5000" },
  { code: "1-5300", name: "Kendaraan", type: "ASSET", normal: "DEBIT", parent: "1-5000" },
  { code: "1-5310", name: "Akumulasi Penyusutan Kendaraan", type: "ASSET", normal: "CREDIT", parent: "1-5000" },
  { code: "1-5400", name: "Peralatan", type: "ASSET", normal: "DEBIT", parent: "1-5000" },
  { code: "1-5410", name: "Akumulasi Penyusutan Peralatan", type: "ASSET", normal: "CREDIT", parent: "1-5000" },

  { code: "2", name: "LIABILITAS", type: "LIABILITY", normal: "CREDIT", group: true },
  { code: "2-1000", name: "Utang Jangka Pendek", type: "LIABILITY", normal: "CREDIT", group: true, parent: "2" },
  { code: "2-1100", name: "Utang Usaha", type: "LIABILITY", normal: "CREDIT", parent: "2-1000" },
  { code: "2-1200", name: "Utang Pajak", type: "LIABILITY", normal: "CREDIT", group: true, parent: "2-1000" },
  { code: "2-1210", name: "PPN Keluaran", type: "LIABILITY", normal: "CREDIT", parent: "2-1200" },
  { code: "2-1220", name: "Utang PPh Pasal 21", type: "LIABILITY", normal: "CREDIT", parent: "2-1200" },
  { code: "2-1230", name: "Utang PPh Pasal 23", type: "LIABILITY", normal: "CREDIT", parent: "2-1200" },
  { code: "2-1240", name: "Utang PPh Pasal 4 Ayat 2", type: "LIABILITY", normal: "CREDIT", parent: "2-1200" },
  { code: "2-1300", name: "Utang Gaji", type: "LIABILITY", normal: "CREDIT", parent: "2-1000" },
  { code: "2-1400", name: "Biaya yang Masih Harus Dibayar", type: "LIABILITY", normal: "CREDIT", parent: "2-1000" },
  { code: "2-1500", name: "Utang Bank Jangka Pendek", type: "LIABILITY", normal: "CREDIT", parent: "2-1000" },
  { code: "2-2000", name: "Utang Jangka Panjang", type: "LIABILITY", normal: "CREDIT", group: true, parent: "2" },
  { code: "2-2100", name: "Utang Bank Jangka Panjang", type: "LIABILITY", normal: "CREDIT", parent: "2-2000" },

  { code: "3", name: "EKUITAS", type: "EQUITY", normal: "CREDIT", group: true },
  { code: "3-1000", name: "Modal Disetor", type: "EQUITY", normal: "CREDIT", parent: "3" },
  { code: "3-2000", name: "Laba Ditahan", type: "EQUITY", normal: "CREDIT", parent: "3" },
  { code: "3-3000", name: "Prive", type: "EQUITY", normal: "DEBIT", parent: "3" },
  { code: "3-4000", name: "Ikhtisar Laba Rugi", type: "EQUITY", normal: "CREDIT", parent: "3" },

  { code: "4", name: "PENDAPATAN", type: "REVENUE", normal: "CREDIT", group: true },
  { code: "4-1000", name: "Pendapatan Penjualan", type: "REVENUE", normal: "CREDIT", parent: "4" },
  { code: "4-1100", name: "Diskon Penjualan", type: "REVENUE", normal: "DEBIT", parent: "4" },
  { code: "4-1200", name: "Retur Penjualan", type: "REVENUE", normal: "DEBIT", parent: "4" },
  { code: "4-2000", name: "Pendapatan Jasa", type: "REVENUE", normal: "CREDIT", parent: "4" },
  { code: "4-9000", name: "Pendapatan Lain-lain", type: "REVENUE", normal: "CREDIT", parent: "4" },

  { code: "5", name: "HARGA POKOK PENJUALAN", type: "EXPENSE", normal: "DEBIT", group: true },
  { code: "5-1000", name: "Harga Pokok Penjualan", type: "EXPENSE", normal: "DEBIT", parent: "5" },

  { code: "6", name: "BEBAN", type: "EXPENSE", normal: "DEBIT", group: true },
  { code: "6-1100", name: "Beban Gaji & Tunjangan", type: "EXPENSE", normal: "DEBIT", parent: "6" },
  { code: "6-1200", name: "Beban Sewa", type: "EXPENSE", normal: "DEBIT", parent: "6" },
  { code: "6-1300", name: "Beban Listrik, Air & Gas", type: "EXPENSE", normal: "DEBIT", parent: "6" },
  { code: "6-1400", name: "Beban Telepon & Internet", type: "EXPENSE", normal: "DEBIT", parent: "6" },
  { code: "6-1500", name: "Beban Perlengkapan", type: "EXPENSE", normal: "DEBIT", parent: "6" },
  { code: "6-1600", name: "Beban Penyusutan", type: "EXPENSE", normal: "DEBIT", parent: "6" },
  { code: "6-1700", name: "Beban Transportasi", type: "EXPENSE", normal: "DEBIT", parent: "6" },
  { code: "6-1800", name: "Beban Pemasaran & Promosi", type: "EXPENSE", normal: "DEBIT", parent: "6" },
  { code: "6-1900", name: "Beban Administrasi & Umum", type: "EXPENSE", normal: "DEBIT", parent: "6" },
  { code: "6-2000", name: "Beban Bunga", type: "EXPENSE", normal: "DEBIT", parent: "6" },
  { code: "6-3000", name: "Beban Pajak Final", type: "EXPENSE", normal: "DEBIT", parent: "6" },
];

function defaultPeriods(year: number) {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return months.map((m, i) => ({
    name: `${year}-${String(i + 1).padStart(2, "0")} ${m}`,
    startDate: new Date(Date.UTC(year, i, 1)),
    endDate: new Date(Date.UTC(year, i + 1, 0, 23, 59, 59)),
    isCurrent: new Date().getUTCFullYear() === year && new Date().getUTCMonth() === i,
  }));
}

async function main() {
  console.log("Seeding...");

  // 1. Permissions
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { name: p.name, module: p.module },
      create: p,
    });
  }
  console.log(`  permissions: ${PERMISSIONS.length}`);

  // 2. Admin user
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@accurate.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Super Admin",
      passwordHash,
      isSuperAdmin: true,
    },
  });
  console.log(`  admin user: ${admin.email}`);

  // 3. Demo company
  const company = await prisma.company.upsert({
    where: { id: "seed-company" },
    update: {},
    create: {
      id: "seed-company",
      name: "PT Demo Sejahtera",
      legalName: "PT Demo Sejahtera",
      npwp: "01.234.567.8-901.000",
      address: "Jl. Contoh No. 1",
      city: "Jakarta",
      province: "DKI Jakarta",
      phone: "021-1234567",
      email: "info@demo.local",
    },
  });
  console.log(`  company: ${company.name}`);

  // 4. Roles (company-scoped)
  const allCodes = PERMISSIONS.map((p) => p.code);
  const roleIdByName = new Map<string, string>();
  for (const def of ROLE_DEFS) {
    const codes = def.permissions === "*" ? allCodes : def.permissions;
    const role = await prisma.role.upsert({
      where: { companyId_name: { companyId: company.id, name: def.name } },
      update: { description: def.description },
      create: {
        companyId: company.id,
        name: def.name,
        description: def.description,
        isSystem: true,
      },
    });
    roleIdByName.set(def.name, role.id);

    const perms = await prisma.permission.findMany({
      where: { code: { in: codes } },
      select: { id: true },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }
  console.log(`  roles: ${ROLE_DEFS.length}`);

  // 5. Membership: admin -> company as Owner
  const ownerRoleId = roleIdByName.get("Owner")!;
  await prisma.membership.upsert({
    where: { userId_companyId: { userId: admin.id, companyId: company.id } },
    update: { roleId: ownerRoleId },
    create: { userId: admin.id, companyId: company.id, roleId: ownerRoleId },
  });
  console.log("  membership: admin -> Owner");

  // 6. Chart of Accounts
  const codeToId = new Map<string, string>();
  for (const a of COA) {
    const parentId = a.parent ? codeToId.get(a.parent) ?? null : null;
    const created = await prisma.account.upsert({
      where: { companyId_code: { companyId: company.id, code: a.code } },
      update: {
        name: a.name,
        type: a.type,
        normalBalance: a.normal,
        isGroup: a.group ?? false,
        parentId,
      },
      create: {
        companyId: company.id,
        code: a.code,
        name: a.name,
        type: a.type,
        normalBalance: a.normal,
        isGroup: a.group ?? false,
        parentId,
      },
    });
    codeToId.set(a.code, created.id);
  }
  console.log(`  accounts: ${COA.length}`);

  // 7. Accounting periods (current & next year)
  const year = new Date().getUTCFullYear();
  for (const y of [year - 1, year, year + 1]) {
    for (const p of defaultPeriods(y)) {
      await prisma.accountingPeriod.upsert({
        where: { companyId_name: { companyId: company.id, name: p.name } },
        update: { isCurrent: p.isCurrent },
        create: {
          companyId: company.id,
          name: p.name,
          startDate: p.startDate,
          endDate: p.endDate,
          isCurrent: p.isCurrent,
        },
      });
    }
  }
  console.log("  accounting periods: 3 tahun");

  // 8. Default tax codes
  const ppnKeluaran = codeToId.get("2-1210");
  const ppnMasukan = codeToId.get("1-4900");
  await prisma.taxCode.upsert({
    where: { companyId_code: { companyId: company.id, code: "PPN-OUT" } },
    update: {},
    create: { companyId: company.id, code: "PPN-OUT", name: "PPN Keluaran 11%", type: "PPN", rate: 0.11, accountId: ppnKeluaran },
  });
  await prisma.taxCode.upsert({
    where: { companyId_code: { companyId: company.id, code: "PPN-IN" } },
    update: {},
    create: { companyId: company.id, code: "PPN-IN", name: "PPN Masukan 11%", type: "PPN", rate: 0.11, accountId: ppnMasukan },
  });
  await prisma.taxCode.upsert({
    where: { companyId_code: { companyId: company.id, code: "PPH21" } },
    update: {},
    create: { companyId: company.id, code: "PPH21", name: "PPh Pasal 21", type: "PPH", rate: 0.05, accountId: codeToId.get("2-1220") },
  });
  console.log("  tax codes: 3");

  // 9. Default warehouse
  await prisma.warehouse.upsert({
    where: { companyId_code: { companyId: company.id, code: "GDG-01" } },
    update: {},
    create: { companyId: company.id, code: "GDG-01", name: "Gudang Utama" },
  });
  console.log("  warehouse: 1");

  console.log("\nSeed selesai.");
  console.log(`  Login: ${adminEmail} / ${adminPassword}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
