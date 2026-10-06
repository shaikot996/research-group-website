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
      <div className="container-site flex min-h-20 items-center justify-between gap-5">
        <Link href="/" className="focus-ring flex min-w-0 items-center gap-3" aria-label={`${name} home`}>
          <img
            src="/brand/bracu-logo.png"
            alt="BRAC University"
            className="h-12 w-14 shrink-0 object-contain sm:h-14 sm:w-16"
          />
          <span className="border-l academic-rule pl-3">
            <span className="block font-serif text-base font-bold tracking-[.08em] text-navy">{logo}</span>
            <span className="hidden max-w-[320px] truncate text-xs font-semibold text-muted lg:block">{name}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 xl:flex" aria-label="Primary navigation">
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
            <nav className="surface absolute right-0 top-[calc(100%+.5rem)] z-[60] grid min-w-56 border academic-rule shadow-xl" aria-label="Mobile navigation">
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
