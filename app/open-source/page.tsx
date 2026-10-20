import type { Metadata } from "next";
import Link from "next/link";

export const metadata:Metadata={title:"Open Source Research Software",description:"Open-source scientific software, computational tools and mathematical research from the SAM Research Group.",alternates:{canonical:"/open-source/"}};

export default function OpenSourceHub() {
  return <main>
    <section className="relative isolate overflow-hidden border-b academic-rule bg-[#0b1628] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{background:"radial-gradient(ellipse at 74% 52%, #385073 0%, transparent 57%), linear-gradient(120deg, #07111f, #172c46)"}}/>
      <div className="container-site relative grid gap-8 py-14 md:py-20 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.23em] text-[#e9b2ba]"><span className="h-px w-8 bg-[#d9a0a8]"/>SAM · Computational Research</div>
          <h1 className="font-serif text-[clamp(3.2rem,7vw,6rem)] leading-[.98] tracking-[-.045em]">Open Source <span className="text-[#edb9bc]">Hub.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-200">Research tools built to make calculations transparent, reproducible, and useful beyond a single paper.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/open-source/ray" className="focus-ring bg-[#8c2131] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#a72c40]">Explore RAY ↗</Link>
            <a href="https://github.com/shaikot996/RAY" target="_blank" rel="noopener noreferrer" className="focus-ring border border-slate-500/70 px-5 py-3 text-sm font-semibold text-white transition hover:border-white">Source repository ↗</a>
          </div>
        </div>
        <div className="relative overflow-hidden border border-white/10 bg-[#08121e] shadow-[0_30px_65px_#0005]">
          <img src="/images/open-source/ray-spacetime-hd.svg" alt="Subtle illustration of a black hole and curved spacetime grid, without text" className="aspect-[1.7] h-full w-full object-cover" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0b1628]/25 via-transparent to-[#0b1628]/20"/>
        </div>
      </div>
    </section>

    <section className="container-site section-space">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-4 border-b academic-rule pb-5">
        <div><div className="text-xs font-bold uppercase tracking-[.18em] text-accent">Featured project</div><h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">Software for scientific discovery</h2></div>
        <span className="text-xs uppercase tracking-[.14em] text-muted">Open source · Reproducible research</span>
      </div>
      <article className="grid overflow-hidden border academic-rule bg-[var(--surface)] shadow-sm lg:grid-cols-[.93fr_1.07fr]">
        <div className="relative min-h-[240px] bg-[#081725] sm:min-h-[350px]">
          <img src="/images/open-source/ray-spacetime-hd.svg" alt="Black hole and spacetime geometry visualization" className="absolute inset-0 h-full w-full object-cover" loading="lazy"/>
          <span className="absolute bottom-5 left-5 border border-white/50 bg-[#0a1927]/85 px-3 py-2 text-[11px] font-bold uppercase tracking-[.16em] text-white">Research software · Wolfram Language</span>
        </div>
        <div className="flex flex-col p-7 sm:p-9 lg:p-11">
          <div className="text-xs font-bold uppercase tracking-[.16em] text-accent">Featured · Development release v1.0.0</div>
          <h3 className="mt-5 font-serif text-6xl tracking-[-.045em]">RAY</h3>
          <p className="mt-2 font-serif text-xl text-navy">Relativity and Geometry Toolkit</p>
          <p className="mt-6 max-w-lg text-sm leading-8 text-muted">An explicit-component tensor geometry and general relativity toolkit for Wolfram Language. Define a metric, explore curvature and invariants, and check congruence kinematics and the Raychaudhuri equation.</p>
          <p className="mt-4 text-xs text-muted">Created and maintained by <strong className="font-semibold text-[var(--text)]">Shaikot Jahan Shuvo</strong> · MIT License</p>
          <div className="mt-7 flex flex-wrap gap-2 text-[11px] font-semibold text-muted">
            {["Tensor geometry","Raychaudhuri kinematics","Arbitrary dimensions","Symbolic computation"].map(x=><span key={x} className="border academic-rule px-3 py-2">{x}</span>)}
          </div>
          <div className="mt-auto flex flex-wrap gap-3 pt-8">
            <Link href="/open-source/ray" className="focus-ring bg-[#172a46] px-5 py-3 text-sm font-semibold text-white hover:bg-[#8c2131]">Features & roadmap ↗</Link>
            <a href="https://github.com/shaikot996/RAY" target="_blank" rel="noopener noreferrer" className="focus-ring border academic-rule px-5 py-3 text-sm font-semibold hover:text-accent">View code ↗</a>
          </div>
        </div>
      </article>
    </section>

    <section className="border-y academic-rule bg-[var(--surface)] py-12 md:py-16">
      <div className="container-site grid gap-10 md:grid-cols-[.7fr_1.3fr] md:items-center">
        <div><div className="text-xs font-bold uppercase tracking-[.16em] text-accent">A growing library</div><h2 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">Built for open and reproducible science.</h2></div>
        <p className="max-w-2xl text-sm leading-8 text-muted">The hub will bring together documented research packages, tested numerical methods, and educational examples. Projects are listed when there is publicly accessible code and clear documentation; proposed work is identified separately from working software.</p>
      </div>
    </section>
  </main>;
}
