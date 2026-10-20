import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { InvoiceForm } from "@/components/invoice-form";
import { PageHeader, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PurchaseNewPage() {
  const ctx = await requirePermission("purchase.manage");

  const [suppliers, items, accounts, taxCodes] = await Promise.all([
    prisma.supplier.findMany({
      where: { companyId: ctx.company.id, isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.item.findMany({
      where: { companyId: ctx.company.id, isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true, salePrice: true, purchasePrice: true },
    }),
    prisma.account.findMany({
      where: { companyId: ctx.company.id, isActive: true, isGroup: false },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.taxCode.findMany({
      where: { companyId: ctx.company.id, isActive: true, type: "PPN" },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true, rate: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Buat Faktur Pembelian"
        description="Faktur disimpan sebagai draft, posting untuk membuat jurnal otomatis."
      >
        <Link
          href="/purchases"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Kembali
        </Link>
      </PageHeader>

      <Card className="p-5">
        <InvoiceForm
          kind="purchase"
          partners={suppliers.map((s) => ({
            id: s.id,
            label: `${s.code} - ${s.name}`,
          }))}
          items={items.map((i) => ({
            id: i.id,
            label: `${i.code} - ${i.name}`,
            salePrice: i.salePrice.toString(),
            purchasePrice: i.purchasePrice.toString(),
          }))}
          accounts={accounts.map((a) => ({
            id: a.id,
            label: `${a.code} - ${a.name}`,
          }))}
          taxCodes={taxCodes.map((t) => ({
            id: t.id,
            label: `${t.code} (${(Number(t.rate) * 100).toFixed(1)}%)`,
            rate: t.rate.toString(),
          }))}
        />
      </Card>
    </div>
  );
}