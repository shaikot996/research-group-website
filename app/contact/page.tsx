import Link from "next/link";
import { getSiteSettings } from "@/lib/site";
import { prisma } from "@/lib/db";
import { SectionHeader } from "@/components/ui";
export default async function Page() {
  const [s, people] = await Promise.all([getSiteSettings(), prisma.person.findMany({ where: { status: "PUBLISHED", role: "PRINCIPAL_INVESTIGATOR", email: { not: null } }, orderBy: { sortOrder: "asc" } })]);
  return <div className="container-site section-space"><SectionHeader eyebrow="Contact" title="Get in touch" description="For research inquiries, collaborations and student opportunities, contact a principal investigator or a member whose work matches your interests." />
    <div className="grid gap-14 lg:grid-cols-[.65fr_1.35fr]">
      <aside className="border-t-2 academic-rule pt-5"><div className="font-serif text-2xl">{s.groupName}</div><p className="mt-3 text-sm leading-6 text-muted">{s.department}<br />{s.university}<br />{s.location}</p>{s.contactEmail && <a className="mt-5 inline-block link-academic" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>}</aside>
      <div>{people.map(p => <article key={p.id} className="border-t academic-rule py-6"><Link className="font-serif text-2xl" href={`/people/${p.slug}`}>{p.name}</Link><p className="mt-2 text-sm text-muted">{p.title}</p><a className="mt-4 inline-block link-academic" href={`mailto:${p.email}`}>{p.email}</a></article>)}<Link className="mt-8 inline-block link-academic" href="/people">All group members →</Link></div>
    </div>
  </div>;
}
