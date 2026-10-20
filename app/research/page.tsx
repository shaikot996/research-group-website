export const metadata:Metadata={title:"Research Areas",description:"String theory, mathematical physics, quantum gravity, cosmology and scientific computing research at SAM Research Group, BRAC University.",alternates:{canonical:"/research/"}};
import type {Metadata} from "next";
import { prisma } from "@/lib/db";
import { AreaCard, SectionHeader } from "@/components/ui";
import { ResearchSnapshot } from "@/components/research-snapshot";
import { getGroupCitationStats } from "@/lib/group-stats";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [areas, peopleCount, localPubCount, projectCount, citationStats] = await Promise.all([
    prisma.researchArea.findMany({ where: { status: "PUBLISHED" }, orderBy: { sortOrder: "asc" } }),
    prisma.person.count({ where: { status: "PUBLISHED" } }),
    prisma.publication.count({ where: { status: "PUBLISHED" } }),
    prisma.project.count({ where: { publishStatus: "PUBLISHED", status: "CURRENT" } }),
    getGroupCitationStats(),
  ]);

  return (
    <div className="container-site section-space">
      <SectionHeader
        eyebrow="Research"
        title="Research areas"
        description="Each area connects questions to people, active projects and scholarship."
      />
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-16">
        <div>{areas.map((area, index) => <AreaCard key={area.id} a={area} i={index} />)}</div>
        <aside className="lg:sticky lg:top-28">
          <ResearchSnapshot
            people={peopleCount}
            publications={citationStats.uniquePublications ?? localPubCount}
            activeProjects={projectCount}
            researchAreas={areas.length}
            totalCitations={citationStats.totalCitations}
            updatedAt={citationStats.updatedAt} researchGateAuthors={citationStats.researchGateAuthors}
          />
        </aside>
      </div>
    </div>
  );
}
