"use client";
import { useState } from "react";
export function Portrait({ name, slug, photo, sizes }: { name: string; slug: string; photo?: string | null; sizes?: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = photo || `/portraits/${encodeURIComponent(slug)}`;
  const src = failedSource === source ? `/portraits/${encodeURIComponent(slug)}` : source;
  return <img src={src} alt={`Portrait of ${name}`} sizes={sizes} className="absolute inset-0 h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedSource(source)} />;
}
