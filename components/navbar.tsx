import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const links = [
  ["Research", "/research"],
  ["People", "/people"],
  ["Publications", "/publications"],
  ["Projects", "/projects"],
  ["News & Events", "/news-events"],
  ["Join Us", "/join"],
  ["About", "/about"],
  ["Contact", "/contact"],
] as const;

export function Navbar({ name, logo }: { name: string; logo: string }) {
  return (
    <header className="surface sticky top-0 z-50 border-b academic-rule">
      <div className="container-site flex min-h-20 items-center justify-between gap-6">
        <Link href="/" className="focus-ring flex items-center gap-3">
          <span className="border border-current px-2 py-1 font-serif text-sm font-bold tracking-[.15em] text-navy">{logo}</span>
          <span className="hidden max-w-[300px] truncate text-sm font-semibold lg:block">{name}</span>
        </Link>

        <nav className="hidden items-center gap-5 xl:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm text-muted hover:text-navy">{label}</Link>
          ))}
          <Link href="/search" className="text-sm text-muted">Search</Link>
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 xl:hidden">
          <ThemeToggle />
          <details className="relative">
            <summary className="cursor-pointer list-none border academic-rule px-3 py-2 text-sm">Menu</summary>
            <nav className="surface absolute right-0 top-[calc(100%+.5rem)] z-[60] grid min-w-56 border academic-rule shadow-xl">
              {links.map(([label, href]) => (
                <Link key={href} href={href} className="border-b academic-rule px-5 py-3 text-sm">{label}</Link>
              ))}
              <Link href="/search" className="px-5 py-3 text-sm">Search</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
