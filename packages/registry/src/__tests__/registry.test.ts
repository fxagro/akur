import test from "node:test";
import assert from "node:assert/strict";

import { MODULE_CATALOG, ModuleInstaller, moduleInstaller } from "../index";

test("katalog memuat modul inti, komunitas, dan enterprise", () => {
  const tiers = new Set(MODULE_CATALOG.map((m) => m.tier));
  assert.ok(tiers.has("core"));
  assert.ok(tiers.has("community"));
  assert.ok(tiers.has("enterprise"));
});

test("katalog tidak punya nama modul duplikat", () => {
  const names = MODULE_CATALOG.map((m) => m.name);
  assert.equal(new Set(names).size, names.length);
});

test("setiap modul wajib punya nama, versi, deskripsi, dan tag", () => {
  for (const m of MODULE_CATALOG) {
    assert.match(m.name, /^@akur\/[a-z0-9-]+$/);
    assert.match(m.version, /^\d+\.\d+\.\d+$/);
    assert.ok(m.description.length > 0, `${m.name} tanpa deskripsi`);
    assert.ok(m.tags.length > 0, `${m.name} tanpa tag`);
  }
});

test("pencarian modul memfilter berdasarkan query, tier, dan tag", async () => {
  const installer = new ModuleInstaller();

  const byTier = await installer.searchModules({ tier: "core" });
  assert.ok(byTier.length > 0);
  assert.ok(byTier.every((m) => m.tier === "core"));

  const byTag = await installer.searchModules({ tag: "ppn" });
  assert.ok(byTag.some((m) => m.name === "@akur/tax"));

  const byQuery = await installer.searchModules({ query: "penyusutan" });
  assert.ok(byQuery.some((m) => m.name === "@akur/assets"));

  const limited = await installer.searchModules({ limit: 2 });
  assert.equal(limited.length, 2);
});

test("fetchManifest mengembalikan null untuk modul yang tidak dikenal", async () => {
  const manifest = await moduleInstaller.fetchManifest("@akur/tidak-ada");
  assert.equal(manifest, null);
});

test("instalasi modul yang tidak ditemukan gagal dengan pesan jelas", async () => {
  const result = await moduleInstaller.installModule("@akur/tidak-ada");
  assert.equal(result.success, false);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0]!, /tidak ditemukan/);
});

test("instalasi modul yang ada berhasil dan memberi path package", async () => {
  const result = await moduleInstaller.installModule("@akur/tax");
  assert.equal(result.success, true);
  assert.equal(result.module, "@akur/tax");
  assert.equal(result.path, "packages/tax");
  assert.equal(result.errors.length, 0);
});

test("cek kompatibilitas versi major", async () => {
  const manifest = {
    name: "@akur/contoh",
    version: "2.0.0",
    description: "",
    tier: "community" as const,
    tags: [],
    status: "stable" as const,
  };
  const incompatible = await moduleInstaller.checkCompatibility(manifest, "1.0.0");
  assert.equal(incompatible.compatible, false);
  assert.ok(incompatible.reason);

  const compatible = await moduleInstaller.checkCompatibility(manifest, "2.1.0");
  assert.equal(compatible.compatible, true);
});
