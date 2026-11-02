export const metadata:Metadata={title:"Researchers and Group Members",description:"Meet the researchers and research assistants of the SAM Research Group at BRAC University.",alternates:{canonical:"/people/"}};
import type {Metadata} from "next";
import { prisma } from "@/lib/db";
import { absolute } from "@/lib/utils";
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

  const researcherDirectory={
    "@context":"https://schema.org",
    "@type":"ItemList",
    name:"SAM Research Group members — BRAC University",
    itemListElement:people.map((person,index)=>({
      "@type":"ListItem",
      position:index+1,
      item:{"@type":"Person","@id":absolute(`/people/${person.slug}/#person`),
        name:person.name,url:absolute(`/people/${person.slug}/`)}
    }))
  };
  return (
    <div className="container-site section-space">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(researcherDirectory).replace(/</g,"\\u003c")}}/>
      <SectionHeader eyebrow="People" title="Group members"
        description="Individual publication and citation counts are synchronized from verified INSPIRE-HEP author records where available." />
      <div className="space-y-12 lg:space-y-14">
        {[
          {title:"Researchers", roles:["PRINCIPAL_INVESTIGATOR","FACULTY","RESEARCHER"]},
          {title:"Research Assistants", roles:["RESEARCH_ASSISTANT"]},
          {title:"Postdoctoral Researchers", roles:["POSTDOC"]},
          {title:"Graduate Students", roles:["GRADUATE_STUDENT"]},
          {title:"Undergraduate Students", roles:["UNDERGRADUATE_STUDENT"]},
          {title:"Visitors", roles:["VISITOR"]},
          {title:"Collaborators", roles:["COLLABORATOR"]},
          {title:"Alumni", roles:["ALUMNI"]}
        ].map(({title,roles}) => {
          const members = people.filter((person) => roles.includes(person.role));
          return members.length ? (
            <section key={title}>
              <h2 className="border-b academic-rule pb-3 font-serif text-3xl">
                {title}
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
