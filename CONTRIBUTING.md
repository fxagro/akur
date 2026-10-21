# Contributing to Akur ERP

Terima kasih atas minat Anda berkontribusi pada Akur ERP! 🎉

## 📋 Daftar Isi

- [Code of Conduct](#code-of-conduct)
- [Menyiapkan Lingkungan](#menyiapkan-lingkungan)
- [Alur Kerja](#alur-kerja)
- [Standar Kode](#standar-kode)
- [Format Commit](#format-commit)
- [Proses Pull Request](#proses-pull-request)
- [Pengembangan Modul](#pengembangan-modul)
- [Pengujian](#pengujian)
- [Dokumentasi](#dokumentasi)

## 🤝 Code of Conduct

Dengan berpartisipasi, Anda agree dengan [Code of Conduct](CODE_OF_CONDUCT.md).
Silakan baca sebelum berkontribusi.

## 🚀 Menyiapkan Lingkungan

### Prasyarat

- Node.js >= 20.11 (disarankan 22 atau 24)
- npm >= 10
- PostgreSQL 16+
- Git

### Setup

```bash
git clone https://github.com/fxagro/akur.git
cd akur

npm install
cp .env.example .env       # isi DATABASE_URL & AUTH_SECRET

npm run db:deploy          # jalankan migrasi
npm run db:seed            # isi data awal (COA, role, admin)

npm run dev
```

## 🔄 Alur Kerja

### Nama Branch

- `feature/<modul>/<deskripsi>` — fitur baru
- `fix/<modul>/<deskripsi>` — perbaikan bug
- `docs/<deskripsi>` — pembaruan dokumentasi
- `refactor/<modul>/<deskripsi>` — refactoring
- `test/<modul>/<deskripsi>` — penambahan test
- `chore/<deskripsi>` — tugas pemeliharaan

### Alur Branch

1. Buat branch fitur dari `main`
2. Kerjakan perubahan beserta test
3. Jalankan lint, typecheck, dan test
4. Push branch dan buka Pull Request
5. Tutupi komentar review
6. Squash and merge

## 📝 Standar Kode

### TypeScript

- **Strict mode** aktif
- **Hindari `any`** — gunakan tipe konkret atau `unknown`
- **Tipe eksplisit** pada parameter & nilai balik fungsi publik
- **Naming**: PascalCase untuk type/interface, camelCase untuk variabel/fungsi
- `@akur/core` tidak boleh mengimpor Prisma atau Next.js

### Gaya Kode

- **ESLint**: konfigurasi Next.js + aturan custom di `eslint.config.mjs`
- **Import**: dikelompokkan (eksternal → internal → relatif)
- **Export**: named export, default export hanya untuk satu nilai utama

### Struktur Berkas

```
src/
├── app/                    # Halaman (Next.js App Router)
├── components/             # Komponen React bersama
├── lib/
│   ├── accounting/         # Jurnal, posting otomatis, laporan
│   ├── actions/            # Server Actions
│   ├── auth.ts             # Session
│   ├── auth-context.ts     # requirePermission
│   └── prisma.ts           # Klien Prisma
└── middleware.ts           # Proteksi route
```

### Aturan Penting

1. Semua Server Action **wajib** memanggil `requirePermission(...)`.
2. Semua query **wajib** dibatasi `companyId: ctx.company.id`.
3. Input divalidasi dengan Zod sebelum menyentuh database.
4. Jurnal akuntansi hanya boleh dibuat lewat `postEntry()` di
   `src/lib/accounting/posting.ts`.
5. Setelah menulis data, panggil `revalidatePath()`.

## 📝 Format Commit

Mengikuti [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <deskripsi>
```

### Tipe

- `feat` — fitur baru
- `fix` — perbaikan bug
- `docs` — dokumentasi saja
- `style` — format kode
- `refactor` — restrukturisasi kode
- `perf` — perbaikan performa
- `test` — penambahan test
- `chore` — pemeliharaan
- `revert` — membatalkan commit sebelumnya

### Contoh

```
feat(accounting): tambah pembalikan jurnal
fix(bank): filter transaksi berdasarkan perusahaan
docs(readme): perbarui cara Contribute
refactor(core): pisahkan helper tanggal
test(core): tambah test untuk applyFilters
chore(deps): perbarui prisma ke 7.10.1
```

## 🔄 Proses Pull Request

### Sebelum mengirim

- [ ] `npm run lint` lolos
- [ ] `npm run typecheck` lolos
- [ ] `npm run typecheck --workspaces` lolos
- [ ] `npm run test:packages` lolos
- [ ] `npm run build` sukses
- [ ] Sudah melakukan self-review
- [ ] Dokumentasi diperbarui bila perlu

### Proses Review

1. Pemeriksaan otomatis (lint, typecheck, test)
2. Review oleh maintainer
3. Perbaikan umpan balik
4. Approve dan merge (squash)

## 📦 Pengembangan Modul

Panduan lengkap ada di [docs/module-development.md](docs/module-development.md).

### Membuat Modul Baru

```bash
npx akur module:create my-module --type community --dir ./packages
```

### Aturan Modul

1. **Tanggung jawab tunggal** — satu modul, satu domain
2. **Dependency internal** — gunakan `@akur/core` untuk tipe & utilitas bersama
3. **Server Actions** — awali dengan `"use server"`
4. **Validasi** — skema Zod untuk semua input
5. **Permission** — periksa permission di setiap action
6. **Revalidasi** — panggil `revalidatePath()` setelah mutasi
7. **Error handling** — kembalikan `{ ok: true } | { ok: false; error: string }`

## 🧪 Pengujian

```bash
npm run test:packages                       # semua package
npm run test --workspace=@akur/core         # satu package
npm run test --workspace=@akur/registry
```

Test memakai `node:test` bawaan Node — tanpa dependency tambahan.

```ts
import test from "node:test";
import assert from "node:assert/strict";

test("contoh", () => {
  assert.equal(1 + 1, 2);
});
```

### Panduan Test

- **Unit test** untuk logika bisnis murni (fungsi tanpa akses database)
- **Test integrasi** untuk Server Action membutuhkan database uji
- Target cakupan: > 80% untuk kode baru

## 📚 Dokumentasi

### Standar Dokumentasi

- **JSDoc** untuk API publik di `@akur/core`
- **README.md** untuk setiap modul
- Diagram arsitektur berupa teks di `docs/architecture.md`

### Memperbarui Dokumentasi

1. Perbarui file `.md` terkait
2. Perbarui `CHANGELOG.md` untuk perubahan yang menonjol
3. Buka PR terpisah bila dokumentasi sizable

## 🏷 Versi

Mengikuti [Semantic Versioning](https://semver.org/):

- **MAJOR** — perubahan yang merusak kompatibilitas
- **MINOR** — fitur baru (kompatibel)
- **PATCH** — perbaikan bug (kompatibel)

## 🏷 Proses Rilis

1. Perbarui versi di `package.json`
2. Perbarui `CHANGELOG.md`
3. Buat tag rilis
4. Build & deploy ke produksi
5. Umumkan di GitHub Releases & Discussions

## 🐛 Melaporkan Bug

Buka [GitHub Issues](https://github.com/fxagro/akur/issues) dengan:

```markdown
## Deskripsi
## Langkah Reproduksi
1. ...
## Perilaku yang Diharapkan
## Perilaku Aktual
## Lingkungan
- OS:
- Node:
- Browser:
- Versi Akur:
```

## 💡 Meminta Fitur

Buka [GitHub Discussions](https://github.com/fxagro/akur/discussions) dengan:

```markdown
## Masalah
## Usulan Solusi
## Alternatif yang Dipertimbangkan
```

## 🙏 Pengakuan

Kontributor akan diakui di:

- `CONTRIBUTORS.md`
- Catatan rilis
- Laporan kontribusi tahunan

Terima kasih sudah membuat Akur lebih baik! 🙏
