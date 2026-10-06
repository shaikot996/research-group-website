"use client";

import { useEffect, useRef, useState } from "react";

const slides = [
  {
    eyebrow: "National Recognition · 2026",
    title: "Professor Mahbubul Alam Majumdar — Ekushey Padak",
    text: "Recognised in the Education category for promoting mathematics among young people and the Mathematics Olympiad movement.",
    image: "/people/mahbubul-alam-majumdar/profile.jpg",
    source: "BRAC University",
    href: "https://www.bracu.ac.bd/news/professor-mahbubul-alam-majumdar-assistant-professor-shams-mansoor-ghani-named-ekushey-padak",
  },
  {
    eyebrow: "International Recognition · 2026",
    title: "Spirit of Abdus Salam Award",
    text: "ICTP recognised Mahbubul Alam Majumdar for efforts to strengthen Bangladesh's scientific and educational foundations.",
    image: "/people/mahbubul-alam-majumdar/profile.jpg",
    source: "ICTP",
    href: "https://www.ictp.it/news/2026/1/spirit-salam-2026-awardees-announced",
  },
  {
    eyebrow: "Bangladesh at IMO · 2026",
    title: "Six students, six medals — 121 points at IMO 2026",
    text: "Bangladesh earned one silver and five bronze medals, finishing 39th among 117 teams. All six team members returned with medals.",
    image: "/people/mahbubul-alam-majumdar/profile.jpg",
    source: "Official IMO results",
    href: "https://www.imo-official.org/country_team_r.aspx?code=BGD&column=p5&order=desc",
  },
  {
    eyebrow: "Academic Programme · 2025",
    title: "Jamal Nazrul Islam Memorial Winter School",
    text: "BRAC University and ICTP Physics Without Frontiers brought leading researchers together in Savar for advanced lectures on cosmology, string theory and black holes.",
    image: "/events/jni-2025/jni1.jpg",
    source: "ICTP programme",
    href: "https://indico.ictp.it/event/10932/",
  },
] as const;

export function FeaturedHighlights() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), 8000);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  const go = (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length);
  const slide = slides[index];

  return <section
    ref={sectionRef}
    className="surface border-y academic-rule"
    aria-roledescription="carousel"
    aria-label="Featured highlights"
    tabIndex={0}
    onMouseEnter={() => setPaused(true)}
    onMouseLeave={() => setPaused(false)}
    onFocusCapture={() => setPaused(true)}
    onBlurCapture={(event) => { if (!sectionRef.current?.contains(event.relatedTarget as Node | null)) setPaused(false); }}
    onKeyDown={(event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
    }}
  >
    <div className="container-site section-space py-12 md:py-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div><div className="text-xs font-bold uppercase tracking-[.18em] text-accent">Featured Highlights</div><h2 className="mt-2 font-serif text-3xl md:text-4xl">Research, education and community</h2></div>
        <div className="flex gap-2" aria-label="Carousel controls">
          <button type="button" onClick={() => go(-1)} className="focus-ring border academic-rule px-3 py-2" aria-label="Previous highlight">←</button>
          <button type="button" onClick={() => go(1)} className="focus-ring border academic-rule px-3 py-2" aria-label="Next highlight">→</button>
        </div>
      </div>
      <article className="grid overflow-hidden border academic-rule lg:grid-cols-[1.15fr_.85fr]" aria-live="polite">
        <div className="relative min-h-64 bg-slate-200 lg:min-h-[390px]">
          <img key={slide.image} src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="flex min-h-64 flex-col justify-center p-7 md:p-10">
          <div className="text-xs font-bold uppercase tracking-[.16em] text-accent">{slide.eyebrow}</div>
          <h3 className="mt-4 font-serif text-3xl leading-tight md:text-4xl">{slide.title}</h3>
          <p className="mt-5 leading-7 text-muted">{slide.text}</p>
          <a className="link-academic mt-6 w-fit text-sm" href={slide.href} target="_blank" rel="noopener noreferrer">Source: {slide.source} ↗</a>
        </div>
      </article>
      <div className="mt-5 flex items-center justify-center gap-2" aria-label="Choose highlight">
        {slides.map((item, i) => <button key={item.title} type="button" onClick={() => setIndex(i)} className={`focus-ring h-2.5 w-2.5 rounded-full border academic-rule ${i === index ? "bg-current" : "surface"}`} aria-label={`Show highlight ${i + 1}`} aria-current={i === index ? "true" : undefined} />)}
      </div>
    </div>
  </section>;
}
