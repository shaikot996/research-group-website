import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const formats: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
const escape = (s: string) => s.replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]!));
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) return new Response("Not found", { status: 404 });
  const person = await prisma.person.findFirst({ where: { slug, status: "PUBLISHED" }, select: { name: true } });
  if (!person) return new Response("Not found", { status: 404 });
  const dir = path.resolve(process.env.PEOPLE_PHOTO_DIR || "public/people", slug);
  const files = await readdir(dir).catch(() => [] as string[]);
  for (const ext of Object.keys(formats)) {
    const filename = files.find(file => file.toLowerCase() === `profile${ext}`);
    if (!filename) continue;
    try {
      const bytes = await readFile(path.join(dir, filename));
      return new Response(new Uint8Array(bytes), { headers: { "Content-Type": formats[ext], "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
    } catch { /* A file may be replaced while this request is in progress. */ }
  }
  const words = person.name.split(/\s+/).filter(Boolean);
  const initials = escape(`${words[0]?.[0] || ""}${words.length > 1 ? words.at(-1)?.[0] || "" : ""}`.toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#e4e9ee"/><stop offset="1" stop-color="#ece4db"/></linearGradient><pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#172a46" stroke-opacity=".07"/></pattern></defs><rect width="640" height="640" fill="url(#g)"/><rect width="640" height="640" fill="url(#p)"/><text x="320" y="340" dominant-baseline="middle" text-anchor="middle" font-family="Georgia,serif" font-size="108" fill="#172a46">${initials}</text></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" } });
}
