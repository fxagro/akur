import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PaymentForm } from "@/components/payment-form";
import { PageHeader, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SalesReceiptNewPage() {
  const ctx = await requirePermission("sales.manage");

  const [customers, openInvoices] = await Promise.all([
    prisma.customer.findMany({
      where: { companyId: ctx.company.id, isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.salesInvoice.findMany({
      where: {
        companyId: ctx.company.id,
        status: "POSTED",
        paidAmount: { lt: prisma.salesInvoice.fields.total },
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        number: true,
        date: true,
        total: true,
        paidAmount: true,
        customerId: true,
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Buat Penerimaan Kas"
        description="Alokasikan penerimaan ke faktur penjualan yang belum lunas."
      >
        <Link
          href="/sales/receipts"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Kembali
        </Link>
      </PageHeader>

      <Card className="p-5">
        <PaymentForm
          kind="receipt"
          partners={customers.map((c) => ({
            id: c.id,
            label: `${c.code} - ${c.name}`,
          }))}
          openDocs={openInvoices.map((inv) => ({
            id: inv.id,
            partnerId: inv.customerId,
            number: inv.number,
            date: inv.date.toISOString(),
            total: inv.total.toString(),
            paid: inv.paidAmount.toString(),
            remaining: Number(inv.total) - Number(inv.paidAmount),
          }))}
        />
      </Card>
    </div>
  );
}