import test from "node:test";
import assert from "node:assert/strict";

import { parseArgs } from "../index";

test("parseArgs membaca perintah dan argumen posisional", () => {
  const parsed = parseArgs(["module:install", "@akur/tax"]);
  assert.equal(parsed.command, "module:install");
  assert.deepEqual(parsed.positional, ["@akur/tax"]);
  assert.deepEqual(parsed.flags, {});
});

test("parseArgs membaca flag dengan nilai", () => {
  const parsed = parseArgs(["module:create", "blog", "--type", "community", "--dir", "D:/modul"]);
  assert.equal(parsed.command, "module:create");
  assert.deepEqual(parsed.positional, ["blog"]);
  assert.equal(parsed.flags.type, "community");
  assert.equal(parsed.flags.dir, "D:/modul");
});

test("parseArgs membaca flag boolean", () => {
  const parsed = parseArgs(["module:list", "--all"]);
  assert.equal(parsed.command, "module:list");
  assert.equal(parsed.flags.all, true);
});

test("parseArgs mendukung nilai inline", () => {
  const parsed = parseArgs(["module:create", "blog", "--type=community"]);
  assert.equal(parsed.flags.type, "community");
});

test("parseArgs mendukung flag pendek", () => {
  const parsed = parseArgs(["init", "-n", "Toko Saya"]);
  assert.equal(parsed.command, "init");
  assert.equal(parsed.flags.n, "Toko Saya");
});

test("parseArgs mengembalikan perintah kosong tanpa argumen", () => {
  const parsed = parseArgs([]);
  assert.equal(parsed.command, "");
  assert.deepEqual(parsed.positional, []);
});
