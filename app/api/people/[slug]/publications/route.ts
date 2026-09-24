import { prisma } from "@/lib/db";
import { getInspireArticles } from "@/lib/inspire";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const person = await prisma.person.findFirst({ where: { slug, status: "PUBLISHED" }, select: { inspire: true } });
  if (!person?.inspire) return Response.json({ error: true }, { status: 404 });
  return Response.json(await getInspireArticles(person.inspire));
}
