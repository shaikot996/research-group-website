import Link from "next/link";
import {notFound} from "next/navigation";
import {prisma} from "@/lib/db";
import {Breadcrumbs,RichText} from "@/components/ui";
import {editorialGallery,editorialDate} from "@/lib/editorial-view";
export const dynamic="force-dynamic";

export default async function Page({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const news=await prisma.newsPost.findFirst({where:{slug,status:"PUBLISHED"}});
  if(!news)notFound();
  const gallery=editorialGallery(news.gallery);
  return <main className="container-site section-space">
    <article className="mx-auto max-w-5xl">
      <Breadcrumbs items={[{label:"News & Events",href:"/news-events"},{label:news.title}]}/>
      <header className="max-w-4xl">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[.17em] text-accent">
          <span>{news.category||"Research News"}</span><span aria-hidden="true" className="text-muted">/</span>
          <time className="text-muted" dateTime={news.date.toISOString()}>{editorialDate(news.date)}</time>
        </div>
        <h1 className="mt-6 font-serif text-[clamp(2.7rem,5.5vw,5.2rem)] leading-[1.05] tracking-[-.04em]">{news.title}</h1>
        <p className="mt-8 border-l-[3px] border-[#8c2131] pl-6 text-xl leading-9 text-muted">{news.summary}</p>
      </header>
      {news.image&&<figure className="mt-10 overflow-hidden border academic-rule"><img className="max-h-[600px] w-full object-cover" src={news.image} alt={news.title}/></figure>}
      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_180px]">
        <div className="prose-academic max-w-3xl whitespace-pre-line text-base"><RichText text={news.body}/></div>
        <aside className="border-t academic-rule pt-5 text-sm lg:border-l lg:border-t-0 lg:pl-6">
          <div className="text-xs font-bold uppercase tracking-[.15em] text-accent">Published</div>
          <div className="mt-2 text-muted">{editorialDate(news.date)}</div>
          {news.externalUrl&&<a href={news.externalUrl} rel="noopener noreferrer" target="_blank" className="mt-7 block link-academic">Original source ↗</a>}
          <Link className="mt-7 block link-academic" href="/news-events">← More news & events</Link>
        </aside>
      </div>
      {gallery.length>0&&<section className="mt-16 border-t academic-rule pt-10">
        <div className="mb-7 text-xs font-bold uppercase tracking-[.2em] text-accent">From the gallery</div>
        <h2 className="mb-7 font-serif text-3xl">Moments & perspectives</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {gallery.map((src,i)=><a href={src} target="_blank" rel="noopener noreferrer" key={src} className="block overflow-hidden border academic-rule" aria-label={"Open gallery image "+(i+1)}>
            <img src={src} alt={news.title+" — photo "+(i+1)} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-105"/>
          </a>)}
        </div>
      </section>}
    </article>
  </main>;
}
