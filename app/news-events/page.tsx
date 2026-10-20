export const metadata:Metadata={title:"News and Events",description:"Seminars, research news and academic activities from the SAM Research Group at BRAC University.",alternates:{canonical:"/news-events/"}};
import type {Metadata} from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import type { NewsPost, Event } from "@prisma/client";

export const dynamic = "force-dynamic";
function prettyDate(value:Date) {
  return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric",timeZone:"Asia/Dhaka"}).format(value);
}
function month(value:Date) {
  return new Intl.DateTimeFormat("en-GB",{month:"short",timeZone:"Asia/Dhaka"}).format(value);
}
function day(value:Date) {
  return new Intl.DateTimeFormat("en-GB",{day:"2-digit",timeZone:"Asia/Dhaka"}).format(value);
}

function Art({src,label,large=false}:{src?:string|null;label:string;large?:boolean}) {
  return <div className={"relative isolate overflow-hidden "+(large?"min-h-[290px] lg:min-h-[390px]":"aspect-[16/10]")+" bg-[#182d46]"}>
    {src ? <img src={src} alt={label} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" loading={large?"eager":"lazy"}/> :
    <div aria-hidden="true" className="absolute inset-0" style={{background:"radial-gradient(circle at 85% 12%,#a94c5980,transparent 50%),linear-gradient(135deg,#152a46,#314c65 52%,#602732)"}}/>}
    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#081323]/45 via-transparent to-transparent"/>
    <span className="absolute bottom-4 left-5 rounded-sm border border-white/40 bg-[#101d30]/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.18em] text-white backdrop-blur-sm">{label}</span>
  </div>;
}
function NewsCard({item,wide=false}:{item:NewsPost;wide?:boolean}) {
  return <article className={"group overflow-hidden border academic-rule surface transition-shadow duration-300 hover:shadow-xl "+(wide?"md:grid md:grid-cols-[1.05fr_.95fr]":"")}>
    <Link href={"/news/"+item.slug} className="block" aria-label={"Read "+item.title}><Art src={item.image} label={item.category||"News"} large={wide}/></Link>
    <div className={"flex flex-col p-6 "+(wide?"lg:p-9":"")}>
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[.08em] text-muted">
        <time dateTime={item.date.toISOString()}>{prettyDate(item.date)}</time>
        {item.featured&&<span className="border-l academic-rule pl-3 text-accent">Featured</span>}
      </div>
      <Link className={"mt-3 block font-serif leading-tight hover:text-accent "+(wide?"text-3xl lg:text-4xl":"text-2xl")} href={"/news/"+item.slug}>{item.title}</Link>
      <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted">{item.summary}</p>
      <Link className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-navy hover:text-accent" href={"/news/"+item.slug}>Read story <span aria-hidden="true">↗</span></Link>
    </div>
  </article>;
}
function EventCard({event,upcoming}:{event:Event;upcoming:boolean}) {
  return <article className="group grid overflow-hidden border academic-rule surface transition-shadow hover:shadow-lg sm:grid-cols-[88px_1fr]">
    <div className="flex flex-col items-center justify-center border-b academic-rule bg-[var(--bg)] px-4 py-5 text-center sm:border-b-0 sm:border-r">
      <span className="text-xs font-bold uppercase tracking-[.15em] text-accent">{month(event.date)}</span>
      <span className="mt-1 font-serif text-4xl leading-none">{day(event.date)}</span>
      <span className="mt-2 text-xs text-muted">{event.date.getUTCFullYear()}</span>
    </div>
    <div className="min-w-0 p-5 sm:p-6">
      <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[.13em] text-accent">
        <span>{upcoming?"Upcoming event":"Event archive"}</span>
        {event.category&&<span className="text-muted">· {event.category}</span>}
      </div>
      <Link href={"/events/"+event.slug} className="mt-2 block font-serif text-xl leading-snug hover:text-accent sm:text-2xl">{event.title}</Link>
      {event.speaker&&<p className="mt-2 text-sm font-medium">{event.speaker}{event.affiliation?" · "+event.affiliation:""}</p>}
      <p className="mt-3 text-xs leading-6 text-muted">{[event.timeText,event.location].filter(Boolean).join(" · ")||prettyDate(event.date)}</p>
      {upcoming&&event.registrationUrl&&<a href={event.registrationUrl} rel="noopener noreferrer" target="_blank" className="mt-4 inline-flex bg-[#172a46] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8c2131]">Registration ↗</a>}
    </div>
  </article>;
}
export default async function Page() {
  const [news,events]=await Promise.all([
    prisma.newsPost.findMany({where:{status:"PUBLISHED"},orderBy:[{featured:"desc"},{date:"desc"},{sortOrder:"asc"}]}),
    prisma.event.findMany({where:{publishStatus:"PUBLISHED"},orderBy:{date:"asc"}}),
  ]);
  const now=new Date();
  const upcoming=events.filter(event=>event.status!=="CANCELLED"&&event.date>=now);
  const past=events.filter(event=>event.status==="COMPLETED"||event.date<now).sort((a,b)=>b.date.getTime()-a.date.getTime());
  const featured=news[0],others=news.slice(1);
  return <main>
    <header className="relative overflow-hidden border-b academic-rule bg-[var(--surface)]">
      <div className="pointer-events-none absolute -right-16 -top-24 h-96 w-96 rounded-full border-[38px] border-[#8c2131]/[.07]" aria-hidden="true"/>
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-40 w-40 rotate-45 border border-[var(--line)]" aria-hidden="true"/>
      <div className="container-site relative py-14 md:py-20">
        <div className="mb-4 text-xs font-bold uppercase tracking-[.24em] text-accent">SAM · Research community</div>
        <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_.6fr]">
          <div><h1 className="font-serif text-[clamp(3.2rem,7vw,6.3rem)] leading-[.97] tracking-[-.05em]">News <span className="text-accent">&</span> Events</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted">Discover the ideas, people and conversations shaping our research community—from new results and recognitions to seminars, workshops and academic gatherings.</p></div>
          <nav className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[.13em]" aria-label="News and event sections">
            <a href="#latest-news" className="border academic-rule px-4 py-3 hover:text-accent">Latest stories ↓</a>
            <a href="#upcoming-events" className="border academic-rule px-4 py-3 hover:text-accent">Events ↓</a>
          </nav>
        </div>
      </div>
    </header>

    <div className="container-site section-space">
      <section id="latest-news" className="scroll-mt-24">
        <div className="mb-8 flex items-end justify-between gap-4 border-b academic-rule pb-5">
          <div><div className="text-xs font-bold uppercase tracking-[.2em] text-accent">From the group</div><h2 className="mt-2 font-serif text-4xl md:text-5xl">Latest news</h2></div>
          <span className="hidden text-xs uppercase tracking-wider text-muted sm:block">{news.length} {news.length===1?"story":"stories"}</span>
        </div>
        {featured?<div className="mb-7"><NewsCard item={featured} wide/></div>:
          <div className="border academic-rule surface p-9 text-muted">New research updates and group announcements will appear here.</div>}
        {others.length>0&&<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{others.map(item=><NewsCard key={item.id} item={item}/>)}</div>}
      </section>
    </div>

    <section id="upcoming-events" className="scroll-mt-24 border-y academic-rule bg-[var(--surface)]">
      <div className="container-site section-space">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="mb-7 border-b academic-rule pb-5"><div className="text-xs font-bold uppercase tracking-[.2em] text-accent">Join the conversation</div><h2 className="mt-2 font-serif text-4xl md:text-5xl">Upcoming events</h2></div>
            {upcoming.length?<div className="space-y-4">{upcoming.map(event=><EventCard key={event.id} event={event} upcoming/>)}</div>:
              <div className="border-l-[3px] border-[#8c2131] bg-[var(--bg)] px-7 py-9"><h3 className="font-serif text-2xl">The next conversation is coming.</h3><p className="mt-3 max-w-md text-sm leading-7 text-muted">Upcoming talks, schools, workshops and seminars will be announced here as dates are confirmed.</p></div>}
          </div>
          <aside className="lg:border-l lg:pl-12 academic-rule">
            <div className="mb-7 border-b academic-rule pb-5"><div className="text-xs font-bold uppercase tracking-[.2em] text-accent">Looking back</div><h2 className="mt-2 font-serif text-4xl">Past events</h2></div>
            {past.length?<div className="space-y-4">{past.slice(0,10).map(e=><EventCard key={e.id} event={e} upcoming={false}/>)}</div>:
              <p className="text-sm leading-7 text-muted">Past lectures, seminars and research gatherings will be collected here.</p>}
          </aside>
        </div>
      </div>
    </section>
    <section className="container-site py-12"><div className="grid gap-5 border-y academic-rule py-9 md:grid-cols-[1fr_auto] md:items-center"><div><div className="text-xs font-bold uppercase tracking-[.2em] text-accent">SAM research community</div><h2 className="mt-2 font-serif text-3xl">Ideas worth sharing.</h2><p className="mt-2 text-sm leading-7 text-muted">News, announcements and academic activities from Strings, Artificial Intelligence and Mathematics at BRAC University.</p></div><Link href="/contact" className="inline-flex w-fit bg-[#172a46] px-5 py-3 text-sm font-semibold text-white">Get in touch ↗</Link></div></section>
  </main>;
}
