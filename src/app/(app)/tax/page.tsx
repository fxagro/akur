import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TaxPage() {
  const ctx = await requirePermission("tax.view");

  const [codesCount, outputCount, inputCount, pphCount, ppnTotal] = await Promise.all([
    prisma.taxCode.count({ where: { companyId: ctx.company.id } }),
    prisma.taxInvoice.count({ where: { companyId: ctx.company.id, direction: "OUTPUT", date: { gte: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)) } } }),
    prisma.taxInvoice.count({ where: { companyId: ctx.company.id, direction: "INPUT", refType: "PURCHASE_INVOICE", date: { gte: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)) } } }),
    prisma.taxInvoice.count({ where: { companyId: ctx.company.id, direction: "INPUT", refType: { not: "PURCHASE_INVOICE" }, date: { gte: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)) } } }),
    prisma.taxInvoice.aggregate({
      where: { companyId: ctx.company.id, direction: "OUTPUT", date: { gte: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)) } },
      _sum: { ppn: true },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Pajak" description="Kelola PPN, PPh, SPT & e-Faktur." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Kode Pajak</p>
          <p className="text-2xl font-bold text-slate-900">{codesCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">FK Keluaran (Bulan Ini)</p>
          <p className="text-2xl font-bold text-slate-900">{outputCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">FM Masukan (Bulan Ini)</p>
          <p className="text-2xl font-bold text-emerald-600">{inputCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">PPh (Bulan Ini)</p>
          <p className="text-2xl font-bold text-amber-600">{pphCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">PPN Keluaran (Bulan Ini)</p>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(ppnTotal._sum.ppn?.toString() ?? "0")}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/tax/codes" className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md">
          <p className="text-lg font-semibold text-slate-900">Kode Pajak</p>
          <p className="mt-1 text-sm text-slate-500">Master PPN & PPh</p>
        </Link>
        <Link href="/tax/output" className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md">
          <p className="text-lg font-semibold text-slate-900">Faktur Pajak Keluaran</p>
          <p className="mt-1 text-sm text-slate-500">PPN Keluaran (Output)</p>
        </Link>
        <Link href="/tax/input" className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md">
          <p className="text-lg font-semibold text-emerald-700">Faktur Pajak Masukan</p>
          <p className="mt-1 text-sm text-slate-500">PPN Masukan (Input)</p>
        </Link>
        <Link href="/tax/pph" className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md">
          <p className="text-lg font-semibold text-amber-700">PPh</p>
          <p className="mt-1 text-sm text-slate-500">Pemotongan/Pemungutan</p>
        </Link>
        <Link href="/tax/spt-ppn" className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md">
          <p className="text-lg font-semibold text-slate-900">SPT PPN Masa</p>
          <p className="mt-1 text-sm text-slate-500">Laporan e-Faktur bulanan</p>
        </Link>
      </div>
    </div>
  );
}