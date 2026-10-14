import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const links = [
  ["Research", "/research"],
  ["People", "/people"],
  ["Publications", "/publications"],
  ["Projects", "/projects"],
  ["Open Source", "/open-source"],
  ["News & Events", "/news-events"],
  ["Research Radar", "/research-radar"],
  ["Join Us", "/join"],
  ["About", "/about"],
  ["Contact", "/contact"],
] as const;

export function Navbar({ name, logo }: { name: string; logo: string }) {
  return (
    <header className="surface sticky top-0 z-50 border-b academic-rule">
      <div className="container-site flex min-h-[76px] items-center justify-between gap-4">
        <Link href="/" className="focus-ring flex min-w-0 items-center gap-3" aria-label={name + " home"}>
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-white p-1">
            <img src="/brand/bracu-logo.png" alt="BRAC University"
              className="h-full w-full object-contain"/>
          </span>
          <span className="min-w-0 border-l academic-rule pl-3">
            <span className="block font-serif text-lg font-bold tracking-[.08em] text-navy">{logo}</span>
            <span className="block max-w-[420px] truncate text-xs font-semibold text-muted">{name}</span>
          </span>
        </Link>
        <div className="hidden items-center gap-3 xl:flex">
          <Link href="/search" className="focus-ring px-3 py-2 text-xs font-semibold text-muted hover:text-accent">Search ↗</Link>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-2 xl:hidden">
          <ThemeToggle />
          <details className="relative">
            <summary className="focus-ring cursor-pointer list-none border academic-rule px-3 py-2 text-sm font-semibold">Menu ▾</summary>
            <nav className="surface absolute right-0 top-[calc(100%+.5rem)] z-[60] grid min-w-60 border academic-rule py-1 shadow-xl" aria-label="Mobile navigation">
              {links.map(([label,href])=><Link key={href} href={href} className="focus-ring border-b academic-rule px-5 py-3 text-sm hover:text-accent">{label}</Link>)}
              <Link href="/search" className="focus-ring px-5 py-3 text-sm hover:text-accent">Search</Link>
            </nav>
          </details>
        </div>
      </div>
      <nav className="hidden border-t academic-rule xl:block" aria-label="Primary navigation">
        <div className="container-site flex min-h-[48px] flex-nowrap items-center justify-center gap-5">
          {links.map(([label,href])=>
            <Link key={href} href={href} className="focus-ring whitespace-nowrap border-b-2 border-transparent px-1 py-3 text-[13px] font-semibold text-muted transition-colors hover:border-[#8c2131] hover:text-accent">{label}</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
