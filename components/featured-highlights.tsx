"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    eyebrow: "International Recognition · 2026",
    title: "Spirit of Abdus Salam Award",
    text: "ICTP recognised Mahbubul Alam Majumdar for efforts to strengthen Bangladesh's scientific and educational foundations.",
    image: "/people/mahbubul-alam-majumdar/profile.jpg",
    source: "ICTP",
    href: "https://www.ictp.it/news/2026/1/spirit-salam-2026-awardees-announced",
  },
  {
    eyebrow: "National Recognition · 2026",
    title: "Professor Mahbubul Alam Majumdar — Ekushey Padak",
    text: "Recognised in the Education category for promoting mathematics among young people and the Mathematics Olympiad movement.",
    image: "/people/mahbubul-alam-majumdar/profile.jpg",
    source: "BRAC University",
    href: "https://www.bracu.ac.bd/news/professor-mahbubul-alam-majumdar-assistant-professor-shams-mansoor-ghani-named-ekushey-padak",
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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="surface border-y academic-rule" aria-label="Featured highlights">
      <div className="container-site section-space py-12 md:py-16">
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-[.18em] text-accent">Featured Highlights</div>
          <h2 className="mt-2 font-serif text-3xl md:text-4xl">Research, education and community</h2>
        </div>

        <div aria-live="polite" aria-atomic="true">
          {slides.map((slide, i) => (
            <article
              key={slide.title}
              data-featured-slide
              aria-hidden={i === index ? undefined : true}
              className={`${i === index ? "grid" : "hidden"} overflow-hidden border academic-rule lg:grid-cols-[1.15fr_.85fr]`}
            >
              <div className="relative min-h-64 bg-slate-200 lg:min-h-[390px]">
                <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <div className="flex min-h-64 flex-col justify-center p-7 md:p-10">
                <div className="text-xs font-bold uppercase tracking-[.16em] text-accent">{slide.eyebrow}</div>
                <h3 className="mt-4 font-serif text-3xl leading-tight md:text-4xl">{slide.title}</h3>
                <p className="mt-5 leading-7 text-muted">{slide.text}</p>
                <a className="link-academic mt-6 w-fit text-sm" href={slide.href} target="_blank" rel="noopener noreferrer">
                  Source: {slide.source} ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
