import { readFile } from "node:fs/promises";
import path from "node:path";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|pdf)$/.test(filename)) return new Response("Not found", { status: 404 });
  const types: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".pdf": "application/pdf" };
  const ext = path.extname(filename).toLowerCase();
  try {
    const bytes = await readFile(path.resolve(process.env.UPLOAD_DIR || "data/uploads", filename));
    const headers: Record<string, string> = { "Content-Type": types[ext], "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" };
    if (ext === ".pdf") headers["Content-Disposition"] = `inline; filename="${filename}"`;
    return new Response(new Uint8Array(bytes), { headers });
  } catch { return new Response("Not found", { status: 404 }); }
}
