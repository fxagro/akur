import test from "node:test";
import assert from "node:assert/strict";

import {
  applyFilters,
  buildQueryString,
  camelCase,
  capitalize,
  debounce,
  formatBytes,
  generateCode,
  generateId,
  generateOtp,
  groupBy,
  kebabCase,
  maskEmail,
  maskPhone,
  omit,
  parseQueryString,
  pick,
  pluralize,
  slugify,
  snakeCase,
  sortBy,
  throttle,
  truncate,
} from "../index";

test("generateId menghasilkan id unik dan terurut", () => {
  const ids = new Set(Array.from({ length: 500 }, () => generateId()));
  assert.equal(ids.size, 500);
  assert.equal(generateId().length, 26);
});

test("generateCode mempadding nomor urut", () => {
  assert.equal(generateCode("INV", 7), "INV-0007");
  assert.equal(generateCode("JV", 123, 6), "JV-000123");
});

test("slugify membersihkan karakter khusus", () => {
  assert.equal(slugify("PT Sumber Berkah Nusantara!"), "pt-sumber-berkah-nusantara");
  assert.equal(slugify("  Kas & Bank  "), "kas-bank");
});

test("truncate memotong dan menambahkan elipsis", () => {
  assert.equal(truncate("Pendek", 10), "Pendek");
  assert.equal(truncate("Penjualan panjang", 10), "Penjual...");
  assert.equal(truncate("abcdefghijkl", 10), "abcdefg...");
});

test("perbandingan nama string", () => {
  assert.equal(capitalize("AKUR"), "Akur");
  assert.equal(camelCase("nama pelanggan"), "namaPelanggan");
  assert.equal(snakeCase("namaPelanggan"), "nama_pelanggan");
  assert.equal(kebabCase("namaPelanggan"), "nama-pelanggan");
});

test("pluralize mengikuti jumlah", () => {
  assert.equal(pluralize(1, "aset"), "aset");
  assert.equal(pluralize(2, "aset"), "aset");
  assert.equal(pluralize(0, "aset"), "aset");
  assert.equal(pluralize(2, "aset", "aset-fixed"), "aset-fixed");
});

test("masking kontak", () => {
  assert.equal(maskEmail("budi@contoh.co.id"), "bu***@contoh.co.id");
  assert.equal(maskEmail("a@contoh.co.id"), "a***@contoh.co.id");
  assert.equal(maskPhone("081234567890"), "08****90");
});

test("generateOtp menghasilkan digit sepanjang length", () => {
  const otp = generateOtp(6);
  assert.equal(otp.length, 6);
  assert.match(otp, /^\d{6}$/);
});

test("formatBytes", () => {
  assert.equal(formatBytes(0), "0 Bytes");
  assert.equal(formatBytes(1024), "1 KB");
  assert.equal(formatBytes(1536), "1.5 KB");
});

test("sortBy mengurutkan angka dan string", () => {
  const rows = [{ n: 10 }, { n: 2 }, { n: 33 }];
  assert.deepEqual(
    sortBy(rows, { field: "n", direction: "asc" }).map((r) => r.n),
    [2, 10, 33]
  );
  assert.deepEqual(
    sortBy(rows, { field: "n", direction: "desc" }).map((r) => r.n),
    [33, 10, 2]
  );
});

test("applyFilters mendukung operator perbandingan dan teks", () => {
  const rows = [
    { name: "Sewa Kantor", price: 1000 },
    { name: "Gaji", price: 5000 },
    { name: "Listrik", price: 1500 },
  ];

  const gt = applyFilters(rows, [{ field: "price", operator: "gt", value: 1200 }]);
  assert.deepEqual(gt.map((r) => r.name), ["Gaji", "Listrik"]);

  const contains = applyFilters(rows, [
    { field: "name", operator: "contains", value: "rik" },
  ]);
  assert.deepEqual(contains.map((r) => r.name), ["Listrik"]);

  const inList = applyFilters(rows, [
    { field: "name", operator: "in", value: ["Gaji", "Sewa Kantor"] },
  ]);
  assert.deepEqual(inList.map((r) => r.name), ["Sewa Kantor", "Gaji"]);

  const notIn = applyFilters(rows, [
    { field: "name", operator: "notIn", value: ["Gaji"] },
  ]);
  assert.equal(notIn.length, 2);
});

test("groupBy mengelompokkan data", () => {
  const grouped = groupBy([{ t: "A" }, { t: "B" }, { t: "A" }], "t");
  assert.equal(grouped["A"]?.length, 2);
  assert.equal(grouped["B"]?.length, 1);
});

test("omit dan pick memilih properti", () => {
  const obj = { a: 1, b: 2, c: 3 };
  assert.deepEqual(omit(obj, ["b"]), { a: 1, c: 3 });
  assert.deepEqual(pick(obj, ["a", "c"]), { a: 1, c: 3 });
});

test("parse dan build query string", () => {
  assert.deepEqual(parseQueryString("a=1&b=2"), { a: "1", b: "2" });
  assert.equal(buildQueryString({ a: "1", b: undefined, c: "" }), "a=1");
});

test("debounce hanya memanggil fungsi terakhir", async () => {
  let calls = 0;
  const fn = debounce(() => {
    calls += 1;
  }, 20);
  fn();
  fn();
  fn();
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(calls, 1);
});

test("throttle membatasi frekuensi", async () => {
  let calls = 0;
  const fn = throttle(() => {
    calls += 1;
  }, 40);
  fn();
  fn();
  fn();
  assert.equal(calls, 1);
  await new Promise((r) => setTimeout(r, 80));
  fn();
  assert.equal(calls, 2);
});
