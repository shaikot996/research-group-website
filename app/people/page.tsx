export const metadata:Metadata={title:"Researchers and Group Members",description:"Meet the principal investigators, researchers and research assistants of the SAM Research Group at BRAC University.",alternates:{canonical:"/people/"}};
import type {Metadata} from "next";
import { prisma } from "@/lib/db";
import { PERSON_ROLES } from "@/lib/constants";
import { humanize } from "@/lib/utils";
import { PersonCard, SectionHeader } from "@/components/ui";
import { getMemberCitationMap, memberCitationFor } from "@/lib/member-citations";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [people, memberCitations] = await Promise.all([
    prisma.person.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    getMemberCitationMap(),
  ]);

  return (
    <div className="container-site section-space">
      <SectionHeader eyebrow="People" title="Group members"
        description="Individual publication and citation counts are synchronized from verified INSPIRE-HEP author records where available." />
      <div className="space-y-12 lg:space-y-14">
        {PERSON_ROLES.map((role) => {
          const members = people.filter((person) => person.role === role);
          return members.length ? (
            <section key={role}>
              <h2 className="border-b academic-rule pb-3 font-serif text-3xl">
                {role === "PRINCIPAL_INVESTIGATOR" ? "Principal Investigators" : humanize(role)}
              </h2>
              <div className="mt-7 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {members.map((person) => (
                  <PersonCard
                    key={person.id}
                    p={person}
                    citationStats={memberCitationFor(memberCitations, person.inspire, person.slug)}
                  />
                ))}
              </div>
            </section>
          ) : null;
        })}
      </div>
    </div>
  );
}
