import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "RAY — Relativity and Geometry Toolkit",
  description: "RAY v1.0.0: current tensor geometry and Raychaudhuri features, installation, examples, and planned implementations.",
};

const features = [
  {title:"Tensor geometry",items:["Arbitrary-dimensional explicit metrics and metric signatures","Christoffel symbols and Riemann, Ricci, Einstein, and Weyl tensors","Ricci scalar, Kretschmann invariant, and quadratic Ricci/Weyl invariants","Configurable raised, lowered, and mixed tensor indices"]},
  {title:"Congruence & Raychaudhuri",items:["Normalized non-null congruences and covariant derivatives","Expansion, acceleration, shear, and vorticity","Shear and vorticity scalars; Ricci contraction along the congruence","Raychaudhuri terms, equation residual, and kinematical consistency checks"]},
  {title:"Research workflow",items:["Nonzero component tables and notebook-friendly formatted output","Access to raw symbolic expressions for further calculations","One-command geometry, kinematics, and full reports","Example calculations and regression tests"]},
];
const roadmap = [
  {step:"Near term",items:["More regression tests, validation, and example spacetimes","Improved tensor symmetry handling, sparse calculations, and performance","Expanded documentation and benchmark coverage"]},
  {step:"Geometry & interoperability",items:["Coordinate transformations, geodesics and geodesic deviation","Tetrads/vielbeins, differential forms, spin connections, and ADM 3+1","xAct import/export and abstract-index interoperability"]},
  {step:"Higher-dimensional gravity",items:["p-forms, Hodge duality, flux stress tensors, and Bianchi identities","Warped products, dimensional reduction and compactification tools","Gamma matrices, Killing spinors and supergravity equations of motion"]},
];

export default function RayProject() {
  return <main>
    <section className="border-b academic-rule bg-[#0a1525] text-white">
      <div className="container-site py-6"><Link href="/open-source" className="focus-ring text-xs font-semibold uppercase tracking-[.17em] text-[#edb9bc] hover:text-white">← Open Source Hub</Link></div>
      <div className="container-site grid gap-9 pb-14 pt-4 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:pb-20">
        <div>
          <div className="text-xs font-bold uppercase tracking-[.2em] text-[#edb9bc]">Featured research software · Wolfram Language</div>
          <h1 className="mt-5 font-serif text-[clamp(4.5rem,11vw,8rem)] leading-none tracking-[-.06em]">RAY<span className="text-[#dca8ae]">.</span></h1>
          <p className="mt-3 font-serif text-2xl leading-snug text-slate-100">Relativity and Geometry Toolkit</p>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">Explicit-component tensor geometry, curvature invariants, and Raychaudhuri kinematics for Mathematica and Wolfram Language.</p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-300"><span>Version 1.0.0</span><span>MIT license</span><span>Active development</span></div>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="https://github.com/shaikot996/RAY" target="_blank" rel="noopener noreferrer" className="focus-ring bg-[#8c2131] px-6 py-3 text-sm font-semibold text-white hover:bg-[#a72c40]">View on GitHub ↗</a>
            <a href="https://github.com/shaikot996/RAY/blob/main/README.md" target="_blank" rel="noopener noreferrer" className="focus-ring border border-slate-500 px-6 py-3 text-sm font-semibold text-white hover:border-white">Documentation ↗</a>
          </div>
        </div>
        <div className="overflow-hidden border border-white/15 bg-[#07111e] shadow-2xl"><img src="/images/open-source/ray-spacetime.webp" alt="Text-free black hole illustration with curved spacetime grid" className="aspect-[1.65] w-full object-cover"/></div>
      </div>
    </section>
    <section className="container-site section-space">
      <div className="mb-8 max-w-3xl"><div className="text-xs font-bold uppercase tracking-[.2em] text-accent">Available in v1.0.0</div><h2 className="mt-3 font-serif text-4xl md:text-5xl">Current working features</h2><p className="mt-4 text-sm leading-7 text-muted">These capabilities are documented in the current public release. RAY works with explicit metric components rather than requiring an abstract-index workflow.</p></div>
      <div className="grid gap-5 lg:grid-cols-3">
        {features.map((group,index)=><article key={group.title} className="border academic-rule bg-[var(--surface)] p-6 sm:p-7">
          <div className="text-xs font-bold tracking-[.17em] text-accent">0{index+1} / IMPLEMENTED</div>
          <h3 className="mt-3 font-serif text-2xl">{group.title}</h3>
          <ul className="mt-5 space-y-3">{group.items.map(item=><li key={item} className="flex items-start gap-3 text-sm leading-6 text-muted"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8c2131]"/><span>{item}</span></li>)}</ul>
        </article>)}
      </div>
    </section>
    <section className="border-y academic-rule bg-[var(--surface)]">
      <div className="container-site grid gap-10 py-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div><div className="text-xs font-bold uppercase tracking-[.2em] text-accent">Getting started</div><h2 className="mt-3 font-serif text-4xl">A straightforward Mathematica workflow.</h2><p className="mt-5 text-sm leading-7 text-muted">Install RAY as a Wolfram application or paclet, then load the package, define a metric, and inspect its geometric quantities. See the repository for full installation options.</p><a href="https://github.com/shaikot996/RAY/blob/main/README.md#installation" target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-sm font-semibold text-navy underline hover:text-accent">Installation guide ↗</a></div>
        <div className="overflow-hidden border border-[#253a51] bg-[#0c192b] p-6 text-slate-100 shadow-sm">
          <div className="mb-5 flex items-center justify-between border-b border-slate-600 pb-3 text-xs"><span className="font-bold tracking-[.15em] text-slate-300">WOLFRAM LANGUAGE</span><span className="text-slate-500">Quick start</span></div>
          <pre className="overflow-x-auto text-sm leading-9"><code>{'Needs["RAY\x60"]\nRAYHelp[]\n\n(* After defining a metric *)\nRAYRicciScalar[]\nRAYKretschmann[]\nRAYRaychaudhuriTerms[]'}</code></pre>
          <a href="https://github.com/shaikot996/RAY/tree/main/Examples" target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-xs font-semibold text-[#f0bbc5] hover:text-white">See complete examples ↗</a>
        </div>
      </div>
    </section>
    <section className="container-site section-space">
      <div className="max-w-3xl"><div className="text-xs font-bold uppercase tracking-[.2em] text-accent">Development roadmap</div><h2 className="mt-3 font-serif text-4xl md:text-5xl">Future implementation</h2><p className="mt-4 text-sm leading-7 text-muted"><strong className="text-[var(--text)]">Planned or exploratory — not available in v1.0.0.</strong> The roadmap describes intended research directions, not guaranteed features or release dates.</p></div>
      <div className="mt-9 grid gap-5 lg:grid-cols-3">
        {roadmap.map((group,index)=><article key={group.step} className="border academic-rule bg-[var(--surface)] p-6 sm:p-7">
          <div className="text-xs font-bold tracking-[.17em] text-muted">ROADMAP / 0{index+1}</div><h3 className="mt-3 font-serif text-2xl">{group.step}</h3>
          <ul className="mt-5 space-y-3">{group.items.map(item=><li key={item} className="flex items-start gap-3 text-sm leading-6 text-muted"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 border border-[#8c2131]"/><span>{item}</span></li>)}</ul>
        </article>)}
      </div>
      <div className="mt-8 flex flex-wrap gap-3"><a href="https://github.com/shaikot996/RAY/blob/main/ROADMAP.md" target="_blank" rel="noopener noreferrer" className="focus-ring border academic-rule px-5 py-3 text-sm font-semibold hover:text-accent">Full development roadmap ↗</a><a href="https://github.com/shaikot996/RAY/blob/main/Tests/RAY_Tests.wl" target="_blank" rel="noopener noreferrer" className="focus-ring border academic-rule px-5 py-3 text-sm font-semibold hover:text-accent">Regression tests ↗</a></div>
    </section>
    <section className="border-t academic-rule bg-[var(--surface)]"><div className="container-site grid gap-5 py-10 md:grid-cols-[1fr_auto] md:items-center"><div><h2 className="font-serif text-2xl">Author & maintainer</h2><p className="mt-2 text-sm text-muted">Shaikot Jahan Shuvo · Original author, mathematical direction, and maintenance. Featured by the SAM Research Group; repository ownership remains with its creator.</p></div><a href="https://github.com/shaikot996/RAY" target="_blank" rel="noopener noreferrer" className="focus-ring w-fit bg-[#172a46] px-5 py-3 text-sm font-semibold text-white hover:bg-[#8c2131]">Repository & contributions ↗</a></div></section>
  </main>;
}
