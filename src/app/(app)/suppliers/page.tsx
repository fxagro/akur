import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { PartnersClient } from "@/components/partners-client";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

async function getSuppliers(companyId: string) {
  return prisma.supplier.findMany({
    where: { companyId },
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      npwp: true,
      phone: true,
      email: true,
      city: true,
      address: true,
      contactPerson: true,
      paymentTermDays: true,
      isActive: true,
      _count: { select: { purchaseInvoices: true } },
    },
  });
}

export default async function SuppliersPage() {
  const ctx = await requirePermission("supplier.view");
  const canManage = ctx.permissions.has("supplier.manage");

  const rows = await getSuppliers(ctx.company.id);
  const formatted = rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    npwp: r.npwp,
    phone: r.phone,
    email: r.email,
    city: r.city,
    address: r.address,
    contactPerson: r.contactPerson,
    creditLimit: "0",
    paymentTermDays: r.paymentTermDays,
    isActive: r.isActive,
    invoiceCount: r._count.purchaseInvoices,
  }));

  return (
    <div>
      <PageHeader
        title="Supplier"
        description="Daftar supplier untuk transaksi pembelian."
      />

      <Card className="p-5">
        <PartnersClient kind="supplier" rows={formatted} canManage={canManage} />
      </Card>
    </div>
  );
}