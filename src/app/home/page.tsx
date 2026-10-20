"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [lang, setLang] = useState<"id" | "en">("id");
  const [activeTab, setActiveTab] = useState<"invoice" | "journal" | "report" | "tax">("invoice");
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Initialize from localStorage if present
  useEffect(() => {
    const savedTheme = localStorage.getItem("sim_akur_theme") as "dark" | "light" | null;
    if (savedTheme) setTheme(savedTheme);
    const savedLang = localStorage.getItem("sim_akur_lang") as "id" | "en" | null;
    if (savedLang) setLang(savedLang);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("sim_akur_theme", nextTheme);
  };

  const toggleLang = (newLang: "id" | "en") => {
    setLang(newLang);
    localStorage.setItem("sim_akur_lang", newLang);
  };

  const copyCommand = () => {
    navigator.clipboard.writeText("git clone https://github.com/fxagro/akur.git && docker compose up -d");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const isDark = theme === "dark";

  // Content Dictionary for ID & EN
  const t = {
    id: {
      badgeHero: "🇮🇩 Gerakan Kedaulatan Software ERP & Akuntansi Indonesia",
      heroTitle1: "Sistem ERP & Akuntansi Indonesia.",
      heroTitle2: "Gratis, Terbuka, Milik Bangsa.",
      heroSubtitle:
        "SIM Akur (Sistem Informasi Manajemen Akuntansi) adalah alternatif Accurate dan Odoo dengan cita rasa Indonesia. Sesuai standar PSAK & SAK EMKM, perpajakan PPN & PPh, multi-gudang, dan pembukuan berpasangan (double-entry) tanpa biaya langganan bulanan.",
      btnGithub: "Star & Kontribusi di GitHub",
      btnDemo: "Coba Demo Aplikasi Web",
      btnCloud: "Butuh Cloud? ukm.mytriv.com",
      dockerHeader: "Jalankan via Docker (1 Perintah)",
      copyBtn: "Salin Perintah",
      copiedBtn: "✓ Tersalin!",
      stat1Val: "100%",
      stat1Lbl: "Gratis & Open Source (MIT)",
      stat2Val: "PSAK / EMKM",
      stat2Lbl: "Standar Akuntansi Indonesia",
      stat3Val: "PPN 12% & PPh",
      stat3Lbl: "Perpajakan RI Siap Pakai",
      stat4Val: "Rp 0 / bln",
      stat4Lbl: "Bebas Biaya Per Database / User",
      previewBadge: "Pratinjau Antarmuka",
      previewTitle: "Sederhana, Bersih, dan Presisi untuk Akuntan",
      previewDesc:
        "Lihat bagaimana transaksi sehari-hari dikonversi secara otomatis menjadi jurnal berpasangan dan laporan keuangan real-time.",
      tabInvoice: "🧾 Faktur Penjualan (Invoice)",
      tabJournal: "⚖️ Jurnal Berpasangan Otomatis",
      tabReport: "📊 Laporan Laba Rugi",
      tabTax: "🇮🇩 Rekap Pajak PPN",
      missionBadge: "Visi Besar: Odoo-nya Indonesia",
      missionTitle: "Mengapa Kita Harus Membangun SIM Akur Bersama-sama?",
      missionP1:
        "Selama puluhan tahun, bisnis dan kantor akuntan di Indonesia terjebak antara dua pilihan: memakai software luar negeri (seperti Odoo atau SAP) yang rumit dan tidak sesuai kebiasaan pembukuan lokal, atau software komersial tertutup (seperti Accurate dan Jurnal) yang biaya langganannya terus melambung tinggi per user dan per database.",
      missionP2:
        "SIM Akur hadir sebagai wadah kedaulatan software anak bangsa. Kami percaya fondasi akuntansi dan ERP inti harus bisa diakses bebas oleh setiap UMKM, praktisi keuangan, SMK, dan kampus di Indonesia. Dikembangkan bersama di GitHub, transparan, dan dapat dikustomisasi tanpa batas.",
      featuresBadge: "Modul Lengkap",
      featuresTitle: "8 Modul Utama Cita Rasa Indonesia",
      featuresDesc:
        "Semua yang Anda butuhkan untuk menjalankan pembukuan profesional dan akuntansi perpajakan tanpa kompromi.",
      modules: [
        {
          icon: "📚",
          title: "COA Standar PSAK",
          desc: "Hierarki akun standar Indonesia (Kas, Bank, Piutang, Persediaan, Utang Pajak, Modal, Beban) berjenjang otomatis.",
        },
        {
          icon: "🧾",
          title: "Penjualan & Piutang (AR)",
          desc: "Sales Invoice, Cetak PDF faktur profesional, Penerimaan pembayaran (Receipt), dan riwayat kartu piutang pelanggan.",
        },
        {
          icon: "🛒",
          title: "Pembelian & Utang (AP)",
          desc: "Purchase Invoice, Tagihan Supplier, Pencatatan pembayaran utang bertahap, dan monitoring jatuh tempo utang usaha.",
        },
        {
          icon: "🇮🇩",
          title: "Perpajakan Indonesia",
          desc: "Kalkulasi otomatis tarif PPN 11% / 12%, PPh 23, serta modul pencatatan Faktur Pajak Masukan & Keluaran.",
        },
        {
          icon: "🏦",
          title: "Kas & Rekonsiliasi Bank",
          desc: "Kelola kas kecil (petty cash), rekening bank perusahaan, pencatatan mutasi, dan rekonsiliasi rekening koran.",
        },
        {
          icon: "📊",
          title: "Laporan Keuangan Realtime",
          desc: "Neraca (Balance Sheet), Laba Rugi (Profit & Loss), Arus Kas (Cash Flow), dan Neraca Saldo ter-update otomatis.",
        },
        {
          icon: "📦",
          title: "Persediaan & Multi-Gudang",
          desc: "Master barang & jasa, multi-gudang, kartu stok persediaan, dan kalkulasi HPP otomatis setiap transaksi.",
        },
        {
          icon: "🏢",
          title: "Aset Tetap & Depresiasi",
          desc: "Daftar aset tetap perusahaan dan eksekusi jurnal penyusutan/depresiasi otomatis setiap akhir bulan.",
        },
      ],
      compareBadge: "Perbandingan Nyata",
      compareTitle: "SIM Akur vs Accurate Online vs Odoo Community",
      compareHeaders: ["Parameter", "SIM Akur (Open Source)", "Accurate Online", "Odoo Community"],
      compareRows: [
        {
          param: "Biaya Lisensi / Langganan",
          akur: "100% Gratis Selamanya",
          accurate: "Rp 200rb - 300rb+/bln/db",
          odoo: "Gratis (Sebagian modul bayar)",
        },
        {
          param: "Source Code Terbuka",
          akur: "Ya (Lisensi MIT Bebas)",
          accurate: "Tertutup (Proprietary)",
          odoo: "Sebagian (LGPL)",
        },
        {
          param: "Standar Akuntansi & Pajak",
          akur: "PSAK & Pajak RI Native",
          accurate: "Standar RI",
          odoo: "Standar Global (Perlu modifikasi)",
        },
        {
          param: "Teknologi / Stack",
          akur: "Next.js 16 + React 19 + TypeScript",
          accurate: "Java / Web Lawas",
          odoo: "Python + XML + OWL",
        },
        {
          param: "Kemudahan Kustomisasi Dev",
          akur: "Sangat Mudah (Full JavaScript)",
          accurate: "Tidak Bisa Kustom Kode",
          odoo: "Kompleks & Butuh Spesialis",
        },
        {
          param: "Privasi Data Keuangan",
          akur: "100% Milik Anda di Server Sendiri",
          accurate: "Tersimpan di Cloud Pihak Ketiga",
          odoo: "Self-Hosted",
        },
      ],
      roadmapBadge: "Roadmap Terbuka",
      roadmapTitle: "Rencana Pengembangan SIM Akur",
      roadmapPhases: [
        {
          badge: "Fase 1 • Selesai",
          title: "Core Ledger & Sub-Ledger",
          desc: "COA PSAK, Double-Entry Engine, Sales Invoice, Purchase Invoice, Bank, Pajak PPN/PPh, Laporan Keuangan Neraca & Laba Rugi.",
        },
        {
          badge: "Fase 2 • Q4 2026",
          title: "Retail POS & Integrasi WA",
          desc: "Modul POS Kasir Cepat, Cetak Struk Thermal Bluetooth, dan Pengiriman Link Invoice Otomatis via WhatsApp API.",
        },
        {
          badge: "Fase 3 • Q1 2027",
          title: "e-Faktur & Payroll PPh 21",
          desc: "Ekspor CSV e-Faktur resmi DJP, modul Payroll gaji bulanan dengan kalkulasi PPh 21 TER otomatis.",
        },
        {
          badge: "Fase 4 • Q2 2027",
          title: "Mobile Companion App",
          desc: "Aplikasi mobile Android/iOS untuk melihat laporan keuangan, approve transaksi, dan scan nota belanja dari HP.",
        },
      ],
      contribTitle: "Mari Bergabung & Berkontribusi!",
      contribDesc:
        "SIM Akur terbuka untuk siapa saja. Apapun latar belakang kamu—developer web, akuntan profesional, konsultan pajak, mahasiswa akuntansi, atau pemilik usaha—kontribusi kamu sangat berarti bagi kemajuan UMKM Indonesia.",
      contribDevTitle: "💻 Untuk Developer",
      contribDevDesc:
        "Bantu buat modul POS, integrasi WhatsApp API, integrasi scanner barcode, atau sempurnakan komponen UI dengan Tailwind & Shadcn.",
      contribAccTitle: "📊 Untuk Akuntan & Auditor",
      contribAccDesc:
        "Bantu validasi kepatuhan format laporan keuangan, rumus depresiasi fiskal vs komersial, dan skema jurnal otomatis.",
      contribEduTitle: "🎓 Untuk Kampus & SMK",
      contribEduDesc:
        "Gunakan SIM Akur sebagai materi praktikum lab komputer akuntansi gratis di sekolah/kampus tanpa beban lisensi berbayar.",
      contribBtnStar: "⭐ Fork & Star Repo di GitHub",
      contribBtnIssue: "Diskusi & Ajukan Issue",
      ecoBadge: "Ekosistem Terintegrasi",
      ecoTitle: "Solusi Berjenjang untuk Setiap Skala Usaha",
      ecoDesc:
        "Mulai gratis di laptop Anda, atau beralih ke cloud terkelola saat bisnis Anda tumbuh semakin besar.",
      ecoTier1Badge: "Self-Hosted • Gratis",
      ecoTier1Title: "SIM Akur (Open Source)",
      ecoTier1Desc: "Cocok untuk developer, freelancer akuntansi, dan bisnis yang ingin kontrol data 100% di server sendiri.",
      ecoTier1Features: [
        "Full Akses Source Code (MIT)",
        "Single Company Unlimited Data",
        "Jalankan di Localhost / Docker",
        "Tanpa ada biaya langganan",
      ],
      ecoTier1Btn: "Unduh di GitHub",
      ecoTier2Badge: "SaaS Cloud • Rp 99rb/bln",
      ecoTier2Title: "UKM MyTriv Cloud",
      ecoTier2Desc: "Solusi instan untuk UMKM yang tidak mau pusing sewa server, install Docker, atau backup database harian.",
      ecoTier2Features: [
        "Tinggal Login & Langsung Pakai",
        "Otomatis Auto-Backup Harian",
        "Akses Multi-User & Multi-Device",
        "Support Teknis & Update Otomatis",
      ],
      ecoTier2Btn: "Kunjungi ukm.mytriv.com →",
      ecoTier3Badge: "Enterprise • Custom",
      ecoTier3Title: "ERP MyTriv Enterprise",
      ecoTier3Desc: "Solusi ERP terintegrasi untuk pabrik, distributor multi-cabang, dan korporasi dengan kebutuhan modul advance.",
      ecoTier3Features: [
        "Modul Manufaktur & Bill of Materials",
        "HRIS & Absensi Payroll Lanjutan",
        "Konsolidasi Multi-Cabang / PT",
        "Kustomisasi Sesuai Alur Bisnis",
      ],
      ecoTier3Btn: "Kunjungi erp.mytriv.com →",
      faqBadge: "Pertanyaan Umum",
      faqTitle: "Frequently Asked Questions",
      faqs: [
        {
          q: "Apakah SIM Akur benar-benar 100% gratis?",
          a: "Ya! SIM Akur berlisensi MIT. Anda bebas mengunduh source code-nya, menjalankannya di komputer pribadi, toko, atau kantor tanpa ada biaya langganan bulanan maupun batasan jumlah transaksi.",
        },
        {
          q: "Apa perbedaan SIM Akur dengan Accurate Online atau Odoo?",
          a: "Accurate Online adalah software tertutup berbayar langganan bulanan. Odoo adalah software open-source global yang membutuhkan kustomisasi rumit agar sesuai akuntansi Indonesia. SIM Akur menggabungkan keunggulan keduanya: open-source seperti Odoo, namun menggunakan standar PSAK dan perpajakan Indonesia asli seperti Accurate.",
        },
        {
          q: "Apakah data keuangan bisnis saya aman?",
          a: "Sangat aman, karena Anda memegang kontrol penuh atas database Anda sendiri (self-hosted). Data tersimpan di server atau laptop Anda, bukan di cloud milik orang lain.",
        },
        {
          q: "Kapan saya sebaiknya menggunakan ukm.mytriv.com atau erp.mytriv.com?",
          a: "Jika Anda tidak ingin repot mengelola server atau Docker sendiri, Anda bisa langsung menggunakan ukm.mytriv.com (SaaS Cloud siap pakai). Sedangkan jika bisnis Anda adalah pabrik atau korporasi dengan banyak cabang dan butuh modul Manufaktur/HRIS, Anda bisa menggunakan erp.mytriv.com.",
        },
        {
          q: "Bagaimana cara ikut berkontribusi dalam proyek ini?",
          a: "Buka repositori GitHub kami di github.com/fxagro/akur, beri Star, dan ajukan Pull Request atau buka Issue. Kami menyambut kontribusi kode, desain, maupun saran akuntansi dari praktisi di seluruh Indonesia.",
        },
      ],
      navPreview: "Pratinjau",
      navFeatures: "Fitur",
      navCompare: "Bandingkan",
      navContribute: "Kontribusi",
      navEcosystem: "Ekosistem",
      navFaq: "FAQ",
      navDemoBtn: "Masuk Demo",
      footerTagline: "Lisensi MIT • Karya Anak Bangsa untuk Kemajuan Ekonomi Indonesia 🇮🇩",
    },
    en: {
      badgeHero: "🇮🇩 Sovereign Open-Source ERP & Accounting for Indonesia",
      heroTitle1: "Indonesian ERP & Accounting System.",
      heroTitle2: "Free, Open-Source, Built for the Nation.",
      heroSubtitle:
        "SIM Akur (Accounting Management Information System) is an open-source alternative to Accurate and Odoo tailored for Indonesia. Built for PSAK & SAK EMKM statutory standards, VAT & withholding tax, multi-warehouse, and double-entry bookkeeping with zero monthly subscription fees.",
      btnGithub: "Star & Contribute on GitHub",
      btnDemo: "Try Live Web Demo",
      btnCloud: "Need Cloud? ukm.mytriv.com",
      dockerHeader: "Run via Docker (1 Command)",
      copyBtn: "Copy Command",
      copiedBtn: "✓ Copied!",
      stat1Val: "100%",
      stat1Lbl: "Free & Open Source (MIT)",
      stat2Val: "PSAK / EMKM",
      stat2Lbl: "Indonesian Accounting Standards",
      stat3Val: "VAT 12% & WHT",
      stat3Lbl: "Ready Indonesian Tax Engine",
      stat4Val: "Rp 0 / mo",
      stat4Lbl: "Zero Fee Per Database / User",
      previewBadge: "Interface Preview",
      previewTitle: "Clean, Modern, and Built with Precision for Accountants",
      previewDesc:
        "See how daily business transactions automatically turn into balanced journal entries and real-time financial statements.",
      tabInvoice: "🧾 Sales Invoice",
      tabJournal: "⚖️ Auto Double-Entry Journal",
      tabReport: "📊 Profit & Loss Statement",
      tabTax: "🇮🇩 VAT Tax Summary",
      missionBadge: "Big Vision: The Odoo of Indonesia",
      missionTitle: "Why We Are Building SIM Akur Together",
      missionP1:
        "For decades, businesses and accounting firms in Indonesia have been caught between two extremes: complex foreign ERPs (like Odoo or SAP) that lack native Indonesian statutory bookkeeping workflows, or closed proprietary SaaS (like Accurate and Jurnal) with steep monthly fees per user and per database.",
      missionP2:
        "SIM Akur stands as a movement for software sovereignty. We believe core accounting and ERP foundations should be freely accessible to every Indonesian SME, financial accountant, vocational school, and university. Built collectively on GitHub, transparent, and infinitely customizable.",
      featuresBadge: "Full Modules",
      featuresTitle: "8 Core Modules Tailored for Indonesia",
      featuresDesc:
        "Everything you need to run professional bookkeeping and statutory tax accounting without compromises.",
      modules: [
        {
          icon: "📚",
          title: "Indonesian PSAK COA",
          desc: "Automated hierarchical Chart of Accounts (Cash, Bank, AR, Inventory, Tax Liabilities, Equity, Expenses).",
        },
        {
          icon: "🧾",
          title: "Sales & Accounts Receivable",
          desc: "Sales invoices, professional PDF generation, payment receipts, and customer sub-ledger tracking.",
        },
        {
          icon: "🛒",
          title: "Purchasing & Accounts Payable",
          desc: "Purchase invoices, vendor bills, milestone payment tracking, and due-date cash flow monitoring.",
        },
        {
          icon: "🇮🇩",
          title: "Indonesian Tax Compliance",
          desc: "Automated calculation for VAT 11% / 12%, Withholding Tax PPh 23, and tax invoice reconciliation.",
        },
        {
          icon: "🏦",
          title: "Cash & Bank Reconciliation",
          desc: "Manage petty cash, multiple company bank accounts, fund transfers, and bank statement reconciliations.",
        },
        {
          icon: "📊",
          title: "Real-Time Financial Reports",
          desc: "Balance Sheet, Profit & Loss (Income Statement), Cash Flow, and Trial Balance updated on every posting.",
        },
        {
          icon: "📦",
          title: "Inventory & Multi-Warehouse",
          desc: "Item and service catalog, multiple warehouse stock cards, and automated COGS (HPP) calculation.",
        },
        {
          icon: "🏢",
          title: "Fixed Assets & Depreciation",
          desc: "Asset register with automated monthly depreciation journal postings according to tax/commercial rules.",
        },
      ],
      compareBadge: "Head-to-Head Comparison",
      compareTitle: "SIM Akur vs Accurate Online vs Odoo Community",
      compareHeaders: ["Parameter", "SIM Akur (Open Source)", "Accurate Online", "Odoo Community"],
      compareRows: [
        {
          param: "License / Subscription Fees",
          akur: "100% Free Forever",
          accurate: "$15 - $25+/mo per database",
          odoo: "Free (Key modules paid)",
        },
        {
          param: "Open Source Code",
          akur: "Yes (Permissive MIT)",
          accurate: "Closed (Proprietary)",
          odoo: "Partial (LGPL)",
        },
        {
          param: "Accounting & Tax Compliance",
          akur: "Native Indonesian PSAK & Tax",
          accurate: "Indonesian Standards",
          odoo: "Global Standards (Requires custom coding)",
        },
        {
          param: "Technology Stack",
          akur: "Next.js 16 + React 19 + TypeScript",
          accurate: "Legacy Web / Java",
          odoo: "Python + XML + OWL",
        },
        {
          param: "Developer Extensibility",
          akur: "Very Easy (Modern JavaScript/TypeScript)",
          accurate: "Locked / No Code Access",
          odoo: "Steep learning curve & specialized",
        },
        {
          param: "Financial Data Privacy",
          akur: "100% Owned by You (Self-Hosted)",
          accurate: "Stored in 3rd-Party Cloud",
          odoo: "Self-Hosted",
        },
      ],
      roadmapBadge: "Open Roadmap",
      roadmapTitle: "SIM Akur Development Trajectory",
      roadmapPhases: [
        {
          badge: "Phase 1 • Completed",
          title: "Core Ledger & Sub-Ledger",
          desc: "PSAK COA, Double-Entry Engine, Sales Invoice, Purchase Invoice, Bank, VAT/WHT, Balance Sheet & P&L.",
        },
        {
          badge: "Phase 2 • Q4 2026",
          title: "Retail POS & WhatsApp API",
          desc: "Fast Cashier POS module, Bluetooth thermal receipt printing, and automated invoice delivery via WhatsApp API.",
        },
        {
          badge: "Phase 3 • Q1 2027",
          title: "DJP e-Faktur & Payroll",
          desc: "Official DJP e-Faktur CSV export, monthly employee payroll module with automated PPh 21 TER withholding.",
        },
        {
          badge: "Phase 4 • Q2 2027",
          title: "Mobile Companion App",
          desc: "Native Android & iOS mobile app for dashboard metrics, payment approvals, and receipt photo capture.",
        },
      ],
      contribTitle: "Join the Movement & Contribute!",
      contribDesc:
        "SIM Akur is open to everyone. Whether you are a software developer, professional accountant, tax consultant, academic, or business owner—your contribution accelerates Indonesia's digital sovereignty.",
      contribDevTitle: "💻 For Developers",
      contribDevDesc:
        "Help build the POS module, WhatsApp integration, barcode scanning, or polish UI components with Tailwind & Shadcn.",
      contribAccTitle: "📊 For Accountants & Auditors",
      contribAccDesc:
        "Help validate statutory reporting formats, fiscal depreciation matrices, and automated posting templates.",
      contribEduTitle: "🎓 For Universities & Vocational Schools",
      contribEduDesc:
        "Use SIM Akur as free lab software for computerized accounting courses without recurring license burdens.",
      contribBtnStar: "⭐ Fork & Star Repo on GitHub",
      contribBtnIssue: "Discuss & Open Issue",
      ecoBadge: "Integrated Ecosystem",
      ecoTitle: "Tiered Solutions for Every Business Stage",
      ecoDesc:
        "Start free on your laptop, or graduate to managed cloud as your business expands across Indonesia.",
      ecoTier1Badge: "Self-Hosted • Free",
      ecoTier1Title: "SIM Akur (Open Source)",
      ecoTier1Desc: "Ideal for developers, freelance accountants, and businesses demanding 100% data custody on own servers.",
      ecoTier1Features: [
        "Full Source Code Access (MIT)",
        "Single Company Unlimited Data",
        "Run on Localhost / Docker",
        "Zero subscription fees",
      ],
      ecoTier1Btn: "Download on GitHub",
      ecoTier2Badge: "SaaS Cloud • Rp 99k/mo",
      ecoTier2Title: "UKM MyTriv Cloud",
      ecoTier2Desc: "Turnkey cloud solution for SMEs who want accounting without Docker, server maintenance, or manual backups.",
      ecoTier2Features: [
        "Instant Sign-in & Ready to Go",
        "Automated Daily Offsite Backups",
        "Multi-User & Multi-Device Access",
        "Priority Support & Automatic Updates",
      ],
      ecoTier2Btn: "Visit ukm.mytriv.com →",
      ecoTier3Badge: "Enterprise • Custom",
      ecoTier3Title: "ERP MyTriv Enterprise",
      ecoTier3Desc: "Comprehensive enterprise ERP for manufacturing plants, multi-branch distributors, and holding corporations.",
      ecoTier3Features: [
        "Manufacturing & Bill of Materials (BOM)",
        "Advanced HRIS & Time Tracking Payroll",
        "Multi-Branch & Multi-Entity Consolidation",
        "Custom Business Workflow Engineering",
      ],
      ecoTier3Btn: "Visit erp.mytriv.com →",
      faqBadge: "Frequently Asked Questions",
      faqTitle: "Common Questions & Clarifications",
      faqs: [
        {
          q: "Is SIM Akur genuinely 100% free?",
          a: "Yes! SIM Akur is released under the permissive MIT license. You are free to download the source code, run it on personal computers, retail stores, or office servers without monthly fees or transaction limits.",
        },
        {
          q: "What makes SIM Akur different from Accurate Online or Odoo?",
          a: "Accurate Online is closed proprietary SaaS with monthly per-database fees. Odoo is a global ERP requiring substantial customization for Indonesian tax and accounting. SIM Akur combines the best of both: open-source like Odoo, but natively tailored to Indonesian PSAK and tax compliance like Accurate.",
        },
        {
          q: "Is my financial data secure?",
          a: "Completely secure, because you maintain 100% control over your database (self-hosted). Data resides on your own server or laptop, not in a vendor's shared cloud.",
        },
        {
          q: "When should I use ukm.mytriv.com or erp.mytriv.com?",
          a: "If you prefer not to manage servers or Docker, ukm.mytriv.com is an instant turnkey cloud. If your company operates manufacturing plants, holds multiple legal entities, or needs enterprise HRIS/BOM workflows, erp.mytriv.com is tailored for your scale.",
        },
        {
          q: "How can I participate and contribute?",
          a: "Visit our GitHub repository at github.com/fxagro/akur, give it a Star, and submit Pull Requests or Issues. We warmly welcome code contributions, UI improvements, and accounting feedback from across Indonesia and beyond.",
        },
      ],
      navPreview: "Preview",
      navFeatures: "Features",
      navCompare: "Compare",
      navContribute: "Contribute",
      navEcosystem: "Ecosystem",
      navFaq: "FAQ",
      navDemoBtn: "Live Demo",
      footerTagline: "MIT License • Made by Indonesian Builders for National Economic Progress 🇮🇩",
    },
  };

  const cur = t[lang];

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
        isDark
          ? "bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white"
          : "bg-slate-50 text-slate-900 selection:bg-emerald-600 selection:text-white"
      }`}
    >
      {/* Background Radial Glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute -top-48 left-1/2 -translate-x-1/2 h-[600px] w-[1100px] rounded-full bg-gradient-to-tr from-emerald-600/15 via-teal-600/15 to-blue-600/10 blur-[130px]" />
            <div className="absolute top-[800px] -left-40 h-[500px] w-[500px] rounded-full bg-emerald-700/10 blur-[140px]" />
            <div className="absolute top-[1800px] -right-40 h-[600px] w-[600px] rounded-full bg-cyan-700/10 blur-[150px]" />
          </>
        ) : (
          <>
            <div className="absolute -top-48 left-1/2 -translate-x-1/2 h-[600px] w-[1100px] rounded-full bg-gradient-to-tr from-emerald-400/20 via-teal-300/15 to-blue-300/10 blur-[130px]" />
            <div className="absolute top-[800px] -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[140px]" />
            <div className="absolute top-[1800px] -right-40 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[150px]" />
          </>
        )}
      </div>

      {/* TOP HEADER */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${
          isDark
            ? "border-slate-800/80 bg-slate-950/85"
            : "border-slate-200/90 bg-white/85 shadow-sm"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-xl font-black text-slate-950 shadow-lg shadow-emerald-500/25">
              A
            </div>
            <div>
              <span className={`text-xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                SIM <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">Akur</span>
              </span>
              <span className="ml-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Open Source
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className={`hidden items-center gap-7 text-sm font-medium md:flex ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            <a href="#demo" className="hover:text-emerald-500 transition-colors">
              {cur.navPreview}
            </a>
            <a href="#fitur" className="hover:text-emerald-500 transition-colors">
              {cur.navFeatures}
            </a>
            <a href="#komparasi" className="hover:text-emerald-500 transition-colors">
              {cur.navCompare}
            </a>
            <a href="#kontribusi" className="hover:text-emerald-500 transition-colors">
              {cur.navContribute}
            </a>
            <a href="#ekosistem" className="hover:text-emerald-500 transition-colors">
              {cur.navEcosystem}
            </a>
            <a href="#faq" className="hover:text-emerald-500 transition-colors">
              {cur.navFaq}
            </a>
          </nav>

          {/* Controls: Language, Theme & Actions */}
          <div className="flex items-center gap-2.5">
            {/* Language Switcher Pill */}
            <div
              className={`flex items-center rounded-lg p-0.5 border text-xs font-bold ${
                isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-100"
              }`}
            >
              <button
                onClick={() => toggleLang("id")}
                className={`rounded-md px-2 py-1 transition ${
                  lang === "id"
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : isDark
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Bahasa Indonesia"
              >
                ID
              </button>
              <button
                onClick={() => toggleLang("en")}
                className={`rounded-md px-2 py-1 transition ${
                  lang === "en"
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : isDark
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="English"
              >
                EN
              </button>
            </div>

            {/* Dark / Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Dark/Light Mode"
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                isDark
                  ? "border-slate-800 bg-slate-900 text-amber-300 hover:bg-slate-800"
                  : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              title={isDark ? "Beralih ke Light Mode" : "Beralih ke Dark Mode"}
            >
              {isDark ? (
                // Sun Icon for Dark mode (click to go Light)
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                // Moon Icon for Light mode (click to go Dark)
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* GitHub Button */}
            <a
              href="https://github.com/fxagro/akur"
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                isDark
                  ? "border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-700 hover:bg-slate-800"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
              }`}
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>GitHub</span>
            </a>

            {/* Login / Demo Button */}
            <Link
              href="/login"
              className="rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
            >
              {cur.navDemoBtn}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold ${
            isDark
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-emerald-600/30 bg-emerald-50 text-emerald-700 shadow-sm"
          }`}
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {cur.badgeHero}
        </div>

        <h1
          className={`mt-8 text-4xl font-extrabold tracking-tight sm:text-6xl sm:leading-[1.12] ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          {cur.heroTitle1} <br />
          <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
            {cur.heroTitle2}
          </span>
        </h1>

        <p
          className={`mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}
        >
          {cur.heroSubtitle}
        </p>

        {/* CTA BUTTONS */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://github.com/fxagro/akur"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/25 transition hover:bg-emerald-400 hover:scale-[1.02]"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            {cur.btnGithub}
          </a>

          <Link
            href="/login"
            className={`rounded-xl border px-7 py-3.5 text-sm font-semibold transition ${
              isDark
                ? "border-slate-800 bg-slate-900 text-white hover:border-slate-700 hover:bg-slate-800"
                : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100 shadow-sm"
            }`}
          >
            {cur.btnDemo}
          </Link>

          <a
            href="https://ukm.mytriv.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 rounded-xl border px-5 py-3.5 text-sm font-semibold transition ${
              isDark
                ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
                : "border-cyan-600/30 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 shadow-sm"
            }`}
          >
            <span>{cur.btnCloud}</span>
            <span>&rarr;</span>
          </a>
        </div>

        {/* ONE-COMMAND DOCKER BOX */}
        <div
          className={`mx-auto mt-10 max-w-lg rounded-2xl border p-3.5 shadow-2xl backdrop-blur-xl ${
            isDark ? "border-slate-800 bg-slate-900/90" : "border-slate-300 bg-white shadow-xl"
          }`}
        >
          <div
            className={`flex items-center justify-between px-3 py-1 text-xs border-b mb-2.5 ${
              isDark ? "border-slate-800/80 text-slate-400" : "border-slate-200 text-slate-500"
            }`}
          >
            <span className={`font-semibold flex items-center gap-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {cur.dockerHeader}
            </span>
            <button
              onClick={copyCommand}
              className="text-[11px] font-bold text-emerald-500 hover:text-emerald-400 transition"
            >
              {copied ? cur.copiedBtn : cur.copyBtn}
            </button>
          </div>
          <div className="flex items-center justify-between px-3.5 py-2.5 font-mono text-xs text-emerald-400 bg-slate-950 rounded-xl overflow-x-auto border border-slate-800">
            <code>git clone https://github.com/fxagro/akur.git && docker compose up -d</code>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section
        className={`border-y py-10 transition-colors duration-300 ${
          isDark ? "border-slate-800/80 bg-slate-900/40" : "border-slate-200 bg-white"
        }`}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 md:grid-cols-4 text-center">
          <div>
            <div className={`text-3xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>{cur.stat1Val}</div>
            <div className={`mt-1 text-xs uppercase tracking-wider font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {cur.stat1Lbl}
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-500">{cur.stat2Val}</div>
            <div className={`mt-1 text-xs uppercase tracking-wider font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {cur.stat2Lbl}
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-cyan-500">{cur.stat3Val}</div>
            <div className={`mt-1 text-xs uppercase tracking-wider font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {cur.stat3Lbl}
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-purple-500">{cur.stat4Val}</div>
            <div className={`mt-1 text-xs uppercase tracking-wider font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {cur.stat4Lbl}
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE MOCKUP SHOWCASE */}
      <section id="demo" className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500">
            {cur.previewBadge}
          </h2>
          <p className={`mt-3 text-3xl font-extrabold sm:text-4xl ${isDark ? "text-white" : "text-slate-900"}`}>
            {cur.previewTitle}
          </p>
          <p className={`mx-auto mt-4 max-w-2xl text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {cur.previewDesc}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setActiveTab("invoice")}
            className={`rounded-xl px-5 py-2.5 text-xs font-bold transition ${
              activeTab === "invoice"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : isDark
                ? "border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
            }`}
          >
            {cur.tabInvoice}
          </button>
          <button
            onClick={() => setActiveTab("journal")}
            className={`rounded-xl px-5 py-2.5 text-xs font-bold transition ${
              activeTab === "journal"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : isDark
                ? "border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
            }`}
          >
            {cur.tabJournal}
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`rounded-xl px-5 py-2.5 text-xs font-bold transition ${
              activeTab === "report"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : isDark
                ? "border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
            }`}
          >
            {cur.tabReport}
          </button>
          <button
            onClick={() => setActiveTab("tax")}
            className={`rounded-xl px-5 py-2.5 text-xs font-bold transition ${
              activeTab === "tax"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : isDark
                ? "border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
            }`}
          >
            {cur.tabTax}
          </button>
        </div>

        {/* Simulated Browser Window */}
        <div
          className={`mt-8 overflow-hidden rounded-2xl border shadow-2xl transition-colors ${
            isDark ? "border-slate-800 bg-slate-900" : "border-slate-300 bg-white"
          }`}
        >
          {/* Window Header */}
          <div
            className={`flex items-center justify-between border-b px-4 py-3 ${
              isDark ? "border-slate-800/80 bg-slate-950" : "border-slate-200 bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <div
              className={`rounded-lg px-6 py-1 text-center font-mono text-xs ${
                isDark ? "bg-slate-900 text-slate-400" : "bg-white text-slate-600 shadow-sm border border-slate-200"
              }`}
            >
              sim-akur.local/app/{activeTab}
            </div>
            <div className="text-xs text-emerald-500 font-semibold">● {lang === "id" ? "Terhubung" : "Connected"}</div>
          </div>

          {/* Window Content */}
          <div className="p-6 sm:p-8 font-sans">
            {activeTab === "invoice" && (
              <div>
                <div
                  className={`flex flex-wrap items-center justify-between gap-4 border-b pb-5 ${
                    isDark ? "border-slate-800" : "border-slate-200"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                      {lang === "id" ? "FAKTUR PENJUALAN" : "SALES INVOICE"}
                    </span>
                    <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      INV/2026/10/0042
                    </h3>
                    <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {lang === "id"
                        ? "Pelanggan: PT Sumber Berkah Nusantara • Tanggal: 20 Oktober 2026"
                        : "Customer: PT Sumber Berkah Nusantara • Date: October 20, 2026"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {lang === "id" ? "POSTED (TERBIT)" : "POSTED (ACTIVE)"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b ${isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                      <tr>
                        <th className="py-2.5">{lang === "id" ? "Deskripsi Barang / Jasa" : "Item / Service Description"}</th>
                        <th className="py-2.5 text-center">{lang === "id" ? "Qty" : "Quantity"}</th>
                        <th className="py-2.5 text-right">{lang === "id" ? "Harga Satuan" : "Unit Price"}</th>
                        <th className="py-2.5 text-right">{lang === "id" ? "Pajak" : "Tax"}</th>
                        <th className="py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-slate-800/60 text-slate-300" : "divide-slate-200 text-slate-700"}`}>
                      <tr>
                        <td className={`py-3 font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                          {lang === "id" ? "Jasa Konsultasi Implementasi Cloud ERP" : "Cloud ERP Implementation Consulting Service"}
                        </td>
                        <td className="py-3 text-center">{lang === "id" ? "1 Paket" : "1 Package"}</td>
                        <td className="py-3 text-right">Rp 15.000.000</td>
                        <td className="py-3 text-right text-emerald-500 font-semibold">PPN 11%</td>
                        <td className="py-3 text-right font-semibold">Rp 15.000.000</td>
                      </tr>
                      <tr>
                        <td className={`py-3 font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                          {lang === "id" ? "Lisensi Dedicated Server VPS Managed" : "Dedicated Managed Cloud Server License"}
                        </td>
                        <td className="py-3 text-center">{lang === "id" ? "1 Unit" : "1 Unit"}</td>
                        <td className="py-3 text-right">Rp 5.000.000</td>
                        <td className="py-3 text-right text-emerald-500 font-semibold">PPN 11%</td>
                        <td className="py-3 text-right font-semibold">Rp 5.000.000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex justify-end">
                  <div
                    className={`w-64 space-y-2 border-t pt-4 text-xs ${
                      isDark ? "border-slate-800" : "border-slate-200"
                    }`}
                  >
                    <div className={`flex justify-between ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <span>Subtotal</span>
                      <span>Rp 20.000.000</span>
                    </div>
                    <div className={`flex justify-between ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <span>PPN 11%</span>
                      <span>Rp 2.200.000</span>
                    </div>
                    <div
                      className={`flex justify-between border-t pt-2 text-sm font-bold ${
                        isDark ? "border-slate-800 text-white" : "border-slate-200 text-slate-900"
                      }`}
                    >
                      <span>{lang === "id" ? "Total Tagihan" : "Total Due"}</span>
                      <span className="text-emerald-500">Rp 22.200.000</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "journal" && (
              <div>
                <div className={`border-b pb-5 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                    {lang === "id" ? "JURNAL UMUM OTOMATIS" : "AUTOMATED GENERAL JOURNAL"}
                  </span>
                  <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    Entry #JV-202610-0019 (Ref: INV/2026/10/0042)
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {lang === "id"
                      ? "Status: Terposting otomatis dari modul penjualan • Validasi Debit = Kredit ✅"
                      : "Status: Auto-posted from sales module • Debit = Credit Balanced ✅"}
                  </p>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className={`border-b ${isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                      <tr>
                        <th className="py-2.5">{lang === "id" ? "Kode Akun" : "Account Code"}</th>
                        <th className="py-2.5">{lang === "id" ? "Nama Akun (COA PSAK)" : "Account Title (PSAK COA)"}</th>
                        <th className="py-2.5 text-right">Debit (Rp)</th>
                        <th className="py-2.5 text-right">{lang === "id" ? "Kredit (Rp)" : "Credit (Rp)"}</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-slate-800/60 text-slate-300" : "divide-slate-200 text-slate-700"}`}>
                      <tr>
                        <td className="py-3 font-semibold text-emerald-500">1-1200</td>
                        <td className={`py-3 font-sans ${isDark ? "text-white" : "text-slate-900"}`}>
                          {lang === "id" ? "Piutang Usaha (PT Sumber Berkah Nusantara)" : "Accounts Receivable (PT Sumber Berkah)"}
                        </td>
                        <td className={`py-3 text-right font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                          22.200.000
                        </td>
                        <td className={`py-3 text-right ${isDark ? "text-slate-500" : "text-slate-400"}`}>0</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-semibold text-emerald-500">4-1000</td>
                        <td className={`py-3 font-sans ${isDark ? "text-white" : "text-slate-900"}`}>
                          {lang === "id" ? "Pendapatan Penjualan Jasa" : "Sales Revenue - Professional Services"}
                        </td>
                        <td className={`py-3 text-right ${isDark ? "text-slate-500" : "text-slate-400"}`}>0</td>
                        <td className={`py-3 text-right font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                          20.000.000
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-semibold text-emerald-500">2-1210</td>
                        <td className={`py-3 font-sans ${isDark ? "text-white" : "text-slate-900"}`}>
                          {lang === "id" ? "Utang Pajak - PPN Keluaran" : "Tax Payable - Output VAT (PPN Keluaran)"}
                        </td>
                        <td className={`py-3 text-right ${isDark ? "text-slate-500" : "text-slate-400"}`}>0</td>
                        <td className={`py-3 text-right font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                          2.200.000
                        </td>
                      </tr>
                    </tbody>
                    <tfoot
                      className={`border-t-2 font-bold ${
                        isDark ? "border-slate-700 text-white" : "border-slate-300 text-slate-900"
                      }`}
                    >
                      <tr>
                        <td colSpan={2} className="py-3 font-sans">
                          {lang === "id" ? "TOTAL KESEIMBANGAN (BALANCE)" : "TOTAL BALANCE VERIFIED"}
                        </td>
                        <td className="py-3 text-right text-emerald-500">22.200.000</td>
                        <td className="py-3 text-right text-emerald-500">22.200.000</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "report" && (
              <div>
                <div className={`border-b pb-5 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                    {lang === "id" ? "LAPORAN LABA RUGI" : "PROFIT & LOSS STATEMENT"}
                  </span>
                  <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {lang === "id"
                      ? "Laporan Laba Rugi Komprehensif (Bulan Berjalan)"
                      : "Comprehensive Income Statement (Current Month)"}
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {lang === "id"
                      ? "Periode: 1 Okt 2026 - 31 Okt 2026 • Standar PSAK / SAK EMKM"
                      : "Period: Oct 1, 2026 - Oct 31, 2026 • PSAK / SAK EMKM Standard"}
                  </p>
                </div>

                <div className="mt-6 space-y-4 text-xs">
                  <div
                    className={`rounded-xl p-4 border ${
                      isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="font-bold text-emerald-500 uppercase tracking-wider mb-2">
                      {lang === "id" ? "1. Pendapatan Operasional" : "1. Operating Revenues"}
                    </div>
                    <div className={`flex justify-between py-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      <span>{lang === "id" ? "4-1000 Pendapatan Penjualan Jasa & Produk" : "4-1000 Service & Product Sales"}</span>
                      <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Rp 145.500.000</span>
                    </div>
                    <div className={`flex justify-between py-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <span>{lang === "id" ? "4-1100 Potongan Penjualan" : "4-1100 Sales Discounts"}</span>
                      <span>(Rp 2.500.000)</span>
                    </div>
                    <div
                      className={`flex justify-between border-t pt-2 font-bold ${
                        isDark ? "border-slate-800 text-white" : "border-slate-200 text-slate-900"
                      }`}
                    >
                      <span>{lang === "id" ? "Total Pendapatan Bersih" : "Net Operating Revenue"}</span>
                      <span>Rp 143.000.000</span>
                    </div>
                  </div>

                  <div
                    className={`rounded-xl p-4 border ${
                      isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="font-bold text-amber-500 uppercase tracking-wider mb-2">
                      {lang === "id" ? "2. Beban Operasional" : "2. Operating Expenses"}
                    </div>
                    <div className={`flex justify-between py-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      <span>{lang === "id" ? "6-1100 Beban Gaji & Tunjangan Karyawan" : "6-1100 Salaries & Employee Benefits"}</span>
                      <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Rp 48.000.000</span>
                    </div>
                    <div className={`flex justify-between py-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      <span>{lang === "id" ? "6-1600 Beban Penyusutan Aset Tetap" : "6-1600 Fixed Asset Depreciation"}</span>
                      <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Rp 4.500.000</span>
                    </div>
                    <div
                      className={`flex justify-between border-t pt-2 font-bold ${
                        isDark ? "border-slate-800 text-white" : "border-slate-200 text-slate-900"
                      }`}
                    >
                      <span>{lang === "id" ? "Total Beban Operasional" : "Total Operating Expenses"}</span>
                      <span>Rp 52.500.000</span>
                    </div>
                  </div>

                  <div
                    className={`rounded-xl p-4 border flex justify-between items-center text-sm font-extrabold ${
                      isDark
                        ? "bg-gradient-to-r from-emerald-950/60 to-slate-950 border-emerald-500/30 text-white"
                        : "bg-emerald-50/80 border-emerald-200 text-slate-900"
                    }`}
                  >
                    <span>{lang === "id" ? "LABA BERSIH PERIODE BERJALAN (EAT)" : "NET PROFIT FOR THE PERIOD (EAT)"}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-base">Rp 90.500.000</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tax" && (
              <div>
                <div className={`border-b pb-5 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                    {lang === "id" ? "REKAPITULASI PAJAK" : "TAX SUMMARY"}
                  </span>
                  <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {lang === "id" ? "SPT Masa PPN & PPh 23" : "Indonesian Monthly VAT & WHT Return"}
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {lang === "id"
                      ? "Monitoring Faktur Pajak Keluaran vs Masukan untuk persiapan SPT Masa"
                      : "Output VAT vs Input VAT reconciliation for periodic statutory tax return"}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className={`p-4 rounded-xl border ${isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                    <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                      {lang === "id" ? "PPN Keluaran (Penjualan)" : "Output VAT (Sales)"}
                    </span>
                    <div className={`text-lg font-bold mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>Rp 15.730.000</div>
                    <span className="text-[10px] text-emerald-500">
                      {lang === "id" ? "14 Transaksi Faktur" : "14 Invoices"}
                    </span>
                  </div>
                  <div className={`p-4 rounded-xl border ${isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                    <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                      {lang === "id" ? "PPN Masukan (Pembelian)" : "Input VAT (Purchases)"}
                    </span>
                    <div className={`text-lg font-bold mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>Rp 6.820.000</div>
                    <span className="text-[10px] text-cyan-500">
                      {lang === "id" ? "8 Faktur Masukan" : "8 Input Bills"}
                    </span>
                  </div>
                  <div
                    className={`p-4 rounded-xl border ${
                      isDark ? "border-emerald-500/30 bg-emerald-950/20" : "border-emerald-300 bg-emerald-50/80"
                    }`}
                  >
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {lang === "id" ? "PPN Kurang Bayar (Net)" : "Net VAT Payable"}
                    </span>
                    <div className={`text-lg font-bold mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>Rp 8.910.000</div>
                    <span className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {lang === "id" ? "Wajib setor sebelum akhir bulan" : "Due by end of month"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* THE BIG MISSION / GERAKAN */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div
          className={`rounded-3xl border p-8 sm:p-14 shadow-2xl relative overflow-hidden transition-colors ${
            isDark
              ? "border-slate-800 bg-gradient-to-br from-slate-900 via-slate-800/40 to-slate-900"
              : "border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white"
          }`}
        >
          <div className="absolute right-0 top-0 translate-x-20 -translate-y-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="max-w-3xl relative z-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500">
              {cur.missionBadge}
            </h2>
            <h3 className={`mt-3 text-2xl font-bold sm:text-4xl sm:leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              {cur.missionTitle}
            </h3>
            <p className={`mt-5 text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              {cur.missionP1}
            </p>
            <p className={`mt-4 text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              {cur.missionP2}
            </p>
          </div>
        </div>
      </section>

      {/* 8 FITUR UTAMA */}
      <section id="fitur" className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500">
            {cur.featuresBadge}
          </h2>
          <p className={`mt-3 text-3xl font-extrabold sm:text-4xl ${isDark ? "text-white" : "text-slate-900"}`}>
            {cur.featuresTitle}
          </p>
          <p className={`mx-auto mt-4 max-w-2xl text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {cur.featuresDesc}
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cur.modules.map((mod, i) => (
            <div
              key={i}
              className={`rounded-2xl border p-6 transition hover:border-emerald-500/50 hover:scale-[1.02] ${
                isDark
                  ? "border-slate-800 bg-slate-900/40 hover:bg-slate-900"
                  : "border-slate-200 bg-white shadow-sm hover:shadow-md"
              }`}
            >
              <div className="text-3xl mb-3">{mod.icon}</div>
              <h3 className={`font-bold text-base ${isDark ? "text-white" : "text-slate-900"}`}>{mod.title}</h3>
              <p className={`mt-2 text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {mod.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* TABEL PERBANDINGAN */}
      <section id="komparasi" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500">
            {cur.compareBadge}
          </h2>
          <p className={`mt-3 text-3xl font-extrabold sm:text-4xl ${isDark ? "text-white" : "text-slate-900"}`}>
            {cur.compareTitle}
          </p>
        </div>

        <div
          className={`mt-12 overflow-x-auto rounded-2xl border p-2 shadow-2xl ${
            isDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-white"
          }`}
        >
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className={`border-b ${isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
              <tr>
                {cur.compareHeaders.map((head, idx) => (
                  <th
                    key={idx}
                    className={`py-4 px-4 font-semibold ${idx === 1 ? "text-emerald-500 font-bold" : ""}`}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-slate-800/60 text-slate-300" : "divide-slate-200 text-slate-700"}`}>
              {cur.compareRows.map((row, idx) => (
                <tr key={idx}>
                  <td className={`py-4 px-4 font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{row.param}</td>
                  <td className="py-4 px-4 font-bold text-emerald-500">{row.akur}</td>
                  <td className={`py-4 px-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{row.accurate}</td>
                  <td className={`py-4 px-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{row.odoo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ROADMAP KOMUNITAS */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500">
            {cur.roadmapBadge}
          </h2>
          <p className={`mt-3 text-3xl font-extrabold sm:text-4xl ${isDark ? "text-white" : "text-slate-900"}`}>
            {cur.roadmapTitle}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cur.roadmapPhases.map((phase, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border p-5 ${
                idx === 0
                  ? isDark
                    ? "border-emerald-500/40 bg-emerald-950/20"
                    : "border-emerald-300 bg-emerald-50/70 shadow-sm"
                  : isDark
                  ? "border-slate-800 bg-slate-900/50"
                  : "border-slate-200 bg-white shadow-sm"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase ${
                  idx === 0
                    ? "text-emerald-500"
                    : idx === 1
                    ? "text-cyan-500"
                    : idx === 2
                    ? "text-amber-500"
                    : "text-purple-500"
                }`}
              >
                {phase.badge}
              </span>
              <h4 className={`mt-2 font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{phase.title}</h4>
              <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>{phase.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KONTRIBUSI GITHUB */}
      <section id="kontribusi" className="mx-auto max-w-6xl px-6 py-20 text-center">
        <div
          className={`rounded-3xl border p-8 sm:p-14 shadow-2xl ${
            isDark
              ? "border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 via-slate-900 to-slate-950"
              : "border-emerald-200 bg-gradient-to-b from-emerald-50/50 via-white to-slate-50"
          }`}
        >
          <h2 className={`text-3xl font-extrabold sm:text-5xl ${isDark ? "text-white" : "text-slate-900"}`}>
            {cur.contribTitle}
          </h2>
          <p className={`mx-auto mt-4 max-w-2xl text-sm sm:text-base ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            {cur.contribDesc}
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3 text-left">
            <div
              className={`rounded-xl border p-5 ${
                isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white shadow-sm"
              }`}
            >
              <div className="text-emerald-500 font-bold mb-2">{cur.contribDevTitle}</div>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>{cur.contribDevDesc}</p>
            </div>
            <div
              className={`rounded-xl border p-5 ${
                isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white shadow-sm"
              }`}
            >
              <div className="text-cyan-500 font-bold mb-2">{cur.contribAccTitle}</div>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>{cur.contribAccDesc}</p>
            </div>
            <div
              className={`rounded-xl border p-5 ${
                isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white shadow-sm"
              }`}
            >
              <div className="text-purple-500 font-bold mb-2">{cur.contribEduTitle}</div>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>{cur.contribEduDesc}</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/fxagro/akur"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
            >
              {cur.contribBtnStar}
            </a>
            <a
              href="https://github.com/fxagro/akur/issues"
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-xl border px-8 py-3.5 text-sm font-semibold transition ${
                isDark
                  ? "border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100 shadow-sm"
              }`}
            >
              {cur.contribBtnIssue}
            </a>
          </div>
        </div>
      </section>

      {/* EKOSISTEM MYTRIV (COMMERCIAL FUNNEL) */}
      <section id="ekosistem" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500">
            {cur.ecoBadge}
          </h2>
          <p className={`mt-3 text-3xl font-extrabold sm:text-4xl ${isDark ? "text-white" : "text-slate-900"}`}>
            {cur.ecoTitle}
          </p>
          <p className={`mx-auto mt-4 max-w-2xl text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {cur.ecoDesc}
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {/* Tier 1: SIM Akur */}
          <div
            className={`rounded-2xl border p-6 flex flex-col justify-between ${
              isDark
                ? "border-emerald-500/40 bg-slate-900/60"
                : "border-emerald-300 bg-white shadow-md ring-1 ring-emerald-500/20"
            }`}
          >
            <div>
              <div className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-4">
                {cur.ecoTier1Badge}
              </div>
              <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{cur.ecoTier1Title}</h3>
              <p className={`mt-2 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {cur.ecoTier1Desc}
              </p>
              <ul className={`mt-6 space-y-2.5 text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                {cur.ecoTier1Features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> {feat}
                  </li>
                ))}
              </ul>
            </div>
            <a
              href="https://github.com/fxagro/akur"
              className="mt-8 block rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-center text-xs font-bold text-emerald-600 dark:text-emerald-300 transition hover:bg-emerald-500 hover:text-slate-950"
            >
              {cur.ecoTier1Btn}
            </a>
          </div>

          {/* Tier 2: UKM MyTriv */}
          <div
            className={`rounded-2xl border p-6 flex flex-col justify-between relative ${
              isDark
                ? "border-cyan-500/40 bg-slate-900/60"
                : "border-cyan-300 bg-white shadow-md ring-1 ring-cyan-500/20"
            }`}
          >
            <div className="absolute -top-3 right-6 rounded-full bg-cyan-500 px-3 py-0.5 text-[10px] font-extrabold text-slate-950 uppercase tracking-wider">
              {lang === "id" ? "Paling Praktis" : "Most Popular"}
            </div>
            <div>
              <div className="inline-block rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 mb-4">
                {cur.ecoTier2Badge}
              </div>
              <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{cur.ecoTier2Title}</h3>
              <p className={`mt-2 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {cur.ecoTier2Desc}
              </p>
              <ul className={`mt-6 space-y-2.5 text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                {cur.ecoTier2Features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-cyan-500">✓</span> {feat}
                  </li>
                ))}
              </ul>
            </div>
            <a
              href="https://ukm.mytriv.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 block rounded-xl bg-cyan-500 py-3 text-center text-xs font-bold text-slate-950 transition hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
            >
              {cur.ecoTier2Btn}
            </a>
          </div>

          {/* Tier 3: ERP MyTriv Enterprise */}
          <div
            className={`rounded-2xl border p-6 flex flex-col justify-between ${
              isDark
                ? "border-purple-500/40 bg-slate-900/60"
                : "border-purple-300 bg-white shadow-md ring-1 ring-purple-500/20"
            }`}
          >
            <div>
              <div className="inline-block rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 mb-4">
                {cur.ecoTier3Badge}
              </div>
              <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{cur.ecoTier3Title}</h3>
              <p className={`mt-2 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {cur.ecoTier3Desc}
              </p>
              <ul className={`mt-6 space-y-2.5 text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                {cur.ecoTier3Features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-purple-500">✓</span> {feat}
                  </li>
                ))}
              </ul>
            </div>
            <a
              href="https://erp.mytriv.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 block rounded-xl border border-purple-500/30 bg-purple-500/10 py-3 text-center text-xs font-bold text-purple-600 dark:text-purple-300 transition hover:bg-purple-500 hover:text-slate-950"
            >
              {cur.ecoTier3Btn}
            </a>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="mx-auto max-w-4xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500">
            {cur.faqBadge}
          </h2>
          <p className={`mt-3 text-3xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>
            {cur.faqTitle}
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {cur.faqs.map((faq, i) => (
            <div
              key={i}
              className={`rounded-xl border overflow-hidden transition-colors ${
                isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white shadow-sm"
              }`}
            >
              <button
                onClick={() => toggleFaq(i)}
                className={`w-full flex items-center justify-between p-5 text-left text-sm font-bold transition ${
                  isDark ? "text-white hover:text-emerald-400" : "text-slate-900 hover:text-emerald-600"
                }`}
              >
                <span>{faq.q}</span>
                <span className="text-emerald-500 ml-4 font-mono text-base">{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && (
                <div
                  className={`px-5 pb-5 text-xs leading-relaxed border-t pt-3 ${
                    isDark ? "border-slate-800/60 text-slate-400" : "border-slate-100 text-slate-600"
                  }`}
                >
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className={`border-t py-12 text-xs transition-colors ${
          isDark ? "border-slate-800 bg-slate-950 text-slate-500" : "border-slate-200 bg-white text-slate-500 shadow-inner"
        }`}
      >
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-xs font-black text-slate-950">
              A
            </div>
            <div>
              <span className={`font-bold ${isDark ? "text-white" : "text-slate-800"}`}>SIM Akur</span>
              <span className="mx-2">•</span>
              <span>{lang === "id" ? "Sistem Informasi Manajemen Akuntansi" : "Indonesian ERP & Accounting System"}</span>
            </div>
          </div>

          <div className="flex gap-6">
            <a href="https://github.com/fxagro/akur" className="hover:text-emerald-500 transition-colors">
              GitHub Repo
            </a>
            <a href="https://ukm.mytriv.com" className="hover:text-emerald-500 transition-colors">
              UKM Cloud
            </a>
            <a href="https://erp.mytriv.com" className="hover:text-emerald-500 transition-colors">
              ERP Enterprise
            </a>
          </div>

          <div className="text-center sm:text-right">
            {cur.footerTagline}
          </div>
        </div>
      </footer>
    </div>
  );
}
