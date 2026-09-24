import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { adminEnabled } from "@/lib/features";
import { prisma } from "@/lib/db";
export async function requireEditor() {
  if (!adminEnabled()) notFound();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/admin/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["ADMIN", "EDITOR"].includes(user.role)) redirect("/admin/login");
  session.user.role = user.role as "ADMIN" | "EDITOR";
  return session;
}
export async function requireAdmin() {
  const session = await requireEditor();
  if (session.user.role !== "ADMIN") redirect("/admin?error=forbidden");
  return session;
}
