import { readFile } from "node:fs/promises";
import path from "node:path";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|pdf)$/.test(filename)) return new Response("Not found", { status: 404 });
  const types: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".pdf": "application/pdf" };
  try {
    const bytes = await readFile(path.resolve(process.env.UPLOAD_DIR || "data/uploads", filename));
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": types[path.extname(filename)], "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response("Not found", { status: 404 }); }
}
