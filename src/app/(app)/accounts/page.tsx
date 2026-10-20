import { requirePermission } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { AccountsClient } from "./accounts-client";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const ctx = await requirePermission("account.view");

  const accounts = await prisma.account.findMany({
    where: { companyId: ctx.company.id },
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      normalBalance: true,
      parentId: true,
      level: true,
      isGroup: true,
      isActive: true,
      description: true,
    },
  });

  const canManage = ctx.isSuperAdmin || ctx.permissions.has("account.manage");

  return <AccountsClient accounts={accounts} canManage={canManage} />;
}
