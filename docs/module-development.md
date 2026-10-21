# Pengembangan Modul

Panduan membuat modul baru untuk Akur ERP. Modul adalah unit mandiri yang
menggabungkan tipe, server action, dan (opsional) model database sendiri.

## 1. Prasyarat

```bash
npm install
npm run build:packages
```

## 2. Membuat Modul

```bash
npx akur module:create blog --type community --dir ./packages
```

Opsi:

| Opsi             | Nilai yang tersedia                    | Default   |
| ---------------- | -------------------------------------- | --------- |
| `--type`         | `core`, `community`, `enterprise`      | `community` |
| `--dir`          | direktori target                       | direktori kerja |

Perintah membuat folder `packages/<nama>/` berisi:

```
blog/
├── prisma/schema.prisma
├── src/
│   ├── index.ts
│   ├── types/index.ts
│   ├── lib/index.ts
│   ├── actions/index.ts
│   └── components/blog-client.tsx
├── tests/blog.test.ts
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

## 3. Mendaftarkan Modul di Katalog

Katalog modul berada di `packages/registry/src/catalog.ts`:

```ts
{
  name: "@akur/blog",
  version: "0.1.0",
  description: "Blog & Berita: artikel, kategori, penulis",
  tier: "community",
  tags: ["blog", "content"],
  status: "beta",
}
```

Aturan:

- `name` harus `@akur/<slug-kebab>`.
- `tier` menentukan edisi: `core` (wajib), `community` (gratis), `enterprise` (berlisensi).
- `status`: `stable`, `beta`, `alpha`, atau `planned`.

Setelah mengubah katalog, jalankan:

```bash
npm run build:packages
npx akur module:list
```

## 4. Struktur Package

```json
{
  "name": "@akur/blog",
  "version": "0.1.0",
  "description": "Blog & Berita untuk Akur ERP",
  "license": "MIT",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit",
    "test": "node --import tsx --test \"src/**/*.test.ts\""
  },
  "dependencies": {
    "@akur/core": "*"
  }
}
```

Catatan:

- Dependensi internal memakai versi `*` agar npm workspace menautkan ke paket lokal.
- `tsconfig.build.json` mengecualikan file test dari hasil build; `tsconfig.json`
  dipakai untuk typecheck sehingga test ikut diperiksa.
- Skrip `test` memakai `node:test` bawaan Node — tanpa dependency tambahan.

## 5. Menulis Kode Modul

### 5.1 Tipe & utilitas bersama

```ts
import { formatCurrency, slugify, type SortParams } from "@akur/core";
```

`@akur/core` **dilarang** mengimpor Prisma atau Next.js agar tetap bisa dipakai di
CLI, skrip, dan browser.

### 5.2 Model database

Model modul diletakkan di `prisma/schema.prisma` milik modul. Saat ini seluruh
model Prisma berada dalam satu skema, sehingga tabel modul perlu ditambahkan ke
`prisma/schema.prisma` root dengan awalan nama modul:

```prisma
model BlogPost {
  id        String   @id @default(cuid())
  companyId String
  title     String
  slug      String
  body      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  company   Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([companyId, slug])
  @@index([companyId])
}
```

Setelah mengubah skema:

```bash
npm run db:migrate     # dev: buat migrasi
npm run db:deploy      # prod: jalankan migrasi
npm run db:generate
```

### 5.3 Server Actions

Semua penulisan harus lewat Server Action yang memvalidasi input dan permission:

```ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-context";

const schema = z.object({
  title: z.string().trim().min(3).max(200),
  body: z.string().min(1),
});

export type Result = { ok: true; id: string } | { ok: false; error: string };

export async function savePost(input: unknown): Promise<Result> {
  const ctx = await requirePermission("blog.manage");
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  try {
    const post = await prisma.blogPost.create({
      data: { ...parsed.data, companyId: ctx.company.id },
    });
    revalidatePath("/blog");
    return { ok: true, id: post.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan." };
  }
}
```

Aturan penting:

1. Panggil `requirePermission(...)` **di dalam** action, bukan hanya di halaman.
2. Selalu batasi query dengan `companyId: ctx.company.id`.
3. Validasi input dengan Zod sebelum menyentuh database.
4. Gunakan `revalidatePath()` setelah menulis.
5. Jurnal akuntansi wajib lewat `postEntry()` dari `src/lib/accounting/posting.ts`.

### 5.4 Permission

Tambahkan permission baru di `prisma/seed.ts` (daftar permission) lalu jalankan
`npm run db:seed` atau tambahkan role yang memakai permission tersebut. Permission
dipakai sebagai `requirePermission("blog.view")` / `requirePermission("blog.manage")`.

## 6. Testing

```bash
npm run test:packages                       # semua package
npm run test --workspace=@akur/core         # satu package
```

Gunakan `node:test` + `node:assert/strict`:

```ts
import test from "node:test";
import assert from "node:assert/strict";

test("slug unik", () => {
  assert.equal(slugify("Halo Dunia"), "halo-dunia");
});
```

## 7. Checklist sebelum PR

```bash
npm run lint
npm run typecheck
npm run typecheck --workspaces
npm run test:packages
npm run build
```

- [ ] Modul terdaftar di `packages/registry/src/catalog.ts`
- [ ] Tabel baru punya `companyId` dan index yang sesuai
- [ ] Semua Server Actions memanggil `requirePermission`
- [ ] Ada unit test untuk logika utama
- [ ] README modul menjelaskan cara pakai
