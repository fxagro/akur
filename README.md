# Akur ERP

**Modular ERP & Akuntansi Open Source untuk Indonesia.** Terinspirasi Odoo, dibangun dengan standar akuntansi Indonesia (PSAK/SAK EMKM), PPN & PPh, multi-gudang, dan pembukuan berpasangan (double-entry) — tanpa biaya langganan per pengguna.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.10-2D374B.svg)](https://www.prisma.io/)

---

## 🚀 Quick Start

```bash
git clone https://github.com/fxagro/akur.git
cd akur

npm install
cp .env.example .env      # sesuaikan DATABASE_URL & AUTH_SECRET

npm run db:deploy         # jalankan migrasi
npm run db:seed           # isi data awal (COA, role, admin)

npm run dev
```

Buka http://localhost:3000 dan masuk dengan:

| Email               | Password    |
| ------------------- | ----------- |
| `admin@accurate.local` | `admin123` |

> Ganti password seed sebelum dipakai di lingkungan produksi.

## 🏗 Struktur Proyek

```
akur/
├── packages/                  # Monorepo workspace (npm workspaces + Turborepo)
│   ├── core/                  # @akur/core     - shared types, utils, konstanta lokal
│   ├── registry/              # @akur/registry - katalog modul & installer
│   └── cli/                   # @akur/cli      - `akur` module manager (zero-dependency)
├── prisma/
│   ├── schema.prisma          # Skema database (30 tabel)
│   ├── migrations/            # Migrasi SQL
│   └── seed.ts                # Data awal
├── scripts/                   # Utilitas operasional (tunnel DB, cek route, dll.)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (app)/             # Halaman setelah login
│   │   ├── (auth)/login/      # Halaman login
│   │   └── home/              # Landing page publik
│   ├── components/            # Komponen React bersama
│   ├── lib/
│   │   ├── accounting/        # Jurnal, posting otomatis, laporan keuangan
│   │   ├── actions/           # Server Actions per modul
│   │   ├── auth.ts            # Session & password hashing
│   │   └── prisma.ts          # Klien Prisma (driver adapter)
│   └── middleware.ts          # Proteksi route
├── docs/                      # Dokumentasi teknis
├── turbo.json
└── package.json               # Root workspace
```

## 📚 Modul

### Community (gratis, open source)

| Modul             | Cakupan                                                    |
| ----------------- | ---------------------------------------------------------- |
| **Accounting**    | COA, Jurnal Umum, Buku Besar,.periode closing              |
| **Reports**       | Neraca Saldo, Laba Rugi, Neraca, Arus Kas                  |
| **Sales & AR**    | Faktur, Penerimaan, Pelanggan, alokasi piutang              |
| **Purchase & AP** | Faktur, Pembayaran, Supplier, alokasi utang                |
| **Inventory**     | Item, Kategori, Gudang, Kartu Stok, HPP rata-rata          |
| **Bank & Cash**   | Rekening, transaksi, rekonsiliasi bank statement           |
| **Tax**           | PPN, PPh 21/23/4(2), faktur pajak, SPT PPN Masa             |
| **Fixed Assets**  | Aset tetap, penyusutan garis lurus & saldo menurun         |

### Enterprise (berlisensi)

HR & Payroll, Manufaktur (BOM/Routing/Work Order), POS, CRM, Project, Multi-currency,
Multi-cabang & konsolidasi, Budgeting, Quality, Maintenance, Fleet, Helpdesk,
 konektor e-commerce, integrasi bank & EDC.

> Daftar modul dan status masing-masing dapat dilihat dengan `npx akur module:list`.

## 🛠 Tech Stack

| Lapisan      | Teknologi                                        |
| ------------ | ------------------------------------------------ |
| Frontend     | Next.js 16 (App Router), React 19, Tailwind v4  |
| Backend      | Next.js Server Actions, Prisma 7.10 (standalone) |
| Database     | PostgreSQL 16                                    |
| Auth         | Session cookie + bcryptjs + RBAC (31 permission) |
| Validasi     | Zod 4                                            |
| Build        | Turborepo + npm workspaces                       |
| Testing      | `node:test` (built-in, tanpa dependency tambahan) |

## 🧪 Development

```bash
npm run dev                # aplikasi Next.js
npm run build              # build produksi
npm run lint               # ESLint
npm run typecheck          # TypeScript (root)
npm run build:packages     # build semua package
npm run test:packages      # test suite packages

npm run typecheck --workspaces   # typecheck per package
npm run build --workspace=@akur/core
```

### Database

```bash
npm run db:generate        # generate Prisma Client
npm run db:migrate         # buat & jalankan migrasi (dev)
npm run db:deploy          # jalankan migrasi (prod)
npm run db:seed            # isi data awal
npm run db:studio          # Prisma Studio
npm run db:tunnel          # tunnel SSH ke DB produksi
```

Prisma 7 memakai `prisma7.config.ts` sebagai file konfigurasi, dan `DATABASE_URL`
dibaca dari `.env`.

## 🧩 Membuat Modul Baru

```bash
npx akur module:create blog --type community --dir ./packages
```

Struktur modul yang dihasilkan:

```
blog/
├── prisma/schema.prisma        # model milik modul
├── src/
│   ├── index.ts                # export utama
│   ├── types/                  # tipe TypeScript
│   ├── lib/                    # helper & query
│   ├── actions/                # Server Actions
│   └── components/             # UI React
├── tests/                      # unit test
├── package.json
└── tsconfig.json
```

Panduan lengkap: [docs/module-development.md](docs/module-development.md).

## 📖 Dokumentasi

- [Arsitektur](docs/architecture.md) — layer, model data, alur jurnal, RBAC
- [Pengembangan Modul](docs/module-development.md) — membuat, mendaftarkan, dan menguji modul
- [Deployment](docs/deployment.md) — Docker, VPS, Nginx, SSL, migrasi
- [Contributing](CONTRIBUTING.md) — alur kontribusi & conventional commits
- [Changelog](CHANGELOG.md)

## 🤝 Berkontribusi

1. Fork repositori ini
2. Buat branch fitur (`git checkout -b feature/nama-fitur`)
3. Commit dengan conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)
4. Push branch, lalu buka Pull Request

Pastikan `npm run lint`, `npm run typecheck`, dan `npm run test:packages` lolos sebelum
mengirim PR. Lihat [CONTRIBUTING.md](CONTRIBUTING.md) untuk detail.

## 📄 Lisensi

MIT — lihat [LICENSE](LICENSE).

## 🙏 Acknowledgments

- [Odoo](https://www.odoo.com/) — inspirasi arsitektur modular ERP
- [Next.js](https://nextjs.org/), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/), [Zod](https://zod.dev/), [Turborepo](https://turborepo.com/)

---

**Dibuat dengan ❤️ untuk Indonesia** 🇮🇩
