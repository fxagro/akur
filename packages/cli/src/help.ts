export const HELP_TEXT = `
Akur CLI - Module Manager untuk Akur ERP (Modular ERP untuk Indonesia)

Penggunaan:
  akur <perintah> [opsi]

Perintah:
  init                        Inisialisasi proyek Akur baru
  module:install <nama>       Install modul dari registry
  module:remove <nama>        Hapus modul yang terinstall
  module:list                 Daftar modul yang tersedia
  module:create <nama>        Buat scaffold modul baru
  upgrade                     Upgrade core & modul

Opsi Umum:
  -h, --help                  Tampilkan bantuan
  -v, --version               Tampilkan versi

Opsi Perintah:
  init:
    -n, --name <nama>         Nama proyek
    -d, --dir <direktori>     Direktori tujuan (default: cwd)

  module:install:
    -v, --version <versi>     Versi modul (default: latest)

  module:remove:
    --force                   Hapus tanpa konfirmasi

  module:list:
    -a, --all                 Tampilkan semua (termasuk enterprise)

  module:create:
    -t, --type <tipe>        Tipe modul: core | enterprise
    -d, --dir <direktori>     Direktori output

Contoh:
  akur init -n my-erp
  akur module:install @akur/hr
  akur module:create my-module --type core
  akur module:list --all
`.trim();