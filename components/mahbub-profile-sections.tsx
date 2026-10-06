import { SectionHeader } from "@/components/ui";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

export function MahbubProfileSections() {
  return <>
    <section className="mt-14">
      <SectionHeader eyebrow="Academic Leadership" title="Research & Academic Leadership" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="border-t-2 academic-rule pt-5"><h3 className="font-serif text-2xl">Theoretical physics</h3><p className="mt-3 leading-7 text-muted">Research spanning string cosmology, brane dynamics, quantum aspects of black holes and quantum information, alongside wider interests in computation and mathematical science.</p><a className="link-academic mt-4 inline-block text-sm" href="https://www.bracu.ac.bd/about/people/mahbubul-alam-majumdar-phd" {...ext}>BRAC University profile ↗</a></div>
        <div className="border-t-2 academic-rule pt-5"><h3 className="font-serif text-2xl">Scientific education</h3><p className="mt-3 leading-7 text-muted">Dean of BRAC University's School of Data & Computational Sciences and a long-term organiser of advanced mathematics and theoretical-physics training in Bangladesh.</p><a className="link-academic mt-4 inline-block text-sm" href="https://indico.ictp.it/event/10932/" {...ext}>ICTP programme ↗</a></div>
      </div>
    </section>

    <section className="mt-14">
      <SectionHeader eyebrow="Bangladesh Mathematical Olympiad" title="Mathematics Olympiad Leadership" description="Bangladesh first entered the IMO in 2005. Official IMO records list Mahbub Majumdar as the country's current official contact and as team leader across the programme's long-running competitive record." />
      <div className="grid gap-px overflow-hidden border academic-rule bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["2006 → 2026", "Long-running team leadership", "https://www.imo-official.org/country_team_r.aspx?code=BGD"],
          ["2018", "First Bangladesh IMO gold — plus 3 bronze medals and 2 Honourable Mentions", "https://www.imo-official.org/country_individual_r.aspx?code=BGD&column=award&gender=hide&nameform=western&order=desc"],
          ["2026", "First 6-of-6 medal result: 1 silver + 5 bronze", "https://online.thedailystar.net/campus/noticeboard/news/bangladesh-celebrates-historic-success-the-67th-international-mathematical-olympiad-4238386"],
          ["121 points", "Highest Bangladesh team score; rank 39 of 117 in 2026", "https://www.tbsnews.net/features/panorama/how-bangladesh-went-3-points-6-medals-international-math-olympiad-1526201"],
        ].map(([value,label,href]) => <a key={value+label} href={href} {...ext} className="surface p-5 hover:text-accent"><strong className="font-serif text-3xl">{value}</strong><span className="mt-2 block text-sm leading-6 text-muted">{label}</span><span className="mt-3 block text-xs underline">Source ↗</span></a>)}
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
        <p className="leading-7 text-muted">Through 2026, the official IMO country profile records Bangladesh's cumulative contestant awards as <strong className="text-[var(--text)]">1 gold, 8 silver, 45 bronze and 47 Honourable Mentions</strong>. These are national-team achievements under a broader programme of coaching, selection and mentorship—not medals personally awarded to the coach.</p>
        <a className="link-academic text-sm" href="https://www.imo-official.org/countries/BGD/" {...ext}>Bangladesh IMO profile ↗</a>
      </div>
    </section>

    <section className="mt-14">
      <SectionHeader eyebrow="Honours" title="National & International Recognition" />
      <div className="grid gap-8 md:grid-cols-2">
        <article className="border-t-2 academic-rule pt-5"><div className="text-xs font-bold uppercase tracking-[.14em] text-accent">2026 · Education</div><h3 className="mt-2 font-serif text-2xl">Ekushey Padak</h3><p className="mt-3 text-sm leading-7 text-muted">Awarded in the Education category. BRAC University identifies the recognition with his work promoting mathematics among young people and the Mathematics Olympiad.</p><div className="mt-4 flex flex-wrap gap-4 text-sm"><a className="link-academic" href="https://www.bssnews.net/news/361407" {...ext}>Government announcement via BSS ↗</a><a className="link-academic" href="https://www.bracu.ac.bd/news/professor-mahbubul-alam-majumdar-assistant-professor-shams-mansoor-ghani-named-ekushey-padak" {...ext}>BRAC context ↗</a></div></article>
        <article className="border-t-2 academic-rule pt-5"><div className="text-xs font-bold uppercase tracking-[.14em] text-accent">2026 · ICTP</div><h3 className="mt-2 font-serif text-2xl">Spirit of Abdus Salam Award</h3><p className="mt-3 text-sm leading-7 text-muted">ICTP recognised his efforts to strengthen Bangladesh's scientific and educational foundations, including sustained work in education and scientific community building.</p><a className="link-academic mt-4 inline-block text-sm" href="https://www.ictp.it/news/2026/1/spirit-salam-2026-awardees-announced" {...ext}>ICTP announcement ↗</a></article>
      </div>
    </section>
  </>;
}
