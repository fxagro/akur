# Arsitektur Akur ERP

Dokumen ini menjelaskan struktur internal Akur ERP: lapisan aplikasi, model data,
alur pencatatan, dan mekanisme otorisasi.

## 1. Prinsip

1. **Modular** — setiap domain bisnis (sales, inventory, tax, bank, assets) berada di
   package/modul sendiri dengan batas yang jelas lewat `@akur/core`.
2. **Double-entry Indonesia** — semua transaksi bernilai menghasilkan jurnal berpasangan
   dengan kode akun mengikuti PSAK/SAK EMKM.
3. **Multi-company** — setiap tabel bisnis mengikat `companyId`; sesi pengguna aktif
   menentukan perusahaan yang sedang digunakan.
4. **Server-side** — seluruh akses tulis lewat Server Actions yang memvalidasi input
   (Zod) dan permission sebelum menyentuh database.

## 2. Lapisan

```
┌──────────────────────────────────────────────────────────┐
│  src/app/            Halaman (App Router)                 │
│    (auth)/login      Login                                │
│    (app)/*           Aplikasi setelah login (RBAC per page)│
│    home/             Landing page publik                   │
├──────────────────────────────────────────────────────────┤
│  src/components/     Komponen React ("use client")        │
├──────────────────────────────────────────────────────────┤
│  src/lib/actions/    Server Actions (validasi + izin)    │
├──────────────────────────────────────────────────────────┤
│  src/lib/accounting/ Posting otomatis & laporan keuangan  │
├──────────────────────────────────────────────────────────┤
│  src/lib/prisma.ts   Klien Prisma (driver adapter pg)    │
├──────────────────────────────────────────────────────────┤
│  PostgreSQL 16      30 tabel, multi-company               │
└──────────────────────────────────────────────────────────┘

packages/core      @akur/core     shared types, utils, konstanta lokal
packages/registry  @akur/registry katalog modul + installer offline
packages/cli       @akur/cli      `akur` module manager (zero-dependency)
```

Aturan penting:

- `src/lib/accounting/posting.ts` adalah **satu-satunya** tempat jurnal otomatis dibuat.
  Modul lain memanggil `postEntry()`, tidak boleh membuat `journalEntry` langsung.
- Halaman di `src/app/(app)` harus memanggil `requirePermission(...)` di awal.
- Server Action harus memanggil `requirePermission(...)` juga, bukan hanya pagenya.

## 3. Model Data

Ringkasan tabel utama (detail di `prisma/schema.prisma`):

| Kelompok         | Tabel                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| Identitas        | `User`, `Role`, `Permission`, `RolePermission`, `Membership`, `Company`, `Session` |
| Akuntansi        | `Account`, `JournalEntry`, `JournalLine`, `AccountingPeriod`            |
| Sales            | `Customer`, `SalesInvoice`, `SalesInvoiceLine`, `SalesReceipt`, `SalesPaymentAllocation` |
| Pembelian        | `Supplier`, `PurchaseInvoice`, `PurchaseInvoiceLine`, `PurchasePayment`, `PurchasePaymentAllocation` |
| Persediaan       | `Item`, `ItemCategory`, `Warehouse`, `StockMovement`                   |
| Pajak            | `TaxCode`, `TaxInvoice`                                               |
| Kas & Bank       | `BankAccount`, `BankTransaction`                                      |
| Aset Tetap       | `FixedAsset`, `DepreciationEntry`                                     |

Hubungan penting:

- `JournalEntry` punya banyak `JournalLine`; setiap baris menunjuk satu `Account`.
- `JournalLine.debit` dan `credit` bertipe `Decimal(18,2)`; sistem menolak jurnal
  yang tidak balance sebelum disimpan.
- `BankTransaction` **tidak** punya `companyId`; filter perusahaan dilakukan lewat
  relasi `bankAccount.companyId`.
- `Item.inventoryAccountId` → `Account.id` dipakai untuk jurnal persediaan.

## 4. Alur Jurnal Otomatis

```
Dokumen (invoice / receipt / payment / tax / bank / depreciation)
        │
        ▼
  validate (Zod) ──► requirePermission ──► prisma.$transaction
                                              │
                    ┌─────────────────────────┴──────────────────────┐
                    ▼                                                ▼
        postEntry(tx, {...})                        update dokumen & saldo
        (debit = credit, min. 2 baris)            (mis. stok, status, flag)
```

`postEntry()` memvalidasi:

- minimal 2 baris jurnal,
- satu baris tidak boleh berisi debit **dan** kredit sekaligus,
- total debit harus sama dengan total kredit,
- total harus lebih besar dari nol.

Kode akun standar berada di `POSTING_CODES` (`src/lib/accounting/posting.ts`).

## 5. Pelaporan

`src/lib/accounting/reports.ts` menyediakan:

- **Neraca Saldo** — saldo akun per periode, ikut memperhitungkan akun kontra.
- **Laba Rugi** — pendapatan dikurangi beban, dengan penetrate akun kontra.
- **Neraca** — aset = liabilitas + modal, dengan pembanding periode sebelumnya.
- **Arus Kas** — arus kas dari akun kas/ekuivalen kas (subtree akun 1-1000).

## 6. Otorisasi

- `src/lib/auth.ts` manages session cookie (`accurate_session`) memakai token acak
  yang disimpan di tabel `Session`, bukan JWT, sehingga sesi bisa dicabut.
- Password di-hash dengan **bcryptjs**.
- `src/lib/auth-context.ts` menyediakan `requirePermission(permission)` yang:
  1. membaca session cookie,
  2. memuat membership, role, dan permission user,
  3. memilih perusahaan aktif (dari cookie `COMPANY_COOKIE`, default membership pertama),
  4. mengembalikan `AuthContext` = `{ user, isSuperAdmin, company, role, memberships, permissions }`,
  5. mengarahkan ke `/login` bila session invalid, atau ke `/dashboard?error=forbidden`
     bila permission tidak dimiliki.

Permission dikirim ke komponen klien hanya sebagai `Set<string>`, bukan objek
permission lengkap. `can(ctx, code)` selalu `true` untuk super admin.

## 7. Middleware

`src/middleware.ts` memakai konvensi `middleware` (legacy) karena Next.js 16 dengan
konvensi `proxy.ts` menghasilkan manifest middleware kosong pada build standalone.
Middleware hanya memeriksa keberadaan cookie session; otorisasi sebenarnya tetap
dilakukan di `requirePermission()` pada server.

## 8. Monorepo

- `npm workspaces` dengan `packages/*`; `turbo.json` mengatur orkestrasi task
  (`build`, `test`, `lint`, `typecheck`).
- `@akur/core` tidak boleh mengimpor Prisma/Next.js agar bisa dipakai di CLI,
  skrip, dan environment browser.
- `@akur/registry` menyimpan katalog modul (offline-first). Registry online
  (`https://registry.akur.id`) masih dalam rencana.
- `@akur/cli` zero-dependency: parser argumen sendiri, template scaffold digenerate
  di `packages/cli/src/commands/create.ts`.

## 9. Testing

- Unit test memakai `node:test` bawaan Node (tanpa dependency tambahan).
  Contoh: `packages/core/src/__tests__/core.test.ts`.
- Perintah: `npm run test:packages`.
- Before merge: `npm run lint && npm run typecheck && npm run test:packages && npm run build`.
