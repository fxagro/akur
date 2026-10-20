import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PaymentForm } from "@/components/payment-form";
import { PageHeader, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PurchasePaymentNewPage() {
  const ctx = await requirePermission("purchase.manage");

  const [suppliers, openInvoices] = await Promise.all([
    prisma.supplier.findMany({
      where: { companyId: ctx.company.id, isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.purchaseInvoice.findMany({
      where: {
        companyId: ctx.company.id,
        status: "POSTED",
        paidAmount: { lt: prisma.purchaseInvoice.fields.total },
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        number: true,
        date: true,
        total: true,
        paidAmount: true,
        supplierId: true,
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Buat Pembayaran"
        description="Alokasikan pembayaran ke faktur pembelian yang belum lunas."
      >
        <Link
          href="/purchases/payments"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Kembali
        </Link>
      </PageHeader>

      <Card className="p-5">
        <PaymentForm
          kind="payment"
          partners={suppliers.map((s) => ({
            id: s.id,
            label: `${s.code} - ${s.name}`,
          }))}
          openDocs={openInvoices.map((inv) => ({
            id: inv.id,
            partnerId: inv.supplierId,
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