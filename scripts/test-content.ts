import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { extractDocxText } from "../lib/docx-text";
import { parseDriveProfile, slugifyDriveName } from "../lib/drive-profile";

const sample = `NAME: Walid Hasan
CURRENT POSITION: Research Assistant
AFFILIATION: BRAC University

ABOUT ME
I work on computational and mathematical physics.

RESEARCH INTERESTS
- Quantum information
- Machine learning
- Mathematical physics

CURRENT RESEARCH / PROJECTS
A sample project description.

EDUCATIONAL BACKGROUND
BSc in Physics, BRAC University

SKILLS / OTHER INFORMATION
Python, Mathematica`;

const profile = parseDriveProfile(sample, "Fallback Name");
const expectedInterests = "Quantum information\nMachine learning\nMathematical physics";

if (profile.name !== "Walid Hasan") throw new Error(`Profile name parse failed: ${profile.name}`);
if (profile.title !== "Research Assistant") throw new Error(`Position parse failed: ${profile.title}`);
if (profile.researchInterests !== expectedInterests) throw new Error(`Research interests parse failed: ${profile.researchInterests}`);
if (profile.sections.education !== "BSc in Physics, BRAC University") throw new Error("Education section parse failed.");
if (profile.sections.other !== "Python, Mathematica") throw new Error("Other-information section parse failed.");
if (slugifyDriveName(profile.name) !== "walid-hasan") throw new Error("Stable slug generation failed.");

const plain = parseDriveProfile("A plain biography without headings.", "Plain Person");
if (plain.name !== "Plain Person" || plain.bio !== "A plain biography without headings.") throw new Error("Plain-text fallback parsing failed.");

console.log("External content parser tests passed.");
const templateSample = `TEMPLATE INSTRUCTIONS
[[Keep the headings. Replace the placeholder text below. Blank optional sections are ignored.]]

NAME
Template Person

CURRENT POSITION
Research Assistant

AFFILIATION
BRAC University

EMAIL
[[OPTIONAL: name@example.com]]

ABOUT ME
A concise biography.

RESEARCH INTERESTS
- Quantum gravity
- [[OPTIONAL: another topic]]
- Machine learning

SKILLS / TOOLS
Python, Mathematica

SELECTED ACHIEVEMENTS / AWARDS
Best poster award, 2026

SECTION: Outreach and Service
Math circle volunteer.

OTHER INFORMATION
[[OPTIONAL: anything else]]`;

const templateProfile = parseDriveProfile(templateSample, "Folder Name");
if (templateProfile.name !== "Template Person") throw new Error("Template name parse failed.");
if (templateProfile.email) throw new Error("Template placeholder leaked into email.");
if (templateProfile.researchInterests !== "Quantum gravity\nMachine learning") throw new Error(`Template list placeholder handling failed: ${templateProfile.researchInterests}`);
if (templateProfile.sections.skills !== "Python, Mathematica") throw new Error("Skills/tools heading parse failed.");
if (templateProfile.sections.selected_achievements !== "Best poster award, 2026") throw new Error("Achievements heading parse failed.");
if (templateProfile.sections["Outreach and Service"] !== "Math circle volunteer.") throw new Error("Custom SECTION heading parse failed.");
if (templateProfile.sections.other) throw new Error("Blank optional placeholder section should not render.");

console.log("Google Doc template parser tests passed.");


import { GOOGLE_DOC_MIME, GOOGLE_DRIVE_FOLDER_MIME, parsePublicGoogleDriveFolderHtml } from "../lib/google-drive";

const publicFolderHtml = `
<a href="https://drive.google.com/drive/folders/aaaaaaaaaaaaaaaaaaaaa?usp=drive_web"><div>Walid Hasan</div></a>
<a href="https://docs.google.com/document/d/bbbbbbbbbbbbbbbbbbbbb/view?usp=drive_web">About Me</a>
<a href="https://drive.google.com/file/d/ccccccccccccccccccccc/view?usp=drive_web">portrait.jpg</a>
<a href="https://drive.google.com/file/d/ddddddddddddddddddddd/view?usp=drive_web">CV.pdf</a>`;
const publicItems = parsePublicGoogleDriveFolderHtml(publicFolderHtml);
if (publicItems.length !== 4) throw new Error(`Public Drive HTML parsing failed: found ${publicItems.length} items.`);
if (publicItems[0]?.mimeType !== GOOGLE_DRIVE_FOLDER_MIME || publicItems[0]?.name !== "Walid Hasan") throw new Error("Public Drive folder parsing failed.");
if (publicItems[1]?.mimeType !== GOOGLE_DOC_MIME || publicItems[1]?.name !== "About Me") throw new Error("Public Google Doc parsing failed.");
if (publicItems[2]?.name !== "portrait.jpg" || publicItems[3]?.name !== "CV.pdf") throw new Error("Public Drive binary-file parsing failed.");

console.log("Public Google Drive folder parser tests passed.");


const localDocxCandidates = [
  path.resolve("templates/SAM-Research-Assistant-Profile-Template.docx"),
  path.resolve("SAM-Research-Assistant-Profile-Template.docx"),
];
const localDocx = localDocxCandidates.find(existsSync);
if (localDocx) {
  const docxText = extractDocxText(await readFile(localDocx));
  if (!/RESEARCH INTERESTS/i.test(docxText) || !/CURRENT RESEARCH/i.test(docxText)) {
    throw new Error("DOCX template extraction failed.");
  }
  const parsedDocx = parseDriveProfile(docxText, "DOCX Test Person");
  if (parsedDocx.name !== "DOCX Test Person") throw new Error("DOCX placeholder handling failed.");
  console.log("DOCX profile extraction test passed.");
}
