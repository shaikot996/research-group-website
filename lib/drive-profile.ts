export type ParsedDriveProfile = {
  name: string;
  title: string;
  affiliation: string;
  email?: string;
  website?: string;
  googleScholar?: string;
  inspire?: string;
  orcid?: string;
  github?: string;
  linkedin?: string;
  bio?: string;
  researchSummary?: string;
  researchInterests?: string;
  sections: Record<string, string>;
};

const headingAliases = new Map<string, string>([
  ["name", "name"],
  ["full name", "name"],
  ["current position", "title"],
  ["position", "title"],
  ["title", "title"],
  ["affiliation", "affiliation"],
  ["institution", "affiliation"],
  ["email", "email"],
  ["website", "website"],
  ["personal website", "website"],
  ["google scholar", "googleScholar"],
  ["scholar", "googleScholar"],
  ["inspire", "inspire"],
  ["inspire hep", "inspire"],
  ["inspire-hep", "inspire"],
  ["orcid", "orcid"],
  ["github", "github"],
  ["linkedin", "linkedin"],
  ["about", "bio"],
  ["about me", "bio"],
  ["biography", "bio"],
  ["bio", "bio"],
  ["research interests", "researchInterests"],
  ["interests", "researchInterests"],
  ["current research", "researchSummary"],
  ["current research projects", "researchSummary"],
  ["current research / projects", "researchSummary"],
  ["current research & projects", "researchSummary"],
  ["research projects", "researchSummary"],
  ["education", "education"],
  ["educational background", "education"],
  ["skills", "skills"],
  ["skills / tools", "skills"],
  ["technical skills", "skills"],
  ["tools / software", "skills"],
  ["programming / software", "skills"],
  ["research experience", "research_experience"],
  ["academic experience", "academic_experience"],
  ["selected achievements", "selected_achievements"],
  ["achievements", "selected_achievements"],
  ["awards", "selected_achievements"],
  ["awards and honors", "selected_achievements"],
  ["awards & honors", "selected_achievements"],
  ["selected achievements / awards", "selected_achievements"],
  ["selected publications", "selected_publications"],
  ["publications", "selected_publications"],
  ["preprints", "selected_publications"],
  ["selected publications / preprints", "selected_publications"],
  ["other information", "other"],
  ["skills / other information", "other"],
  ["instructions", "__ignore"],
  ["template instructions", "__ignore"],
]);

function normalizeHeading(line: string) {
  return line.trim().replace(/^#+\s*/, "").replace(/[:：]\s*$/, "").replace(/[–—-]+/g, " ").replace(/\s+/g, " ").toLowerCase();
}

function isTemplatePlaceholder(value: string) {
  const cleaned = value.trim().replace(/^[-*•]\s*/, "");
  return /^\[\[[\s\S]*\]\]$/.test(cleaned);
}

function cleanListText(value?: string) {
  if (!value) return undefined;
  const rows = value.split(/\r?\n/)
    .map(row => row.trim().replace(/^[-*•]\s*/, ""))
    .filter(row => Boolean(row) && !isTemplatePlaceholder(row));
  return rows.length ? rows.join("\n") : undefined;
}

export function parseDriveProfile(text: string, folderName: string, defaultAffiliation = "BRAC University"): ParsedDriveProfile {
  const templateMode = /(?:^|\n)\s*TEMPLATE INSTRUCTIONS\s*(?:\n|$)/i.test(text);
  const rows = text.replace(/\r/g, "").split("\n");
  const sections: Record<string, string[]> = {};
  let current = "";
  let sawHeading = false;
  for (const raw of rows) {
    const line = raw.trim();
    if (isTemplatePlaceholder(line)) continue;

    const customSection = line.match(/^(?:CUSTOM\s+)?SECTION\s*(?:[：:]|[–—-])\s*(.{1,80})$/i);
    if (customSection && customSection[1].trim() && !isTemplatePlaceholder(customSection[1])) {
      current = `__custom__:${customSection[1].trim()}`;
      sections[current] ||= [];
      sawHeading = true;
      continue;
    }

    const inline = line.match(/^(.{1,60}?)[：:]\s*(.+)$/);
    const inlineAlias = inline ? headingAliases.get(normalizeHeading(inline[1])) : undefined;
    if (inline && inlineAlias) {
      current = inlineAlias;
      sections[current] ||= [];
      if (current !== "__ignore" && !isTemplatePlaceholder(inline[2])) sections[current].push(inline[2].trim());
      sawHeading = true;
      continue;
    }
    const alias = headingAliases.get(normalizeHeading(line));
    if (alias) {
      current = alias;
      sections[current] ||= [];
      sawHeading = true;
      continue;
    }
    if (!line && current) {
      if (sections[current].at(-1) !== "") sections[current].push("");
      continue;
    }
    if (line) {
      // The distributed template has a title/subtitle before TEMPLATE INSTRUCTIONS.
      // They are document chrome, not the member biography.
      if (templateMode && !sawHeading && !current) continue;
      if (!current) current = "bio";
      sections[current] ||= [];
      if (current !== "__ignore") sections[current].push(line);
    }
  }
  const joined: Record<string, string> = {};
  for (const [key, value] of Object.entries(sections)) {
    const content = value.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (content) joined[key] = content;
  }
  if (!sawHeading && text.trim()) joined.bio = text.trim();
  const oneLine = (key: string) => joined[key]?.split(/\r?\n/).map(x => x.trim()).find(Boolean);
  return {
    name: oneLine("name") || folderName,
    title: oneLine("title") || "Research Assistant",
    affiliation: oneLine("affiliation") || defaultAffiliation,
    email: oneLine("email"),
    website: oneLine("website"),
    googleScholar: oneLine("googleScholar"),
    inspire: oneLine("inspire"),
    orcid: oneLine("orcid"),
    github: oneLine("github"),
    linkedin: oneLine("linkedin"),
    bio: joined.bio,
    researchSummary: joined.researchSummary,
    researchInterests: cleanListText(joined.researchInterests),
    sections: Object.fromEntries(Object.entries(joined)
      .filter(([key]) => ![
        "name", "title", "affiliation", "email", "website", "googleScholar", "inspire", "orcid", "github", "linkedin", "bio", "researchSummary", "researchInterests", "__ignore",
      ].includes(key))
      .map(([key, value]) => [key.startsWith("__custom__:") ? key.slice("__custom__:".length) : key, value])),
  };
}

export function slugifyDriveName(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "research-assistant";
}
