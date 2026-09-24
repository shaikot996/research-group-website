import Link from "next/link";
export function Footer({ s }: { s: Record<string, string> }) {
  return <footer className="mt-20 border-t academic-rule bg-[#101827] text-slate-200">
    <div className="container-site grid gap-10 py-12 md:grid-cols-[2fr_1fr_1fr]">
      <div><div className="font-serif text-2xl">{s.groupName}</div><p className="mt-3 text-sm leading-6 text-slate-400">{s.department}<br />{s.university}<br />{s.location}</p><p className="mt-5 text-xs leading-5 text-slate-400">{s.footerNote}</p></div>
      <div className="grid content-start gap-2 text-sm"><strong className="mb-2 text-xs uppercase tracking-[.14em] text-slate-400">Navigate</strong><Link href="/research">Research</Link><Link href="/people">People</Link><Link href="/publications">Publications</Link><Link href="/projects">Projects</Link><Link href="/news-events">News & Events</Link></div>
      <div className="grid content-start gap-2 text-sm"><strong className="mb-2 text-xs uppercase tracking-[.14em] text-slate-400">Contact</strong>{s.contactEmail && <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>}<Link href="/contact">Contact the group</Link><a href={s.universityUrl}>University website</a><Link href="/feed.xml">News RSS</Link></div>
    </div>
  </footer>;
}
