<p align="center">
  <h1 align="center">🇮🇩 SIM Akur</h1>
  <p align="center"><strong>Sistem Informasi Manajemen Akuntansi & ERP Open Source Cita Rasa Indonesia</strong></p>
  <p align="center">Alternatif Bebas Iuran untuk Accurate Online & Odoo • Standar SAK/PSAK Indonesia • Berpasangan (Double-Entry)</p>
</p>

<p align="center">
  <a href="https://akur.mytriv.com/home"><strong>🌐 Landing Page (akur.mytriv.com/home)</strong></a> •
  <a href="https://ukm.mytriv.com"><strong>☁️ UKM Cloud (ukm.mytriv.com)</strong></a> •
  <a href="https://erp.mytriv.com"><strong>🏢 Enterprise ERP (erp.mytriv.com)</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/Lisensi-MIT-green?style=for-the-badge" alt="License MIT">
</p>

---

## 🎯 Mengapa SIM Akur? (Misi Besar Kita)

Selama bertahun-tahun, bisnis dan praktisi keuangan di Indonesia menghadapi dilema:
1. **Software Luar Negeri (seperti Odoo atau SAP):** Terlalu rumit, arsitektur berat, dan format pelaporan/pajaknya tidak mencerminkan kebiasaan akuntan di Indonesia.
2. **Software Komersial Tertutup (seperti Accurate atau Jurnal):** Biaya langganan bulanan terus meningkat dan membebankan biaya per database/user tambahan bagi UMKM.

**SIM Akur** dibangun sebagai wadah kedaulatan perangkat lunak bisnis nasional. Memanfaatkan momentum *open-source ERP movement*, kami ingin menghadirkan **"Odoo-nya Indonesia"**: software akuntansi dan ERP yang lengkap, transparan, gratis, dan bisa dikembangkan bersama oleh ribuan developer, akuntan, SMK, dan kampus di seluruh Indonesia.

---

## ✨ Fitur Unggulan

SIM Akur dirancang dengan prinsip pembukuan berpasangan (*double-entry*) yang ketat, memastikan integritas data keuangan:

* 📚 **Bagan Akun (COA) Standar Indonesia:** Hierarki akun berjenjang sesuai standar PSAK / SAK EMKM (Kas, Bank, Piutang, Persediaan, Aset Tetap, Utang Usaha, Utang Pajak, Modal, Pendapatan, HPP, dan Beban Operasional).
* 🧾 **Penjualan & Piutang (AR):** Faktur Penjualan (*Sales Invoice*), cetak PDF invoice profesional, penerimaan pelunasan piutang (*Sales Receipt*), dan kartu piutang pelanggan.
* 🛒 **Pembelian & Utang (AP):** Faktur Pembelian (*Purchase Invoice*), tagihan pemasok (*Vendor Bill*), pencatatan pembayaran utang bertahap, dan riwayat mutasi hutang.
* 🇮🇩 **Perpajakan Indonesia Native:** Kalkulasi otomatis PPN 11% / 12%, PPh 23, serta modul pencatatan Faktur Pajak Masukan dan Faktur Pajak Keluaran siap lapor.
* 🏦 **Kas & Rekonsiliasi Bank:** Multi-rekening bank, kas kecil (*petty cash*), pencatatan transaksi mutasi, dan pencocokan rekening koran.
* 📊 **Laporan Keuangan Real-Time:**
  - **Neraca (Balance Sheet)**
  - **Laba Rugi (Profit & Loss / Income Statement)**
  - **Arus Kas (Cash Flow)**
  - **Neraca Saldo (Trial Balance)**
  - **Buku Besar (General Ledger)**
* 📦 **Persediaan & Multi-Gudang:** Master barang dan jasa, multi-lokasi gudang, mutasi antar gudang, kartu stok persediaan, dan kalkulasi HPP otomatis.
* 🏢 **Aset Tetap & Depresiasi:** Inventarisasi aset tetap perusahaan dengan eksekusi jurnal penyusutan/depresiasi bulanan otomatis.
* 👥 **Multi-Company & Granular RBAC:** Dukungan banyak perusahaan dalam satu sistem dengan pengaturan hak akses berbasis peran (Owner, Manager, Akuntan, Kasir).

---

## ⚖️ Perbandingan: SIM Akur vs Software Lain

| Parameter | 🇮🇩 **SIM Akur** | **Accurate Online** | **Odoo Community** |
| :--- | :--- | :--- | :--- |
| **Biaya Lisensi** | **100% Gratis & Bebas Iuran** | Rp 200rb - 300rb+/bln/db | Gratis (Sebagian modul berbayar) |
| **Source Code** | **Terbuka (Lisensi MIT)** | Tertutup (*Proprietary*) | Sebagian Terbuka (LGPL) |
| **Standar Akuntansi** | **PSAK & Pajak RI Native** | Standar Indonesia | Standar Global (Perlu kustomisasi) |
| **Tech Stack** | **Next.js 16 + React 19 + TypeScript** | Java / Web Lawas | Python + XML + OWL |
| **Self-Hosted** | **Mudah (Docker / Localhost)** | Tidak Tersedia | Membutuhkan VPS Linux |

---

## 🚀 Cara Menjalankan (Quickstart)

### Cara 1: Menggunakan Docker (Rekomendasi - 1 Baris)

Pastikan Docker & Docker Compose sudah terinstal di komputer/server Anda:

```bash
# 1. Clone repositori
git clone https://github.com/fxagro/akur.git
cd akur

# 2. Jalankan container
docker compose up -d
```
Aplikasi akan langsung berjalan di: `http://localhost:3000`

---

### Cara 2: Menjalankan Secara Lokal (Development)

Prasyarat: Node.js >= 20 dan PostgreSQL.

```bash
# 1. Clone repositori & install dependensi
git clone https://github.com/fxagro/akur.git
cd akur
npm install

# 2. Salin environment variables
cp .env.example .env
# Sesuaikan DATABASE_URL di file .env

# 3. Jalankan migrasi dan seed database COA standar
npx prisma generate
npx prisma migrate dev
npm run db:seed

# 4. Jalankan development server
npm run dev
```
Buka browser di: `http://localhost:3000/home` (Landing Page) atau `http://localhost:3000/login` (Aplikasi).

---

## 🤝 Mari Berkontribusi!

SIM Akur adalah proyek dari, oleh, dan untuk komunitas Indonesia. Kami sangat menyambut kontribusi dari berbagai kalangan:

* 💻 **Software Engineers:** Tambahkan fitur baru (POS kasir, integrasi WhatsApp notification, integrasi printer thermal, export Excel lanjutan).
* 📊 **Akuntan & Konsultan Pajak:** Bantu verifikasi skema jurnal, regulasi pajak terbaru (e-Faktur, PPh 21 TER), dan format laporan keuangan.
* 🎓 **Guru SMK & Dosen:** Jadikan SIM Akur sebagai materi praktikum lab komputer akuntansi gratis di sekolah/kampus Anda.
* 📝 **Dokumentasi & Desain:** Buat panduan penggunaan, tutorial video, dan sempurnakan UI/UX.

Silakan buka [Issues](https://github.com/fxagro/akur/issues) atau ajukan [Pull Request](https://github.com/fxagro/akur/pulls).

---

## 🌐 Ekosistem Komersial MyTriv

Bagi bisnis yang membutuhkan solusi terkelola tanpa perlu memikirkan server sendiri:

1. **[ukm.mytriv.com](https://ukm.mytriv.com):** Solusi Cloud Managed siap pakai untuk UMKM & toko retail. Dilengkapi pengiriman faktur otomatis via WhatsApp, Point of Sales (POS), dan auto-backup harian.
2. **[erp.mytriv.com](https://erp.mytriv.com):** Solusi Enterprise ERP terpadu untuk pabrik, distributor, dan korporasi multi-cabang. Dilengkapi modul manufaktur (BoM), HRIS & Payroll PPh 21 TER, serta integrasi e-Faktur DJP.

---

## 📄 Lisensi

SIM Akur dilisensikan di bawah [MIT License](LICENSE). Anda bebas menggunakan, memodifikasi, dan mendistribusikannya untuk kebutuhan pribadi maupun komersial.
