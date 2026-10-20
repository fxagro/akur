export type NavItem = {
  label: string;
  href: string;
  permission?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV: NavGroup[] = [
  {
    label: "Utama",
    items: [{ label: "Dashboard", href: "/dashboard", permission: "dashboard.view" }],
  },
  {
    label: "Akuntansi",
    items: [
      { label: "Daftar Akun (COA)", href: "/accounts", permission: "account.view" },
      { label: "Jurnal Umum", href: "/journals", permission: "journal.view" },
      { label: "Buku Besar", href: "/ledger", permission: "journal.view" },
    ],
  },
  {
    label: "Laporan",
    items: [
      { label: "Neraca Saldo", href: "/reports/trial-balance", permission: "report.view" },
      { label: "Laba Rugi", href: "/reports/profit-loss", permission: "report.view" },
      { label: "Neraca", href: "/reports/balance-sheet", permission: "report.view" },
      { label: "Arus Kas", href: "/reports/cash-flow", permission: "report.view" },
    ],
  },
  {
    label: "Penjualan",
    items: [
      { label: "Faktur Penjualan", href: "/sales", permission: "sales.view" },
      { label: "Penerimaan", href: "/sales/receipts", permission: "sales.view" },
      { label: "Pelanggan", href: "/customers", permission: "customer.view" },
    ],
  },
  {
    label: "Pembelian",
    items: [
      { label: "Faktur Pembelian", href: "/purchases", permission: "purchase.view" },
      { label: "Pembayaran", href: "/purchases/payments", permission: "purchase.view" },
      { label: "Supplier", href: "/suppliers", permission: "supplier.view" },
    ],
  },
  {
    label: "Operasional",
    items: [
      { label: "Persediaan", href: "/inventory", permission: "inventory.view" },
      { label: "Kas & Bank", href: "/bank", permission: "bank.view" },
      { label: "Pajak", href: "/tax", permission: "tax.view" },
      { label: "Aset Tetap", href: "/assets", permission: "asset.view" },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      { label: "Perusahaan", href: "/settings/company", permission: "company.manage" },
      { label: "Pengguna", href: "/settings/users", permission: "user.view" },
      { label: "Role & Hak Akses", href: "/settings/roles", permission: "role.manage" },
    ],
  },
];

export function visibleNav(permissions: Set<string>, isSuperAdmin: boolean): NavGroup[] {
  const allowed = (code?: string) => !code || isSuperAdmin || permissions.has(code);
  return NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => allowed(item.permission)),
  })).filter((group) => group.items.length > 0);
}
