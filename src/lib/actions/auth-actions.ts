"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSession, destroySession, setActiveCompany } from "@/lib/auth";
import { getAuthContext } from "@/lib/auth-context";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { error: "Email atau password tidak valid." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user || !user.isActive) {
    return { error: "Email atau password salah." };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { error: "Email atau password salah." };
  }

  const h = await headers();
  await createSession(user.id, {
    userAgent: h.get("user-agent") ?? undefined,
    ipAddress: h.get("x-forwarded-for") ?? undefined,
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function switchCompanyAction(formData: FormData): Promise<void> {
  const companyId = String(formData.get("companyId") ?? "");
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const member = ctx.memberships.find((m) => m.companyId === companyId);
  if (!member) return;

  await setActiveCompany(companyId);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
