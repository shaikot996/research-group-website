import { parseEditorialDocument, parseEditorialFields, editorialSlug, safeEditorialUrl } from "../lib/drive-editorial";
import { editorialGallery } from "../lib/editorial-view";

const news = [
  "TYPE","NEWS","TITLE","A significant SAM result",
  "SUMMARY","A concise research announcement.",
  "DATE","2026-10-14","CATEGORY","Research","FEATURED","YES","STATUS","PUBLISHED",
  "BODY","A full first paragraph.","","A second paragraph explaining the work.",
  "EXTERNAL URL","https://example.edu/research"
].join("\n");
const n = parseEditorialDocument(news,"Example story");
if(n.title!=="A significant SAM result"||n.kind!=="NEWS"||!n.published||!n.featured||
  n.body.indexOf("second paragraph")<0||n.category!=="Research") throw Error("News field parser failed.");
if(n.date.toISOString()!=="2026-10-14T06:00:00.000Z") throw Error("Dhaka publication date conversion failed.");

const event = [
  "TYPE: EVENT","TITLE: Special Seminar","SUMMARY: A public lecture on quantum physics.",
  "DATE: 2026-12-02","START TIME: 16:30","END TIME: 18:00",
  "SPEAKER: Guest Scientist","AFFILIATION: University","VENUE: BRAC University",
  "REGISTRATION URL: https://example.edu/register","STATUS: PUBLISHED","DESCRIPTION",
  "Talk overview.","","Audience questions and discussion."
].join("\n");
const e = parseEditorialDocument(event,"Seminar","EVENT");
if(e.kind!=="EVENT"||e.timeText!=="16:30–18:00 (BST)"||
  e.date.toISOString()!=="2026-12-02T10:30:00.000Z"||
  e.endDate?.toISOString()!=="2026-12-02T12:00:00.000Z"||
  e.speaker!=="Guest Scientist"||!e.published) throw Error("Event parser failed.");
const draft = parseEditorialDocument(news.replace("PUBLISHED","DRAFT"),"Example","NEWS");
if(draft.published) throw Error("Draft must not appear publicly.");
for(const broken of [
  news.replace("2026-10-14","2026-02-30"),
  news.replace("TYPE\nNEWS","TYPE\nEVENT"),
  news.replace("A concise research announcement.",""),
]) {
  let rejected=false;
  try{parseEditorialDocument(broken,"Example","NEWS");}catch{rejected=true;}
  if(!rejected)throw Error("Invalid news document was accepted.");
}
if(safeEditorialUrl("javascript:alert(1)")||safeEditorialUrl("file:///tmp/abc")) throw Error("Unsafe external links permitted.");
if(editorialSlug("SAM Scientific News","1ab_cdeF")!=="sam-scientific-news-1abcdef") throw Error("Unstable editorial slug.");
if(editorialGallery(JSON.stringify([
  "/drive-news-events/news/story-123/gallery-01.jpg","https://bad.example/image.jpg"
])).length!==1) throw Error("Unsafe photo gallery path permitted.");
if(editorialGallery("invalid").length)throw Error("Invalid gallery JSON accepted.");
const fields = parseEditorialFields("TITLE: Hello\nSUMMARY\nWorld");
if(fields.title!=="Hello"||fields.summary!=="World")throw Error("Inline/multiline headings failed.");
console.log("Drive News and Events editorial parser tests passed.");
