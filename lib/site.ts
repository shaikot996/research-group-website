import { prisma } from "@/lib/db";
import { siteDefaults } from "@/lib/site-defaults";
export async function getSiteSettings(): Promise<Record<string, string>> {
  const rows = await prisma.siteSetting.findMany();
  return rows.reduce((settings, row) => ({ ...settings, [row.key]: row.value }), { ...siteDefaults });
}
