/**
 * Content editors use ordinary Google Docs with standalone field headings.
 * No HTML, Markdown, JSON or GitHub access is required.
 */
export type EditorialKind = "NEWS" | "EVENT";
export type EditorialDocument = {
  kind: EditorialKind;
  title: string;
  summary: string;
  body: string;
  date: Date;
  endDate?: Date;
  timeText?: string;
  speaker?: string;
  affiliation?: string;
  location?: string;
  registrationUrl?: string;
  externalUrl?: string;
  category?: string;
  featured: boolean;
  published: boolean;
};

const keys = new Map<string, string>([
  ["type","type"],["content type","type"],
  ["title","title"],["headline","title"],
  ["summary","summary"],["short description","summary"],
  ["body","body"],["article","body"],["full story","body"],
  ["description","body"],["abstract","body"],
  ["date","date"],["event date","date"],["publication date","date"],["published on","date"],
  ["start time","start"],["time","start"],["end time","end"],
  ["speaker","speaker"],["speakers","speaker"],
  ["affiliation","affiliation"],["speaker affiliation","affiliation"],
  ["venue","location"],["location","location"],
  ["registration url","registrationUrl"],["registration link","registrationUrl"],
  ["external url","externalUrl"],["source url","externalUrl"],["more information url","externalUrl"],
  ["category","category"],["tag","category"],["featured","featured"],
  ["status","status"],["publish","status"],["publication status","status"],
]);

function keyOf(label: string): string | undefined {
  return keys.get(label.toLowerCase().trim().replace(/[:：]\s*$/,"").replace(/\s+/g," "));
}
export function parseEditorialFields(text: string): Record<string,string> {
  const result: Record<string,string[]> = {};
  let current = "";
  for (const original of text.replace(/\r/g,"").split("\n")) {
    const line = original.trim();
    const inline = line.match(/^([^:：]{2,45})[:：]\s*(.+)$/);
    const field = inline ? keyOf(inline[1]) : keyOf(line);
    if (field) {
      current = field;
      result[current] ||= [];
      if (inline) result[current].push(inline[2].trim());
    } else if (current) {
      if (line || result[current].at(-1) !== "") result[current].push(line);
    }
  }
  return Object.fromEntries(Object.entries(result).map(([key,rows])=>[key,rows.join("\n").trim()]));
}
function booleanValue(raw: string|undefined) {
  return /^(yes|true|1|on|featured)$/i.test((raw || "").trim());
}
export function safeEditorialUrl(value: string|undefined): string | undefined {
  if (!value) return;
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : undefined;
  } catch { return; }
}
function parseDay(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return;
  const day = value.trim();
  const d = new Date(day+"T00:00:00.000Z");
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0,10) === day ? day : undefined;
}
function parseClock(value: string|undefined) {
  if (!value) return;
  const trimmed = value.trim();
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) return;
  return trimmed;
}
function dhakaDate(day:string, clock = "12:00") {
  // Bangladesh Standard Time is UTC+06:00 and does not observe DST.
  const instant = new Date(day+"T"+clock+":00+06:00");
  return Number.isNaN(instant.valueOf())?undefined:instant;
}
export function parseEditorialDocument(
  text:string, folderName:string, assumedKind?:EditorialKind,
): EditorialDocument {
  const f = parseEditorialFields(text);
  const specifiedKind = f.type?.trim().toUpperCase();
  const kind = assumedKind || (specifiedKind === "EVENT" ? "EVENT" : specifiedKind === "NEWS" ? "NEWS" : undefined);
  if (!kind || (specifiedKind && specifiedKind !== kind)) throw new Error("TYPE must agree with News or Events.");
  const title = (f.title||folderName).trim();
  if (!title || title.length > 170) throw new Error("Missing or invalid TITLE.");
  const day = parseDay(f.date);
  if (!day) throw new Error("DATE must be a real day written YYYY-MM-DD.");
  const summary = (f.summary||"").trim();
  if (!summary || summary.length > 650) throw new Error("SUMMARY is required (max 650 characters).");
  const body = (f.body||"").trim();
  if (kind === "NEWS" && !body) throw new Error("News BODY/ARTICLE is required.");
  const start = f.start ? parseClock(f.start) : undefined;
  if (kind === "EVENT" && f.start && !start) throw new Error("START TIME requires 24-hour HH:MM.");
  const end = f.end ? parseClock(f.end) : undefined;
  if (f.end && !end) throw new Error("END TIME requires 24-hour HH:MM.");
  const date = dhakaDate(day,start || "12:00");
  if (!date) throw new Error("Invalid event/publication date.");
  const endDate = kind === "EVENT" && end ? dhakaDate(day,end) : undefined;
  if (endDate && endDate <= date) throw new Error("END TIME must be later than START TIME on the same date.");
  if (f.registrationUrl && !safeEditorialUrl(f.registrationUrl)) throw new Error("Invalid registration URL.");
  if (f.externalUrl && !safeEditorialUrl(f.externalUrl)) throw new Error("Invalid external/source URL.");
  return {
    kind, title, summary, body, date,
    endDate,
    timeText: kind === "EVENT" && start ? start + (end ? "–" + end : "") + " (BST)" : undefined,
    speaker: f.speaker?.trim() || undefined,
    affiliation: f.affiliation?.trim() || undefined,
    location: f.location?.trim() || undefined,
    registrationUrl: safeEditorialUrl(f.registrationUrl),
    externalUrl: safeEditorialUrl(f.externalUrl),
    category: f.category?.trim().slice(0,64) || undefined,
    featured: booleanValue(f.featured),
    published: /^(published|publish|yes|true|live)$/i.test((f.status||"").trim()),
  };
}
export function editorialSlug(title:string, folderId:string) {
  const base = title.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,75)||"update";
  const fingerprint = folderId.replace(/[^a-zA-Z0-9]/g,"").slice(-10).toLowerCase();
  return base+"-"+fingerprint;
}
