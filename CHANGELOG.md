# Changelog

Semua perubahan penting pada proyek ini didokumentasikan di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.0.0/),
dan proyek ini memakai [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Monorepo npm workspaces + Turborepo: `@akur/core`, `@akur/registry`, `@akur/cli`
- `@akur/cli` — module manager zero-dependency (`module:list`, `module:create`,
  `module:install`, `module:remove`, `init`, `upgrade`)
- `@akur/registry` — katalog modul Community/Enterprise + installer offline
- Unit test berbasis `node:test` untuk core, registry, dan CLI
- Dokumentasi teknis: `docs/architecture.md`, `docs/module-development.md`,
  `docs/deployment.md`
- Modul Aset Tetap: penyusutan garis lurus & saldo menurun dengan jurnal otomatis
- Modul Pajak: PPN, PPh, faktur pajak masuk/keluar, SPT PPN Masa
- Modul Bank: rekening, transaksi, rekonsiliasi statement
- `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`

### Changed
- Next.js 14 → 16.4 (App Router), React 18 → 19, Tailwind CSS v3 → v4
- Prisma 5 → 7.10 (standalone generator + driver adapter `pg`)
- Skema autentikasi ke session cookie berbasis database (`accurate_session`) +
  bcryptjs + RBAC 31 permission / 5 role
- Lapisan laporan keuangan dipisah ke `src/lib/accounting/`
- `next.config.ts` memakai `output: "standalone"` untuk deployment VPS

### Fixed
- Filter transaksi bank tidak lagi memakai kolom `companyId` yang tidak ada
  (filter sekarang lewat relasi `bankAccount.companyId`)
- Penyusutan aset: `bookValue` & `accumulatedDepreciation` dihitung dari nilai
  absolut, bukan `increment`/`decrement` pada kolom Decimal
- Halaman rekap pajak menampilkan total PPN keluaran
- `BankAccount.code` yang belum pernah dimigrasikan dihapus dari skema agar
  skema dan database sinkron
- Constraint FK `Item.inventoryAccountId` → `Account.id` ditambahkan lewat migrasi

### Security
- Session cookie disetel `HttpOnly`, `SameSite=Lax`, `Secure` pada produksi
- Validasi input Zod pada seluruh Server Action yang menulis data
- Otorisasi based permission dilakukan di Server Action, bukan hanya di halaman

## [0.1.0] - 2026-10-19

### Added
- Rilis pertama Akur ERP
- Akuntansi: COA, Jurnal Umum, Buku Besar, periode closing
- Laporan: Neraca Saldo, Laba Rugi, Neraca, Arus Kas
- Penjualan & Piutang, Pembelian & Utang, Pelanggan, Supplier
- Persediaan: Item, Kategori, Gudang, Kartu Stok, HPP rata-rata
- Pajak: PPN, PPh 21/23/4(2), faktur pajak, SPT PPN Masa
- Kas & Bank, Aset Tetap & Penyusutan
- Multi-perusahaan dengan RBAC
- Autentikasi berbasis session
- Halaman publik (landing page) bilingual Indonesia/Inggris
- Dukungan Docker

[Unreleased]: https://github.com/fxagro/akur/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/fxagro/akur/releases/tag/v0.1.0
