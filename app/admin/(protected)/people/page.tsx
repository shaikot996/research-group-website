import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireEditor } from "@/lib/admin";
import { PERSON_ROLES, CONTENT_STATUSES } from "@/lib/constants";
import { humanize } from "@/lib/utils";
import { savePerson, deleteEntity } from "@/app/admin/actions";
import { Field, Heading, Status, inputClass, textareaClass } from "@/components/admin/common";
import { RepeatingRows } from "@/components/admin/repeating";
import { DeleteButton } from "@/components/admin/delete-button";

export default async function Page({ searchParams }: { searchParams: Promise<{ edit?: string; saved?: string; error?: string }> }) {
  const [q, session, people, areas] = await Promise.all([
    searchParams,
    requireEditor(),
    prisma.person.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.researchArea.findMany({ orderBy: { title: "asc" } }),
  ]);

  const current = q.edit ? await prisma.person.findUnique({
    where: { id: q.edit },
    include: {
      education: { orderBy: { sortOrder: "asc" } },
      positions: { orderBy: { sortOrder: "asc" } },
      talks: { orderBy: { date: "desc" } },
      software: true,
      awards: { orderBy: { sortOrder: "asc" } },
      teaching: { orderBy: { sortOrder: "asc" } },
      grants: { orderBy: { sortOrder: "asc" } },
      researchAreas: true,
    },
  }) : null;

  const education = current?.education.map((x) => ({
    education_degree: x.degree,
    education_institution: x.institution,
    education_years: x.years,
    education_thesis: x.thesis || "",
    education_advisor: x.advisor || "",
  })) || [];
  const positions = current?.positions.map((x) => ({
    position_title: x.title,
    position_institution: x.institution,
    position_years: x.years,
    position_description: x.description || "",
  })) || [];
  const talks = current?.talks.map((x) => ({
    talk_title: x.title,
    talk_venue: x.venue,
    talk_date: x.date.toISOString().slice(0, 10),
    talk_slides: x.slidesUrl || "",
  })) || [];
  const software = current?.software.map((x) => ({
    software_name: x.name,
    software_description: x.description,
    software_url: x.url || "",
    software_languages: x.languages || "",
  })) || [];
  const awards = current?.awards.map((x) => ({
    award_title: x.title,
    award_issuer: x.issuer || "",
    award_year: x.year || "",
    award_description: x.description || "",
  })) || [];
  const teaching = current?.teaching.map((x) => ({
    teaching_title: x.title,
    teaching_institution: x.institution || "",
    teaching_term: x.term || "",
    teaching_description: x.description || "",
  })) || [];
  const grants = current?.grants.map((x) => ({
    grant_title: x.title,
    grant_funder: x.funder,
    grant_id: x.grantId || "",
    grant_role: x.role || "",
    grant_amount: x.amount || "",
    grant_period: x.period || "",
    grant_url: x.url || "",
    grant_description: x.description || "",
  })) || [];

  const get = (key: string) => String((current as unknown as Record<string, unknown> | null)?.[key] ?? "");

  return <>
    <Heading title="People" description="Profiles, PI/faculty roles, grants, INSPIRE links, education, appointments, talks, teaching and software. Editing the INSPIRE URL changes the live collapsible publication feed on the public profile." editing={!!current} />
    <Status saved={q.saved} error={q.error} />

    <form action={savePerson} className="grid gap-6 border academic-rule p-5">
      <input type="hidden" name="id" value={current?.id || ""} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name"><input required name="name" defaultValue={current?.name || ""} className={inputClass} /></Field>
        <Field label="Slug"><input name="slug" defaultValue={current?.slug || ""} className={inputClass} /></Field>
        <Field label="Group role"><select name="role" defaultValue={current?.role || "RESEARCH_ASSISTANT"} className={inputClass}>{PERSON_ROLES.map((x) => <option key={x} value={x}>{humanize(x)}</option>)}</select></Field>
        <Field label="Public status"><select name="status" defaultValue={current?.status || "PUBLISHED"} className={inputClass}>{CONTENT_STATUSES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Academic title"><input required name="title" defaultValue={current?.title || ""} className={inputClass} /></Field>
        <Field label="Affiliation"><input required name="affiliation" defaultValue={current?.affiliation || ""} className={inputClass} /></Field>
        <Field label="Email"><input type="email" name="email" defaultValue={current?.email || ""} className={inputClass} /></Field>
        <Field label="Photo / media path"><input name="photo" defaultValue={current?.photo || ""} className={inputClass} /></Field>
        <Field label="Display order"><input type="number" name="sortOrder" defaultValue={current?.sortOrder ?? people.length} className={inputClass} /></Field>
        <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold"><input type="checkbox" name="featured" defaultChecked={current?.featured || false} /> Featured profile</label>
      </div>

      <Field label="Biography"><textarea name="bio" rows={5} defaultValue={current?.bio || ""} className={textareaClass} /></Field>
      <Field label="Current research"><textarea name="researchSummary" rows={5} defaultValue={current?.researchSummary || ""} className={textareaClass} /></Field>
      <Field label="Research interests" help="One per line or semicolon-separated."><textarea name="researchInterests" rows={4} defaultValue={current?.researchInterests || ""} className={textareaClass} /></Field>

      <fieldset className="border academic-rule p-4">
        <legend className="font-serif text-xl">Research areas</legend>
        <div className="mt-3 grid gap-2 md:grid-cols-2">{areas.map((area) => <label key={area.id} className="flex gap-2 text-sm"><input type="checkbox" name="researchAreaIds" value={area.id} defaultChecked={current?.researchAreas.some((x) => x.id === area.id) || false} />{area.title}</label>)}</div>
      </fieldset>

      <fieldset className="border academic-rule p-4">
        <legend className="font-serif text-xl">External research links</legend>
        <p className="mt-2 text-xs leading-5 text-muted">For INSPIRE-HEP use the author-profile URL, for example https://inspirehep.net/authors/1023635. The public profile automatically fetches that author&apos;s linked literature records.</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">{[["website", "Website"], ["googleScholar", "Google Scholar"], ["inspire", "INSPIRE-HEP author URL"], ["orcid", "ORCID"], ["arxiv", "arXiv"], ["github", "GitHub"], ["linkedin", "LinkedIn"], ["cvUrl", "CV URL"]].map(([name, label]) => <Field key={name} label={label}><input name={name} defaultValue={get(name)} className={inputClass} /></Field>)}</div>
      </fieldset>

      <RepeatingRows title="Research grants / funding" initial={grants} columns={[
        { name: "grant_title", label: "Project / grant title" },
        { name: "grant_funder", label: "Funder" },
        { name: "grant_id", label: "Grant ID" },
        { name: "grant_role", label: "Role (PI / Co-PI / member)" },
        { name: "grant_amount", label: "Amount" },
        { name: "grant_period", label: "Period" },
        { name: "grant_url", label: "Source URL" },
        { name: "grant_description", label: "Description" },
      ]} />
      <RepeatingRows title="Education" initial={education} columns={[{ name: "education_degree", label: "Degree" }, { name: "education_institution", label: "Institution" }, { name: "education_years", label: "Years" }, { name: "education_thesis", label: "Thesis" }, { name: "education_advisor", label: "Advisor" }]} />
      <RepeatingRows title="Academic positions" initial={positions} columns={[{ name: "position_title", label: "Position" }, { name: "position_institution", label: "Institution" }, { name: "position_years", label: "Years" }, { name: "position_description", label: "Description" }]} />
      <RepeatingRows title="Talks" initial={talks} columns={[{ name: "talk_title", label: "Title" }, { name: "talk_venue", label: "Venue" }, { name: "talk_date", label: "Date", type: "date" }, { name: "talk_slides", label: "Slides URL" }]} />
      <RepeatingRows title="Software / open source" initial={software} columns={[{ name: "software_name", label: "Project" }, { name: "software_description", label: "Description" }, { name: "software_url", label: "URL" }, { name: "software_languages", label: "Languages" }]} />
      <RepeatingRows title="Teaching" initial={teaching} columns={[{ name: "teaching_title", label: "Course / activity" }, { name: "teaching_institution", label: "Institution" }, { name: "teaching_term", label: "Term / year" }, { name: "teaching_description", label: "Description" }]} />
      <RepeatingRows title="Awards / honors" initial={awards} columns={[{ name: "award_title", label: "Award / honor" }, { name: "award_issuer", label: "Issuer" }, { name: "award_year", label: "Year" }, { name: "award_description", label: "Description" }]} />

      <button className="justify-self-start bg-[#172a46] px-5 py-3 text-sm font-semibold text-white">{current ? "Save profile" : "Create profile"}</button>
    </form>

    <section className="mt-10">
      <h2 className="border-b academic-rule pb-3 font-serif text-2xl">Existing profiles</h2>
      {people.map((person) => <div key={person.id} className="grid items-center gap-3 border-b academic-rule py-4 md:grid-cols-[1fr_130px_auto]"><div><strong>{person.name}</strong><div className="text-xs text-muted">{humanize(person.role)} · {person.status}</div></div><Link className="link-academic text-xs" href={`/people/${person.slug}`} target="_blank">Public ↗</Link><div className="flex gap-2"><Link href={`?edit=${person.id}`} className="border academic-rule px-3 py-2 text-xs">Edit</Link>{session.user.role === "ADMIN" && <form action={deleteEntity}><input type="hidden" name="model" value="person" /><input type="hidden" name="id" value={person.id} /><DeleteButton /></form>}</div></div>)}
    </section>
  </>;
}
