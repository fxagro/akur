import chalk from "chalk";
import ora from "ora";

export async function listModules(program: any) {
  const showAll = program.all || false;

  const spinner = ora("Fetching modules...").start();

  const communityModules = [
    { name: "@akur/accounting", version: "0.1.0", desc: "Core accounting (COA, Journal, Ledger)" },
    { name: "@akur/inventory", version: "0.1.0", desc: "Inventory management (Stock, Items, Warehouses)" },
    { name: "@akur/sales", version: "0.1.0", desc: "Sales & AR (Invoices, Receipts, Customers)" },
    { name: "@akur/purchase", version: "0.1.0", desc: "Purchasing & AP (Invoices, Payments, Suppliers)" },
    { name: "@akur/inventory", version: "0.1.0", desc: "Inventory management (Stock, Items, Warehouses)" },
    { name: "@akur/tax", version: "0.1.0", desc: "Tax (PPN, PPh, e-Faktur, SPT)" },
    { name: "@akur/bank", version: "0.1.0", desc: "Bank & Cash (Accounts, Transactions, Reconciliation)" },
    { name: "@akur/assets", version: "0.1.0", desc: "Fixed Assets & Depreciation" },
    { name: "@akur/reports", version: "0.1.0", desc: "Financial Reports (TB, P&L, BS, Cash Flow)" },
  ];

  const enterpriseModules = [
    { name: "@akur/hr", version: "0.1.0", desc: "HR & Payroll (Employees, Contracts, Payroll, BPJS, PPh 21)" },
    { name: "@akur/mrp", version: "0.1.0", desc: "Manufacturing (BOM, Routing, Work Orders, MRP)" },
    { name: "@akur/pos", version: "0.1.0", desc: "Point of Sale (Retail, Restaurant, Inventory Sync)" },
    { name: "@akur/crm", version: "0.1.0", desc: "CRM (Leads, Opportunities, Pipeline, Quotes)" },
    { name: "@akur/projects", version: "0.1.0", desc: "Project Management (Tasks, Timesheets, Billing)" },
    { name: "@akur/multi-currency", version: "0.1.0", desc: "Multi-currency & Revaluation" },
    { name: "@akur/multi-branch", version: "0.1.0", desc: "Multi-branch & Consolidation" },
    { name: "@akur/budgeting", version: "0.1.0", desc: "Budgeting & Forecasting" },
    { name: "@akur/quality", version: "0.1.0", desc: "Quality Management (QC, Inspections, NCR)" },
    { name: "@akur/maintenance", version: "0.1.0", desc: "Maintenance Management (PM, CM, Assets)" },
    { name: "@akur/fleet", version: "0.1.0", desc: "Fleet Management (Vehicles, Fuel, Maintenance)" },
    { name: "@akur/helpdesk", version: "0.1.0", desc: "Helpdesk & Ticketing (SLA, KB, CSAT)" },
    { name: "@akur/ecommerce", version: "0.1.0", desc: "E-commerce Connector (Shopify, WooCommerce, Tokopedia)" },
    { name: "@akur/pos-integration", version: "0.1.0", desc: "POS Integration (EDC, Printers, Cash Drawers)" },
    { name: "@akur/edc", version: "0.1.0", desc: "EDC Integration (BCA, Mandiri, BRI, BNI, BNI)" },
    { name: "@akur/bank-integration", version: "0.1.0", desc: "Bank Integration (Auto-reconcile, Mutasi)" },
  ];

  console.log(chalk.cyan.bold("\n📦 Available Modules\n"));

  console.log(chalk.green.bold("📦 Community Modules (Free, Open Source):"));
  communityModules.forEach((mod, i) => {
    console.log(`  ${i + 1}. ${chalk.cyan(mod.name)}@${mod.version}`);
    console.log(`     ${mod.desc}`);
  });

  console.log(chalk.yellow.bold("\n💎 Enterprise Modules (Paid, Requires License):"));
  enterpriseModules.forEach((mod, i) => {
    console.log(`     ${i + 1}. ${chalk.yellow(mod.name)}@${mod.version}`);
    console.log(`          ${mod.desc}`);
  });

  console.log(chalk.gray("\nUsage:"));
  console.log(chalk.gray("  akur module:install @akur/hr"));
  console.log(chalk.gray("  akur module:install @akur/mrp --version 0.2.0"));
  console.log(chalk.gray("  akur module:remove @akur/hr --force"));
}

export async function listModulesCommand() {
  console.log("Listing modules...");
}