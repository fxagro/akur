import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";
import { join, resolve } from "path";

export interface CreateOptions {
  name: string;
  type?: string | boolean;
  dir?: string | boolean;
  flags: Record<string, string | boolean>;
}

function pascal(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

function kebab(name: string): string {
  return name
    .replace(/@[^/]+\//, "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p.toLowerCase())
    .join("-");
}

function camel(name: string): string {
  const p = pascal(name);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

export async function createModule(options: CreateOptions): Promise<void> {
  const rawName = options.name.replace(/^@akur\//, "");
  if (!rawName) {
    console.error("Nama modul wajib diisi. Contoh: akur module:create my-module");
    process.exitCode = 1;
    return;
  }

  const type = typeof options.type === "string" ? options.type : "core";
  const baseDir = typeof options.dir === "string" ? options.dir : process.cwd();
  const modulePath = resolve(baseDir, rawName);
  const pkgName = `@akur/${kebab(rawName)}`;

  if (existsSync(modulePath)) {
    console.error(`Direktori ${modulePath} sudah ada.`);
    process.exitCode = 1;
    return;
  }

  const P = pascal(rawName);
  const K = kebab(rawName);
  const C = camel(rawName);

  mkdirSync(join(modulePath, "src", "types"), { recursive: true });
  mkdirSync(join(modulePath, "src", "lib"), { recursive: true });
  mkdirSync(join(modulePath, "src", "actions"), { recursive: true });
  mkdirSync(join(modulePath, "src", "components"), { recursive: true });
  mkdirSync(join(modulePath, "prisma"), { recursive: true });
  mkdirSync(join(modulePath, "tests"), { recursive: true });

  writeFileSync(
    join(modulePath, "package.json"),
    JSON.stringify(
      {
        name: pkgName,
        version: "0.1.0",
        private: true,
        description: `Modul ${P} untuk Akur ERP`,
        main: "dist/index.js",
        types: "dist/index.d.ts",
        exports: {
          ".": { types: "./dist/index.d.ts", import: "./dist/index.js", default: "./dist/index.js" },
          "./lib/*": "./dist/lib/*.js",
        },
        scripts: {
          build: "tsc",
          dev: "tsc --watch",
          typecheck: "tsc --noEmit",
          lint: "eslint src --ext .ts",
          test: "jest",
        },
        akur: {
          tier: type,
          label: P,
          icon: "box",
          sequence: 100,
        },
        dependencies: {
          "@akur/core": "workspace:*",
          zod: "^4.6.7",
        },
        devDependencies: {
          typescript: "^5",
          "@types/node": "^20",
          eslint: "^9",
        },
      },
      null,
      2
    )
  );

  writeFileSync(
    join(modulePath, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          lib: ["ES2022"],
          declaration: true,
          declarationMap: true,
          outDir: "./dist",
          rootDir: "./src",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
          baseUrl: ".",
          paths: { "@akur/core/*": ["../core/src/*"] },
        },
        include: ["src/**/*"],
        exclude: ["node_modules", "dist"],
      },
      null,
      2
    )
  );

  writeFileSync(
    join(modulePath, "src", "index.ts"),
    `export * from "./types";
export * from "./lib";
export * from "./actions";
export { ${P}Client } from "./components/${K}-client";
`
  );

  writeFileSync(
    join(modulePath, "src", "types", "index.ts"),
    `import type { EntityStatus } from "@akur/core/types";

export interface ${P}Item {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ${P}CreateInput {
  code: string;
  name: string;
  description?: string;
}

export interface ${P}UpdateInput extends Partial<${P}CreateInput> {
  id: string;
}

export interface ${P}Filter {
  search?: string;
  status?: EntityStatus;
  page?: number;
  limit?: number;
}
`
  );

  writeFileSync(
    join(modulePath, "src", "lib", "index.ts"),
    `import type { ${P}CreateInput, ${P}UpdateInput } from "../types";

export function validate${P}Create(
  input: ${P}CreateInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!input.code?.trim()) errors.push("Kode wajib diisi");
  if (!input.name?.trim()) errors.push("Nama wajib diisi");
  return { valid: errors.length === 0, errors };
}

export function validate${P}Update(
  input: ${P}UpdateInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!input.id) errors.push("ID wajib diisi");
  return { valid: errors.length === 0, errors };
}
`
  );

  writeFileSync(
    join(modulePath, "src", "actions", "index.ts"),
    `"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  code: z.string().trim().min(1, "Kode wajib diisi").max(30),
  name: z.string().trim().min(1, "Nama wajib diisi").max(150),
  description: z.string().max(500).optional().nullable(),
});

const updateSchema = createSchema.partial().extend({ id: z.string().min(1) });

export type ${P}ActionResult = { ok: true; id: string } | { ok: false; error: string };

export async function create${P}(
  input: unknown
): Promise<${P}ActionResult> {
  const ctx = await requirePermission("${K}.manage");
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;

  const created = await prisma.${C}.create({
    data: { companyId: ctx.company.id, ...data },
  });

  revalidatePath("/${K}");
  return { ok: true, id: created.id };
}

export async function update${P}(
  input: unknown
): Promise<${P}ActionResult> {
  const ctx = await requirePermission("${K}.manage");
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success || !parsed.data.id) {
    return { ok: false, error: "Data tidak valid" };
  }
  const data = parsed.data;

  const existing = await prisma.${C}.findFirst({
    where: { id: data.id, companyId: ctx.company.id },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Data tidak ditemukan" };

  await prisma.${C}.update({
    where: { id: existing.id },
    data: {
      code: data.code,
      name: data.name,
      description: data.description,
    },
  });

  revalidatePath("/${K}");
  return { ok: true, id: existing.id };
}
`
  );

  writeFileSync(
    join(modulePath, "src", "components", `${K}-client.tsx`),
    `"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, EmptyState, Input, Label, Badge } from "@/components/ui";
import { create${P}, update${P} } from "../actions";

export type ${P}Row = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: string;
};

export function ${P}Client({
  rows,
  canManage,
}: {
  rows: ${P}Row[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [form, setForm] = useState<{ id?: string; code: string; name: string; description: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const res = form.id
        ? await update${P}({ id: form.id, code: form.code, name: form.name, description: form.description })
        : await create${P}({ code: form.code, name: form.name, description: form.description });
      if (res.ok) {
        setForm(null);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div>
      {form ? (
        <Card className="mb-4 p-5">
          {error ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Kode</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Kode"
              />
            </div>
            <div>
              <Label>Nama</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={submit}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Simpan
            </button>
            <button
              onClick={() => setForm(null)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700"
            >
              Batal
            </button>
          </div>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title="Belum ada data" description="Belum ada data ${P}." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Kode</th>
                <th className="px-4 py-2.5 font-medium">Nama</th>
                {canManage ? <th className="px-4 py-2.5" /> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{r.code}</td>
                  <td className="px-4 py-2 text-slate-800">{r.name}</td>
                  {canManage ? (
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => setForm({ id: r.id, code: r.code, name: r.name, description: r.description ?? "" })}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Ubah
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
`
  );

  writeFileSync(
    join(modulePath, "prisma", "schema.prisma"),
    `// Skema Prisma untuk modul ${P}
// Tambahkan model di sini lalu jalankan: npx prisma db push
`
  );

  writeFileSync(
    join(modulePath, ".gitignore"),
    `node_modules/
dist/
coverage/
*.tsbuildinfo
`
  );

  writeFileSync(
    join(modulePath, "README.md"),
    `# ${pkgName}

Modul ${P} untuk [Akur ERP](https://github.com/fxagro/akur).

## Instalasi

\`\`\`bash
npm install
npm run build
\`\`\`

## Struktur

\`\`\`
src/
├── index.ts        # export utama
├── types/          # definisi tipe
├── lib/            # fungsi bisnis murni
├── actions/        # Server Actions
└── components/     # komponen React
\`\`\`
`
  );

  writeFileSync(
    join(modulePath, "tests", `${K}.test.ts`),
    `import { validate${P}Create } from "../src/lib";

describe("validate${P}Create", () => {
  it("menolak kode kosong", () => {
    const result = validate${P}Create({ code: "", name: "Test" });
    expect(result.valid).toBe(false);
  });

  it("menerima data valid", () => {
    const result = validate${P}Create({ code: "X-1", name: "Test" });
    expect(result.valid).toBe(true);
  });
});
`
  );

  console.log(`\nModul ${pkgName} berhasil dibuat di: ${modulePath}`);
  console.log(`Tipe: ${type}\n`);
  console.log("Langkah berikutnya:");
  console.log(`  cd ${rawName}`);
  console.log("  npm install");
  console.log("  npm run build\n");
  void readFileSync;
}