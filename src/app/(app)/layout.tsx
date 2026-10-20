import { requireAuth } from "@/lib/auth-context";
import { visibleNav } from "@/lib/nav";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAuth();
  const groups = visibleNav(ctx.permissions, ctx.isSuperAdmin);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar groups={groups} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          userName={ctx.user.name}
          roleName={ctx.role.name}
          memberships={ctx.memberships.map((m) => ({
            companyId: m.companyId,
            companyName: m.companyName,
          }))}
          activeCompanyId={ctx.company.id}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
