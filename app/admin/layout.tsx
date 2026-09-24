import { notFound } from "next/navigation";
import { adminEnabled } from "@/lib/features";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!adminEnabled()) notFound();
  return children;
}
