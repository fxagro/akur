import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { COMPANY_COOKIE, SESSION_COOKIE } from "./auth";

export type AuthContext = {
  user: {
    id: string;
    email: string;
    name: string;
    isSuperAdmin: boolean;
  };
  isSuperAdmin: boolean;
  company: {
    id: string;
    name: string;
    currency: string;
    npwp: string | null;
  };
  role: { id: string; name: string };
  memberships: Array<{
    companyId: string;
    companyName: string;
    roleName: string;
  }>;
  permissions: Set<string>;
};

export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          memberships: {
            where: { isActive: true },
            include: {
              company: true,
              role: {
                include: {
                  rolePermissions: { include: { permission: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    return null;
  }

  const memberships = session.user.memberships.filter((m) => m.company.isActive);
  if (memberships.length === 0) return null;

  const preferred = store.get(COMPANY_COOKIE)?.value;
  const active =
    memberships.find((m) => m.companyId === preferred) ?? memberships[0];

  const permissions = new Set(
    active.role.rolePermissions.map((rp) => rp.permission.code)
  );

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      isSuperAdmin: session.user.isSuperAdmin,
    },
    isSuperAdmin: session.user.isSuperAdmin,
    company: {
      id: active.company.id,
      name: active.company.name,
      currency: active.company.currency,
      npwp: active.company.npwp,
    },
    role: { id: active.role.id, name: active.role.name },
    memberships: memberships.map((m) => ({
      companyId: m.companyId,
      companyName: m.company.name,
      roleName: m.role.name,
    })),
    permissions,
  };
});

export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  return ctx;
}

export function can(ctx: AuthContext, code: string): boolean {
  if (ctx.isSuperAdmin) return true;
  return ctx.permissions.has(code);
}

export async function requirePermission(code: string): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!can(ctx, code)) {
    redirect("/dashboard?error=forbidden");
  }
  return ctx;
}
