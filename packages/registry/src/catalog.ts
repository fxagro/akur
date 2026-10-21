export type ModuleTier = "core" | "community" | "enterprise";

export interface ModuleInfo {
  name: string;
  version: string;
  description: string;
  tier: ModuleTier;
  tags: string[];
  status: "stable" | "beta" | "alpha" | "planned";
}

export const MODULE_CATALOG: ModuleInfo[] = [
  // --- Core (wajib, sudah termasuk) ---
  {
    name: "@akur/accounting",
    version: "0.1.0",
    description: "Inti akuntansi: Daftar Akun (COA), Jurnal Umum, Buku Besar",
    tier: "core",
    tags: ["accounting", "coa", "journal", "ledger"],
    status: "stable",
  },
  {
    name: "@akur/company",
    version: "0.1.0",
    description: "Multi-perusahaan, profil perusahaan, pengguna & hak akses (RBAC)",
    tier: "core",
    tags: ["company", "rbac", "multi-company"],
    status: "stable",
  },
  {
    name: "@akur/reports",
    version: "0.1.0",
    description: "Laporan keuangan: Neraca Saldo, Laba Rugi, Neraca, Arus Kas",
    tier: "core",
    tags: ["reports", "financial"],
    status: "stable",
  },

  // --- Community (gratis, open source) ---
  {
    name: "@akur/sales",
    version: "0.1.0",
    description: "Penjualan & Piutang: Faktur, Penerimaan, Pelanggan, alokasi invoice",
    tier: "community",
    tags: ["sales", "ar", "invoice", "customer"],
    status: "stable",
  },
  {
    name: "@akur/purchase",
    version: "0.1.0",
    description: "Pembelian & Utang: Faktur, Pembayaran, Supplier, alokasi bill",
    tier: "community",
    tags: ["purchase", "ap", "bill", "supplier"],
    status: "stable",
  },
  {
    name: "@akur/inventory",
    version: "0.1.0",
    description: "Persediaan: Item, Kategori, Gudang, Kartu Stok, HPP rata-rata",
    tier: "community",
    tags: ["inventory", "stock", "warehouse", "hpp"],
    status: "stable",
  },
  {
    name: "@akur/tax",
    version: "0.1.0",
    description: "Pajak Indonesia: PPN, PPh 21/23/4(2), Faktur Pajak, SPT PPN Masa",
    tier: "community",
    tags: ["tax", "ppn", "pph", "spt", "efaktur"],
    status: "stable",
  },
  {
    name: "@akur/bank",
    version: "0.1.0",
    description: "Kas & Bank: rekening, transaksi, rekonsiliasi bank statement",
    tier: "community",
    tags: ["bank", "cash", "reconciliation"],
    status: "stable",
  },
  {
    name: "@akur/assets",
    version: "0.1.0",
    description: "Aset Tetap: daftar aset, penyusutan garis lurus & saldo menurun",
    tier: "community",
    tags: ["fixed-asset", "depreciation"],
    status: "stable",
  },

  // --- Enterprise (berbayar, butuh lisensi) ---
  {
    name: "@akur/hr",
    version: "0.1.0",
    description: "HR & Payroll: karyawan, kontrak, gaji, BPJS, THR, PPh 21, LHKPN",
    tier: "enterprise",
    tags: ["hr", "payroll", "bpjs", "pph21"],
    status: "planned",
  },
  {
    name: "@akur/mrp",
    version: "0.1.0",
    description: "Manufaktur: BOM multi-level, Routing, Work Order, costing, subcontracting",
    tier: "enterprise",
    tags: ["mrp", "manufacturing", "bom", "routing"],
    status: "planned",
  },
  {
    name: "@akur/quality",
    version: "0.1.0",
    description: "Manajemen Mutu: QC, inspeksi, NCR, corrective action",
    tier: "enterprise",
    tags: ["quality", "qc", "inspection"],
    status: "planned",
  },
  {
    name: "@akur/maintenance",
    version: "0.1.0",
    description: "Maintenance: preventive & corrective, spare part, downtime",
    tier: "enterprise",
    tags: ["maintenance", "cmms", "asset"],
    status: "planned",
  },
  {
    name: "@akur/fleet",
    version: "0.1.0",
    description: "Fleet: kendaraan, BBM, driver's log, maintenance",
    tier: "enterprise",
    tags: ["fleet", "vehicle", "fuel"],
    status: "planned",
  },
  {
    name: "@akur/pos",
    version: "0.1.0",
    description: "Point of Sale: retail & restoran, sinkron stok, printer struk",
    tier: "enterprise",
    tags: ["pos", "retail", "restaurant"],
    status: "planned",
  },
  {
    name: "@akur/crm",
    version: "0.1.0",
    description: "CRM: lead, opportunity, pipeline, quotation, follow-up",
    tier: "enterprise",
    tags: ["crm", "lead", "pipeline"],
    status: "planned",
  },
  {
    name: "@akur/projects",
    version: "0.1.0",
    description: "Project: task, timesheet, biaya, penagihan, profitabilitas",
    tier: "enterprise",
    tags: ["project", "timesheet"],
    status: "planned",
  },
  {
    name: "@akur/multi-currency",
    version: "0.1.0",
    description: "Multi-currency: kurs, revaluasi, selisih kurs",
    tier: "enterprise",
    tags: ["currency", "revaluation", "forex"],
    status: "planned",
  },
  {
    name: "@akur/multi-branch",
    version: "0.1.0",
    description: "Multi-cabang & konsolidasi laporan grup",
    tier: "enterprise",
    tags: ["branch", "consolidation"],
    status: "planned",
  },
  {
    name: "@akur/budgeting",
    version: "0.1.0",
    description: "Budgeting & forecasting per akun, divisi, periode",
    tier: "enterprise",
    tags: ["budget", "forecasting"],
    status: "planned",
  },
  {
    name: "@akur/helpdesk",
    version: "0.1.0",
    description: "Helpdesk: ticket, SLA, knowledge base, CSAT",
    tier: "enterprise",
    tags: ["helpdesk", "ticket", "sla"],
    status: "planned",
  },
  {
    name: "@akur/ecommerce",
    version: "0.1.0",
    description: "Konektor e-commerce: Shopify, WooCommerce, Tokopedia, Shopee",
    tier: "enterprise",
    tags: ["ecommerce", "shopify", "tokopedia"],
    status: "planned",
  },
  {
    name: "@akur/bank-integration",
    version: "0.1.0",
    description: "Integrasi bank: mutasi rekening, auto-rekonsiliasi (BCA/Mandiri/BNI/ BRI)",
    tier: "enterprise",
    tags: ["bank", "mutation", "reconciliation"],
    status: "planned",
  },
  {
    name: "@akur/edc",
    version: "0.1.0",
    description: "Integrasi EDC: BCA, Mandiri, BNI, BRI — settlement & cash drawer",
    tier: "enterprise",
    tags: ["edc", "payment", "settlement"],
    status: "planned",
  },
];