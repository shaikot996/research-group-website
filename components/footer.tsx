import Link from "next/link";
export function Footer({ s }: { s: Record<string, string> }) {
  return <footer className="mt-20 border-t academic-rule bg-[#101827] text-slate-200">
    <div className="container-site flex justify-end border-b border-slate-700/60 py-5 text-xs text-slate-300">
      <span className="inline-flex items-center gap-2">Site visits <img src="https://hits.sh/sam.cse.bracu.ac.bd.svg?label=views&color=64748b&labelColor=101827" alt="Live site visit counter" width="92" height="20" loading="lazy" referrerPolicy="no-referrer" /></span>
    </div>
    <div className="container-site grid gap-10 py-10 md:grid-cols-[2fr_1fr_1fr]">
      <div><div className="font-serif text-2xl">{s.groupName}</div><p className="mt-3 text-sm leading-6 text-slate-400">{s.department}<br />{s.university}<br />{s.location}</p><p className="mt-5 text-xs leading-5 text-slate-400">{s.footerNote}</p></div>
      <div className="grid content-start gap-2 text-sm"><strong className="mb-2 text-xs uppercase tracking-[.14em] text-slate-400">Navigate</strong><Link href="/research">Research</Link><Link href="/people">People</Link><Link href="/publications">Publications</Link><Link href="/projects">Projects</Link><Link href="/news-events">News & Events</Link></div>
      <div className="grid content-start gap-2 text-sm"><strong className="mb-2 text-xs uppercase tracking-[.14em] text-slate-400">Contact</strong>{s.contactEmail && <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>}<Link href="/contact">Contact the group</Link><a href={s.universityUrl}>University website</a><Link href="/feed.xml">News RSS</Link></div>
    </div>
    <div className="container-site border-t border-slate-700/60 py-5 text-xs text-slate-400">
      <span>© {new Date().getUTCFullYear()} SAM Research Group</span>
    </div>
  </footer>;
}
