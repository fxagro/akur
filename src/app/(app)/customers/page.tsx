import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { PartnersClient } from "@/components/partners-client";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

async function getCustomers(companyId: string) {
  return prisma.customer.findMany({
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
      creditLimit: true,
      paymentTermDays: true,
      isActive: true,
      _count: { select: { salesInvoices: true } },
    },
  });
}

export default async function CustomersPage() {
  const ctx = await requirePermission("customer.view");
  const canManage = ctx.permissions.has("customer.manage");

  const rows = await getCustomers(ctx.company.id);
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
    creditLimit: r.creditLimit.toString(),
    paymentTermDays: r.paymentTermDays,
    isActive: r.isActive,
    invoiceCount: r._count.salesInvoices,
  }));

  return (
    <div>
      <PageHeader
        title="Pelanggan"
        description="Daftar pelanggan untuk transaksi penjualan."
      />

      <Card className="p-5">
        <PartnersClient kind="customer" rows={formatted} canManage={canManage} />
      </Card>
    </div>
  );
}