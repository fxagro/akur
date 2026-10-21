export interface RemoveOptions {
  moduleName: string;
  force: boolean;
  flags: Record<string, string | boolean>;
}

export async function removeModule(options: RemoveOptions): Promise<void> {
  const { moduleName, force } = options;

  if (!moduleName) {
    console.error("Nama modul wajib diisi. Contoh: akur module:remove @akur/hr");
    process.exitCode = 1;
    return;
  }

  if (!force) {
    console.log(`\nPERINGATAN: modul ${moduleName} dan seluruh datanya akan dihapus.`);
    console.log("Tindakan ini tidak dapat dibatalkan.");
    console.log("Jalankan ulang dengan --force untuk konfirmasi.\n");
    process.exitCode = 1;
    return;
  }

  console.log(`\nMenghapus modul ${moduleName}...\n`);
  console.log("Langkah yang akan dijalankan:");
  console.log("  1. Copot route modul");
  console.log("  2. Drop tabel database modul");
  console.log("  3. Hapus entri module registry");
  console.log("  4. Bersihkan berkas modul\n");
  console.log("NOTE: penghapusan otomatis belum aktif — langkah di atas simulasi.\n");
}