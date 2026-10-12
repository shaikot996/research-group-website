"use client";
import { useState } from "react";
export function Portrait({ name, slug, photo, sizes, revision }: { name: string; slug: string; photo?: string | null; sizes?: string; revision?: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const portraitUrl = `/portraits/${encodeURIComponent(slug)}${revision ? `?v=${encodeURIComponent(revision)}` : ""}`;
  const source = photo || portraitUrl;
  const src = failedSource === source ? portraitUrl : source;
  return <img src={src} alt={`Portrait of ${name}`} sizes={sizes} className="absolute inset-0 h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedSource(source)} />;
}
