import { PrismaClient, type Prisma } from "@prisma/client";
import { siteDefaults } from "../lib/site-defaults";

const client = new PrismaClient();

const INSPIRE = {
  shaikot: "https://inspirehep.net/authors/2648798?ui-citation-summary=true",
  ahmed: "https://inspirehep.net/authors/2763317?ui-citation-summary=true",
  mishaal: "https://inspirehep.net/authors/2931658?ui-citation-summary=true",
  tashnuba: "https://inspirehep.net/authors/3088919?ui-citation-summary=true",
  mahbub: "https://inspirehep.net/authors/1023635?ui-citation-summary=true",
  hasibul: "https://inspirehep.net/authors/1511186?ui-citation-summary=true",
};

async function seed(db: Prisma.TransactionClient) {
  if (await db.siteSetting.count() || await db.person.count()) {
    console.log("Existing content preserved; initial data was not reapplied.");
    return;
  }
  const settings = { ...siteDefaults, dataRevision: "launch-2026-09-24" };

  for (const [key, value] of Object.entries(settings)) {
    await db.siteSetting.create({ data: { key, value } });
  }

  const researchAreas = [
    {
      slug: "string-theory",
      title: "String Theory & Quantum Gravity",
      shortDescription:
        "String dynamics, dualities, higher-derivative corrections and quantum aspects of gravitation.",
      overview:
        "Research in string theory and quantum gravity addresses the microscopic structure of spacetime, duality constraints, higher-derivative corrections and quantum gravitational observables.",
      questions:
        "How do string corrections constrain low-energy dynamics?\nWhich quantities survive dualities and field redefinitions?\nHow does quantum gravity alter cosmological and black-hole physics?",
      methods:
        "Effective field theory\nSupergravity\nString perturbation theory\nAnalytic field-theory methods",
    },
    {
      slug: "early-universe-cosmology",
      title: "Early-Universe Cosmology",
      shortDescription:
        "Inflation, string cosmology, primordial black holes and high-energy dynamics of the early universe.",
      overview:
        "The early universe provides a laboratory for high-energy physics, including inflationary dynamics, primordial compactification effects and quantum gravitational signatures.",
      questions:
        "How can string-motivated potentials support controlled inflation?\nWhat high-energy signatures can survive in cosmological observables?\nHow do primordial black holes probe quantum gravity?",
      methods:
        "Cosmological perturbation theory\nEffective field theory\nAnalytic model building\nNumerical evolution",
    },
    {
      slug: "quantum-field-theory",
      title: "Quantum Field Theory",
      shortDescription:
        "Quantum fields in equilibrium and nonequilibrium settings, curved backgrounds and effective theories.",
      overview:
        "Quantum field theory underlies the group's work on nonequilibrium wave kinetics, curved-spacetime dynamics, effective actions and high-energy theory.",
      questions:
        "How do loop corrections reorganize kinetic descriptions?\nHow do backgrounds modify field-theory observables?\nWhich effective descriptions remain controlled far from equilibrium?",
      methods:
        "Perturbation theory\nDiagrammatic methods\nKinetic theory\nQuantum field theory in curved spacetime",
    },
    {
      slug: "black-holes-gravitation",
      title: "Black Holes & Gravitation",
      shortDescription:
        "Black-hole information, quantum black holes, gravitation and semiclassical spacetime physics.",
      overview:
        "Black holes connect gravitation, quantum information and quantum field theory and provide a sharp testing ground for ideas about quantum spacetime.",
      questions:
        "What is the quantum structure of black holes?\nHow does information emerge from gravitational systems?\nWhat role can primordial black holes play in early-universe physics?",
      methods:
        "General relativity\nSemiclassical gravity\nQuantum information\nCosmological perturbation theory",
    },
    {
      slug: "string-compactifications",
      title: "String Compactifications",
      shortDescription:
        "Calabi–Yau compactification, moduli stabilisation, flux backgrounds and lower-dimensional effective theories.",
      overview:
        "Compactification connects higher-dimensional string and supergravity models to lower-dimensional cosmology and particle physics through moduli, fluxes and geometric data.",
      questions:
        "How are moduli stabilised in perturbative regimes?\nWhat cosmologies follow from controlled compactifications?\nHow do fluxes and higher-derivative corrections affect the effective theory?",
      methods:
        "Calabi–Yau geometry\nSupergravity\nModuli effective actions\nPerturbative string corrections",
    },
    {
      slug: "mathematical-physics",
      title: "Mathematical Physics",
      shortDescription:
        "Noncommutative geometry, representation theory, deformation quantization and geometric structures in physics.",
      overview:
        "Mathematical physics supplies structural tools for quantum mechanics and field theory, including noncommutative spaces, quantization and representation-theoretic methods.",
      questions:
        "How does noncommutative geometry change quantum kinematics?\nWhich representation-theoretic structures control quantization?\nHow can geometric methods clarify physical equivalence?",
      methods:
        "Noncommutative geometry\nRepresentation theory\nDeformation quantization\nSymplectic geometry",
    },
  ];

  const areaIds: Record<string, string> = {};
  for (let index = 0; index < researchAreas.length; index += 1) {
    const item = researchAreas[index];
    const created = await db.researchArea.create({
      data: { ...item, sortOrder: index, featured: true },
    });
    areaIds[item.slug] = created.id;
  }

  const mahbub = await db.person.create({
    data: {
      slug: "mahbubul-alam-majumdar",
      name: "Mahbubul Alam Majumdar",
      role: "PRINCIPAL_INVESTIGATOR",
      title: "Professor and Dean, School of Data & Computational Sciences",
      affiliation: "BRAC University",
      email: "majumdar@bracu.ac.bd",
      bio:
        "Mahbubul Alam Majumdar is Professor and Dean of the School of Data & Computational Sciences at BRAC University. His publicly listed theoretical-physics interests include string cosmology, the black-hole information paradox and quantum information, together with broader interests in quantum computing and computational science. His earlier research includes brane cosmology, D-brane dynamics and tachyon-driven inflation.",
      researchSummary:
        "String cosmology, quantum aspects of black holes, quantum information and early-universe theory.",
      researchInterests:
        "String cosmology\nBlack-hole information paradox\nQuantum information theory\nEarly-universe cosmology\nQuantum gravity",
      inspire: INSPIRE.mahbub,
      website: "https://www.bracu.ac.bd/about/people/mahbubul-alam-majumdar-phd",
      sortOrder: 0,
      featured: true,
      researchAreas: {
        connect: [
          { id: areaIds["string-theory"] },
          { id: areaIds["early-universe-cosmology"] },
          { id: areaIds["black-holes-gravitation"] },
        ],
      },
      education: {
        create: [
          {
            degree: "PhD in Mathematics",
            institution: "University of Cambridge",
            years: "Public academic record",
            sortOrder: 0,
          },
          {
            degree: "MS",
            institution: "Stanford University",
            years: "Public academic record",
            sortOrder: 1,
          },
          {
            degree: "SB",
            institution: "Massachusetts Institute of Technology",
            years: "Public academic record",
            sortOrder: 2,
          },
        ],
      },
      positions: {
        create: [
          {
            title: "Professor and Dean, School of Data & Computational Sciences",
            institution: "BRAC University",
            years: "Current",
            sortOrder: 0,
          },
          {
            title: "Postdoctoral Researcher",
            institution: "Imperial College London",
            years: "Previous appointment",
            sortOrder: 1,
          },
        ],
      },
      awards: {
        create: [
          {
            title: "Ekushey Padak",
            issuer: "Government of Bangladesh",
            year: "2026",
            description: "Awarded in the education category for contributions to mathematics education and the Bangladesh Mathematical Olympiad movement.",
            sortOrder: 0,
          },
          {
            title: "Spirit of Abdus Salam Award",
            issuer: "International Centre for Theoretical Physics (ICTP)",
            year: "2026",
            description: "Recognition for efforts to strengthen Bangladesh's scientific and educational foundations.",
            sortOrder: 1,
          },
        ],
      },
      teaching: {
        create: [
          {
            title: "Quantum Field Theory and advanced theoretical-physics courses",
            institution: "BRAC University",
            description: "BRAC University's public profile notes teaching across topics ranging from machine learning and number theory to quantum field theory.",
            sortOrder: 0,
          },
        ],
      },
      grants: {
        create: [
          {
            title: "Time Dependent Backgrounds in String Theory and Early Universe Cosmology",
            funder: "BRAC University Research Seed Grant Initiative (RSGI)",
            role: "Principal Investigator",
            amount: "USD 4,000",
            period: "2025–2026 public project record",
            url: "https://hasan-walid.github.io/research/",
            description: "Public project information lists Mahbubul Alam Majumdar as PI, with Ratul Mahanta and Ahmed Rakin Kamal as Co-PIs.",
            sortOrder: 0,
          },
        ],
      },
    },
  });

  const hasibul = await db.person.create({
    data: {
      slug: "syed-hasibul-hassan-chowdhury",
      name: "Syed Hasibul Hassan Chowdhury",
      role: "PRINCIPAL_INVESTIGATOR",
      title: "Professor",
      affiliation: "Department of Mathematics & Physical Sciences, BRAC University",
      email: "shhchowdhury@bracu.ac.bd",
      bio:
        "Syed Hasibul Hassan Chowdhury is Professor in the Department of Mathematics & Physical Sciences at BRAC University. He earned a PhD in mathematical physics from Concordia University and subsequently held research positions at Concordia, the Chern Institute of Mathematics at Nankai University and the Institute for Mathematical Research at Universiti Putra Malaysia. His research spans noncommutative quantum mechanics, representation theory, deformation quantization and related geometric structures.",
      researchSummary:
        "Noncommutative quantum mechanics, representation theory, deformation quantization and mathematical physics.",
      researchInterests:
        "Noncommutative geometry\nNoncommutative quantum mechanics\nRepresentation theory\nQuantum groups\nDeformation quantization\nSymplectic geometry",
      inspire: INSPIRE.hasibul,
      orcid: "https://orcid.org/0000-0001-9721-2541",
      website:
        "https://www.bracu.ac.bd/about/people/syed-hasibul-hassan-chowdhury-phd",
      sortOrder: 1,
      featured: true,
      researchAreas: {
        connect: [
          { id: areaIds["mathematical-physics"] },
          { id: areaIds["quantum-field-theory"] },
        ],
      },
      education: {
        create: [
          {
            degree: "PhD in Mathematics (Mathematical Physics)",
            institution: "Concordia University",
            years: "2013",
            sortOrder: 0,
          },
          {
            degree: "MSc in Physics",
            institution: "University of Dhaka",
            years: "1999",
            sortOrder: 1,
          },
          {
            degree: "BSc in Physics",
            institution: "University of Dhaka",
            years: "1998",
            sortOrder: 2,
          },
        ],
      },
      positions: {
        create: [
          {
            title: "Professor",
            institution: "BRAC University",
            years: "2021–present",
            sortOrder: 0,
          },
          {
            title: "Associate Professor",
            institution: "BRAC University",
            years: "2020–2021",
            sortOrder: 1,
          },
          {
            title: "Postdoctoral Research Fellow",
            institution: "Chern Institute of Mathematics, Nankai University",
            years: "2014–2016",
            sortOrder: 2,
          },
          {
            title: "Postdoctoral Research Fellow",
            institution: "Institute for Mathematical Research, Universiti Putra Malaysia",
            years: "2016–2017",
            sortOrder: 3,
          },
        ],
      },
      teaching: {
        create: [
          { title: "General Relativity and Cosmology", institution: "BRAC University", sortOrder: 0 },
          { title: "Differential Geometry", institution: "BRAC University", sortOrder: 1 },
          { title: "Representation Theory", institution: "BRAC University", sortOrder: 2 },
        ],
      },
      grants: {
        create: [
          {
            title: "TWAS Research Grants in Mathematics (Individuals)",
            funder: "The World Academy of Sciences (TWAS)",
            role: "Principal Investigator / individual grantee",
            period: "2022",
            url: "https://www.bracu.ac.bd/about/people/syed-hasibul-hassan-chowdhury-phd",
            description: "Listed in the Awards and Honors section of the official BRAC University profile.",
            sortOrder: 0,
          },
          {
            title: "Research Fund for International Young Scientists",
            funder: "National Natural Science Foundation of China (NSFC)",
            role: "Individual research grant",
            period: "2015",
            url: "https://www.bracu.ac.bd/about/people/syed-hasibul-hassan-chowdhury-phd",
            sortOrder: 1,
          },
        ],
      },
      awards: {
        create: [
          { title: "Best Student Prize, CRM Mathematical Physics Laboratory", issuer: "CRM Mathematical Physics Laboratory", year: "2013", sortOrder: 0 },
          { title: "Concordia Accelerator Award", issuer: "Concordia University", year: "2013", sortOrder: 1 },
          { title: "ISM Doctoral Scholarship", issuer: "Institut des sciences mathématiques", year: "2009–2013", sortOrder: 2 },
        ],
      },
      talks: {
        create: [
          {
            title: "Construction of Wigner functions from gauge-equivalence classes of unitary irreducible representations of noncommutative quantum mechanics",
            venue: "S. N. Bose National Centre for Basic Sciences, Kolkata",
            date: new Date("2018-11-28T00:00:00Z"),
          },
          {
            title: "On Goldman bracket for G2 gauge group",
            venue: "IISER Kolkata",
            date: new Date("2018-04-12T00:00:00Z"),
          },
        ],
      },
    },
  });

  const ahmed = await db.person.create({
    data: {
      slug: "ahmed-rakin-kamal",
      name: "Ahmed Rakin Kamal",
      role: "FACULTY",
      title: "Lecturer (On Leave) · PhD Researcher in Theoretical Physics",
      affiliation: "BRAC University · Masaryk University",
      email: "ahmedrakinkamaltunok@gmail.com",
      bio:
        "Ahmed Rakin Kamal is a theoretical physicist working on string theory and quantum gravity. BRAC University lists him as Lecturer (On Leave), while his current research is based at Masaryk University, where he is pursuing a PhD in theoretical physics on higher-derivative corrections in string theory. His public research record also includes string compactification, supergravity, T-duality, moduli stabilisation and string cosmology.",
      researchSummary:
        "String theory, higher-derivative corrections, compactification, supergravity and string cosmology.",
      researchInterests:
        "String theory\nQuantum gravity\nHigher-derivative corrections\nString compactifications\nSupergravity\nT-duality\nString cosmology",
      inspire: INSPIRE.ahmed,
      orcid: "https://orcid.org/0000-0002-0194-018X",
      website: "https://ahmedrakinkamal.com/",
      sortOrder: 2,
      featured: true,
      researchAreas: {
        connect: [
          { id: areaIds["string-theory"] },
          { id: areaIds["string-compactifications"] },
          { id: areaIds["early-universe-cosmology"] },
        ],
      },
      education: {
        create: [
          {
            degree: "PhD in Theoretical Physics",
            institution: "Masaryk University",
            years: "2023–present",
            thesis: "Alpha-prime corrections in string theory",
            advisor: "Linus Wulff",
            sortOrder: 0,
          },
          {
            degree: "MSc in Theoretical Physics",
            institution: "University of Bologna",
            years: "2021–2023",
            thesis: "Perturbative moduli stabilisation and string inflation",
            advisor: "Michele Cicoli",
            sortOrder: 1,
          },
          {
            degree: "MSc in Mathematical Physics",
            institution: "University of Burgundy",
            years: "2020–2021",
            thesis: "Advances in two-dimensional quantum gravity",
            advisor: "Taro Kimura",
            sortOrder: 2,
          },
          {
            degree: "BSc in Physics",
            institution: "BRAC University",
            years: "2017–2019",
            thesis: "Black-hole information paradox",
            advisor: "Mahbubul Alam Majumdar",
            sortOrder: 3,
          },
        ],
      },
      positions: {
        create: [
          {
            title: "PhD Researcher",
            institution: "Masaryk University",
            years: "2023–present",
            sortOrder: 0,
          },
          {
            title: "Lecturer",
            institution: "BRAC University",
            years: "Public profile lists current post as on leave",
            sortOrder: 1,
          },
          {
            title: "Research Intern",
            institution: "Institute of Mathematics at Burgundy",
            years: "2021",
            description: "Two-dimensional quantum gravity, matrix models and higher-spin theory.",
            sortOrder: 2,
          },
        ],
      },
      teaching: {
        create: [
          { title: "Random Matrix Theory", institution: "BRAC University", sortOrder: 0 },
          { title: "Calculus and Differential Equations", institution: "BRAC University", sortOrder: 1 },
        ],
      },
      talks: {
        create: [
          {
            title: "Time-dependent flux backgrounds in type IIB supergravity",
            venue: "String-Pheno Seminars",
            date: new Date("2026-02-10T11:00:00Z"),
          },
        ],
      },
    },
  });

  const tashnuba = await db.person.create({
    data: {
      slug: "sayeda-tashnuba-jahan",
      name: "Sayeda Tashnuba Jahan",
      role: "FACULTY",
      title: "Lecturer",
      affiliation: "Department of Mathematics & Physical Sciences, BRAC University",
      email: "sayeda.tashnuba@bracu.ac.bd",
      bio:
        "Sayeda Tashnuba Jahan is a theoretical physicist and Lecturer at BRAC University. Her public profile describes research on cosmology, gravity and quantum field theory, with current interests including axion-monodromy inflation and the quantum nature of primordial black holes, following earlier work on black-hole information. She teaches general relativity and cosmology and is active in theoretical-physics training initiatives in Bangladesh.",
      researchSummary:
        "Early-universe cosmology, primordial black holes, string inflation, gravitation and quantum aspects of black holes.",
      researchInterests:
        "Primordial black holes\nEarly-universe cosmology\nCosmological perturbation theory\nString inflation\nQuantum black holes\nBlack-hole information paradox",
      inspire: INSPIRE.tashnuba,
      website: "https://www.bracu.ac.bd/about/people/sayeda-tashnuba-jahan",
      sortOrder: 3,
      featured: true,
      researchAreas: {
        connect: [
          { id: areaIds["early-universe-cosmology"] },
          { id: areaIds["black-holes-gravitation"] },
          { id: areaIds["string-theory"] },
          { id: areaIds["quantum-field-theory"] },
        ],
      },
      education: {
        create: [
          {
            degree: "MSc in Theoretical Physics",
            institution: "University of Bologna",
            years: "2023",
            thesis: "Quantum nature of primordial black holes from inflationary cosmology",
            sortOrder: 0,
          },
          {
            degree: "Master 1 in General Physics",
            institution: "Université Paris-Saclay",
            years: "2021",
            sortOrder: 1,
          },
          {
            degree: "BSc in Physics",
            institution: "BRAC University",
            years: "2019",
            thesis:
              "Quantization of black-hole horizon area and multipartite entanglement of information subsystems",
            sortOrder: 2,
          },
        ],
      },
      positions: {
        create: [
          {
            title: "Lecturer",
            institution: "BRAC University",
            years: "Current",
            sortOrder: 0,
          },
          {
            title: "Adjunct Lecturer of Physics and Mathematics",
            institution: "BRAC University",
            years: "2024–2025",
            sortOrder: 1,
          },
          {
            title: "Vice-Chancellor's Fellow in Physics and Mathematics",
            institution: "BRAC University",
            years: "2020–2022",
            sortOrder: 2,
          },
        ],
      },
      teaching: {
        create: [
          {
            title: "General Relativity and Cosmology",
            institution: "BRAC University",
            description: "Public faculty profile lists teaching in general relativity and cosmology.",
            sortOrder: 0,
          },
          {
            title: "Waves and Oscillations",
            institution: "BRAC University",
            sortOrder: 1,
          },
        ],
      },
      awards: {
        create: [
          { title: "Vice Chancellor's Certificate", issuer: "BRAC University", sortOrder: 0 },
          { title: "Dean's List", issuer: "BRAC University", description: "Three semesters during BSc studies, as listed on the public faculty profile.", sortOrder: 1 },
          { title: "MSc scholarship ranking", issuer: "University of Bologna, DIFA", description: "Public BRAC profile lists a second-place scholarship ranking in the MSc Theoretical Physics programme.", sortOrder: 2 },
        ],
      },
    },
  });

  const mishaal = await db.person.create({
    data: {
      slug: "mishaal-hai",
      name: "Mishaal Hai",
      role: "RESEARCH_ASSISTANT",
      title: "Research Assistant",
      affiliation: "BRAC University",
      bio:
        "Mishaal Hai is a theoretical-physics researcher with an MSc in Theoretical Physics from the University of Bologna. His public ORCID record lists current employment as a Research Assistant at BRAC University. His research record includes perturbative string cosmology, moduli stabilisation and fibre inflation, while earlier public teaching material lists interests in black holes and quantum gravity.",
      researchSummary:
        "String cosmology, perturbative moduli stabilisation, inflation, black holes and quantum gravity.",
      researchInterests:
        "String cosmology\nString compactifications\nModuli stabilisation\nInflation\nBlack holes\nQuantum gravity",
      inspire: INSPIRE.mishaal,
      orcid: "https://orcid.org/0009-0005-9511-5381",
      sortOrder: 4,
      featured: true,
      researchAreas: {
        connect: [
          { id: areaIds["string-compactifications"] },
          { id: areaIds["early-universe-cosmology"] },
          { id: areaIds["black-holes-gravitation"] },
        ],
      },
      education: {
        create: [
          {
            degree: "MSc in Theoretical Physics",
            institution: "University of Bologna",
            years: "2025",
            sortOrder: 0,
          },
          {
            degree: "BSc in Physics",
            institution: "BRAC University",
            years: "2019",
            thesis: "Non-local gravitational interactions and the black hole information paradox",
            sortOrder: 1,
          },
        ],
      },
      positions: {
        create: [
          {
            title: "Research Assistant",
            institution: "BRAC University",
            years: "2025–present (public ORCID record)",
            sortOrder: 0,
          },
          {
            title: "VC's Fellow / Lecturer",
            institution: "BRAC University",
            years: "Earlier public BRAC course records",
            sortOrder: 1,
          },
        ],
      },
      teaching: {
        create: [
          { title: "Mathematics and physics course coordination", institution: "BRAC University", description: "Earlier BRAC course pages list teaching/course-coordination roles before the current research-assistant appointment.", sortOrder: 0 },
        ],
      },
    },
  });

  const shaikot = await db.person.create({
    data: {
      slug: "md-shaikot-jahan-shuvo",
      name: "Md Shaikot Jahan Shuvo",
      role: "RESEARCH_ASSISTANT",
      title: "Research Assistant",
      affiliation: "BRAC University",
      email: "mshuvo@ccny.cuny.edu",
      bio:
        "Md Shaikot Jahan Shuvo is a Research Assistant at BRAC University, where he has held the appointment since August 2026. He holds an MPhil in Physics from the CUNY Graduate Center. His research spans string theory, string cosmology, compactification and nonequilibrium quantum field theory. His undergraduate thesis at BRAC University studied the Matrix Big Bang model and two-loop dynamics.",
      researchSummary:
        "Nonequilibrium field theory, string cosmology, compactification and high-energy theory.",
      researchInterests:
        "String theory\nString cosmology\nQuantum field theory\nNonequilibrium field theory\nCompactification\nEarly-universe cosmology",
      inspire: INSPIRE.shaikot,
      website: "https://www.ccny.cuny.edu/profiles/md-shaikot-jahan-shuvo",
      sortOrder: 5,
      featured: true,
      researchAreas: {
        connect: [
          { id: areaIds["quantum-field-theory"] },
          { id: areaIds["string-theory"] },
          { id: areaIds["string-compactifications"] },
          { id: areaIds["early-universe-cosmology"] },
        ],
      },
      education: {
        create: [
          {
            degree: "MPhil in Physics",
            institution: "The Graduate Center, City University of New York (CUNY)",
            years: "2026",
            sortOrder: 0,
          },
          {
            degree: "BSc in Physics",
            institution: "BRAC University",
            years: "2020",
            thesis: "A two loop test of Matrix Big Bang Model",
            sortOrder: 1,
          },
        ],
      },
      positions: {
        create: [
          { title: "Research Assistant", institution: "BRAC University", years: "August 2026–present", sortOrder: 0 },
          { title: "Graduate Teaching Assistant, Physics", institution: "The City College of New York, CUNY", years: "August–December 2025", sortOrder: 1 },
          { title: "Adjunct Lecturer", institution: "BRAC University", years: "July 2020–July 2022", sortOrder: 2 },
        ],
      },
    },
  });

  type PublicationSeed = {
    slug: string;
    title: string;
    authorText: string;
    year: number;
    type?: string;
    journal?: string;
    volume?: string;
    pages?: string;
    doi?: string;
    arxivId?: string;
    abstract: string;
    featured?: boolean;
    authorIds: string[];
    areaSlugs: string[];
  };

  const publicationSeeds: PublicationSeed[] = [
    {
      slug: "effect-moduli-redefinitions-fibre-inflation",
      title: "Effect of moduli redefinitions on fibre inflation",
      authorText:
        "Dibya Chakraborty, Mishaal Hai, Sayeda Tashnuba Jahan, Ahmed Rakin Kamal, Md Shaikot Jahan Shuvo",
      year: 2026,
      type: "JOURNAL_ARTICLE",
      journal: "Journal of Cosmology and Astroparticle Physics",
      volume: "2026(06)",
      pages: "025",
      doi: "10.1088/1475-7516/2026/06/025",
      arxivId: "2511.19610",
      abstract:
        "A perturbative large-volume string-cosmology study of fibre inflation with modulus redefinitions, including early- and late-time cosmological sectors.",
      featured: true,
      authorIds: [mishaal.id, tashnuba.id, ahmed.id, shaikot.id],
      areaSlugs: ["string-compactifications", "early-universe-cosmology"],
    },
    {
      slug: "time-dependent-flux-backgrounds-type-iib",
      title: "Time-dependent flux backgrounds in type IIB supergravity",
      authorText: "Ahmed Rakin Kamal, Ratul Mahanta",
      year: 2026,
      type: "JOURNAL_ARTICLE",
      journal: "Journal of High Energy Physics",
      volume: "2026(06)",
      pages: "188",
      doi: "10.1007/JHEP06(2026)188",
      arxivId: "2512.19793",
      abstract:
        "Time-dependent type-IIB supergravity backgrounds with a dynamical compactification scale, fluxes and axiodilaton, together with energy-condition and no-go analyses.",
      featured: true,
      authorIds: [ahmed.id],
      areaSlugs: ["string-theory", "string-compactifications", "early-universe-cosmology"],
    },
    {
      slug: "one-loop-d11-d10-four-point-check",
      title: "One loop in D = 11 vs D = 10: 4-point check",
      authorText:
        "Aviral Aggarwal, Subhroneel Chakrabarti, Steven Weilong Hsia, Ahmed Rakin Kamal, Linus Wulff",
      year: 2026,
      type: "JOURNAL_ARTICLE",
      journal: "Journal of High Energy Physics",
      volume: "2026(02)",
      pages: "010",
      doi: "10.1007/JHEP02(2026)010",
      arxivId: "2506.16391",
      abstract:
        "A four-point comparison of one-loop higher-derivative structures in eleven-dimensional supergravity and ten-dimensional type-IIA string theory.",
      featured: true,
      authorIds: [ahmed.id],
      areaSlugs: ["string-theory", "quantum-field-theory"],
    },
    {
      slug: "perturbative-kahler-moduli-inflation",
      title: "Perturbative Kähler Moduli Inflation",
      authorText:
        "Mishaal Hai, Ahmed Rakin Kamal, Noshin Ferdous Shamma, Md Shaikot Jahan Shuvo",
      year: 2025,
      type: "PREPRINT",
      arxivId: "2506.08083",
      abstract:
        "Inflationary models from perturbative Kähler-modulus stabilisation in type-IIB compactifications, with controlled effective-field-theory and cosmological regimes.",
      featured: true,
      authorIds: [mishaal.id, ahmed.id, shaikot.id],
      areaSlugs: ["string-compactifications", "early-universe-cosmology"],
    },
    {
      slug: "no-manifest-t-duality-alpha-prime-three",
      title: "No manifest T duality at order α′³",
      authorText: "Steven Weilong Hsia, Ahmed Rakin Kamal, Linus Wulff",
      year: 2025,
      type: "JOURNAL_ARTICLE",
      journal: "Physical Review D",
      volume: "111",
      pages: "L061904",
      doi: "10.1103/PhysRevD.111.L061904",
      abstract:
        "An analysis of field redefinitions and T-duality at order α′³ showing an obstruction to lifting the relevant lower-dimensional redefinitions to ten dimensions.",
      authorIds: [ahmed.id],
      areaSlugs: ["string-theory", "mathematical-physics"],
    },
    {
      slug: "loop-diagrams-kinetic-theory-waves",
      title: "Loop diagrams in the kinetic theory of waves",
      authorText:
        "Vladimir Rosenhaus, Daniel Schubring, Md Shaikot Jahan Shuvo, Michael Smolkin",
      year: 2024,
      type: "JOURNAL_ARTICLE",
      journal: "Journal of High Energy Physics",
      volume: "2024(06)",
      pages: "025",
      doi: "10.1007/JHEP06(2024)025",
      arxivId: "2308.00740",
      abstract:
        "A diagrammatic treatment of loop corrections in weak-wave kinetic theory, including a next-to-leading-order kinetic equation and an all-orders graphical prescription.",
      featured: true,
      authorIds: [shaikot.id],
      areaSlugs: ["quantum-field-theory"],
    },
    {
      slug: "bopp-shifts-toroidal-shadows",
      title:
        "From Bopp shifts to toroidal shadows: K-theoretic gap labels in noncommutative quantum mechanics",
      authorText: "Syed Hasibul Hassan Chowdhury",
      year: 2026,
      type: "JOURNAL_ARTICLE",
      journal: "Journal of Geometry and Physics",
      volume: "229",
      pages: "105942",
      doi: "10.1016/j.geomphys.2026.105942",
      abstract:
        "A mathematical-physics study connecting Bopp shifts, noncommutative quantum mechanics and toroidal/K-theoretic structures.",
      featured: true,
      authorIds: [hasibul.id],
      areaSlugs: ["mathematical-physics"],
    },
    {
      slug: "supersymmetric-qm-noncommutative-plane",
      title:
        "Supersymmetric quantum mechanics on a noncommutative plane through the lens of deformation quantization",
      authorText: "Md. Rafsanjany Jim, Syed Hasibul Hassan Chowdhury",
      year: 2024,
      type: "JOURNAL_ARTICLE",
      journal: "Annals of Physics",
      volume: "467",
      pages: "169718",
      doi: "10.1016/j.aop.2024.169718",
      abstract:
        "Supersymmetric quantum mechanics on a noncommutative plane formulated using deformation-quantization methods.",
      authorIds: [hasibul.id],
      areaSlugs: ["mathematical-physics", "quantum-field-theory"],
    },
    {
      slug: "gauge-invariant-energy-spectra-ncqm",
      title: "Gauge invariant energy spectra in 2-dimensional noncommutative quantum mechanics",
      authorText: "Syed Hasibul Hassan Chowdhury et al.",
      year: 2021,
      type: "JOURNAL_ARTICLE",
      journal: "Annals of Physics",
      volume: "430",
      pages: "168505",
      doi: "10.1016/j.aop.2021.168505",
      arxivId: "2003.12662",
      abstract:
        "A study of gauge-invariant spectral information in two-dimensional noncommutative quantum mechanics.",
      authorIds: [hasibul.id],
      areaSlugs: ["mathematical-physics"],
    },
    {
      slug: "inflationary-brane-antibrane-universe",
      title: "The Inflationary Brane-Antibrane Universe",
      authorText: "C. P. Burgess, M. Majumdar, D. Nolte, F. Quevedo, G. Rajesh, R.-J. Zhang",
      year: 2001,
      type: "JOURNAL_ARTICLE",
      journal: "Journal of High Energy Physics",
      volume: "2001(07)",
      pages: "047",
      doi: "10.1088/1126-6708/2001/07/047",
      arxivId: "hep-th/0105204",
      abstract:
        "A brane-antibrane cosmology in which inter-brane motion can provide an inflationary degree of freedom and tachyon dynamics ends inflation.",
      authorIds: [mahbub.id],
      areaSlugs: ["string-theory", "early-universe-cosmology"],
    },
    {
      slug: "d-brane-antibrane-annihilation-expanding-universe",
      title: "D-brane anti-brane annihilation in an expanding universe",
      authorText: "Mahbub Majumdar, Anne-Christine Davis",
      year: 2003,
      type: "JOURNAL_ARTICLE",
      journal: "Journal of High Energy Physics",
      volume: "2003(12)",
      pages: "012",
      doi: "10.1088/1126-6708/2003/12/012",
      arxivId: "hep-th/0304153",
      abstract:
        "A cosmological analysis of D-brane and anti-D-brane annihilation in an expanding universe and the resulting dimensional hierarchy of surviving branes.",
      authorIds: [mahbub.id],
      areaSlugs: ["string-theory", "early-universe-cosmology"],
    },
    {
      slug: "inflation-tachyon-condensation-large-n",
      title: "Inflation from tachyon condensation, large N effects",
      authorText: "Mahbub Majumdar, Anne-Christine Davis",
      year: 2004,
      type: "JOURNAL_ARTICLE",
      journal: "Physical Review D",
      volume: "69",
      pages: "103504",
      doi: "10.1103/PhysRevD.69.103504",
      arxivId: "hep-th/0304226",
      abstract:
        "A study of assisted and staggered tachyon condensation showing how large-N brane-antibrane systems can support inflationary dynamics.",
      authorIds: [mahbub.id],
      areaSlugs: ["string-theory", "early-universe-cosmology"],
    },
  ];

  const publicationIds: Record<string, string> = {};
  for (const item of publicationSeeds) {
    const created = await db.publication.create({
      data: {
        slug: item.slug,
        title: item.title,
        authorText: item.authorText,
        year: item.year,
        type: item.type ?? "PREPRINT",
        journal: item.journal,
        volume: item.volume,
        pages: item.pages,
        doi: item.doi,
        arxivId: item.arxivId,
        abstract: item.abstract,
        featured: item.featured ?? false,
        inspireUrl: item.arxivId
          ? `https://inspirehep.net/literature?q=arxiv:${encodeURIComponent(item.arxivId)}`
          : undefined,
        pdfUrl: item.arxivId?.match(/^\d{4}\.\d{4,5}$/)
          ? `https://arxiv.org/pdf/${item.arxivId}`
          : undefined,
        bibtex: `@article{${item.slug},\n  title={${item.title}},\n  author={${item.authorText}},\n  year={${item.year}}${item.doi ? `,\n  doi={${item.doi}}` : ""}${item.arxivId ? `,\n  eprint={${item.arxivId}}` : ""}\n}`,
        authors: { connect: item.authorIds.map((id) => ({ id })) },
        researchAreas: {
          connect: item.areaSlugs.map((slug) => ({ id: areaIds[slug] })),
        },
      },
    });
    publicationIds[item.slug] = created.id;
  }

  const projects = [
    {
      slug: "perturbative-string-cosmology",
      title: "Perturbative String Cosmology",
      shortDescription:
        "A publication-linked research theme spanning perturbative moduli stabilisation, Kähler-modulus inflation and fibre-inflation scenarios.",
      description:
        "This site-level research cluster groups publicly listed work on perturbative string compactification and cosmology. It is generated from member research records and should not be interpreted as a separate funded project unless the group later labels it as such.",
      leadText: "Ahmed Rakin Kamal, Mishaal Hai, Sayeda Tashnuba Jahan and collaborators",
      members: [ahmed.id, mishaal.id, tashnuba.id, shaikot.id],
      areas: ["string-compactifications", "early-universe-cosmology"],
      publications: [
        "effect-moduli-redefinitions-fibre-inflation",
        "perturbative-kahler-moduli-inflation",
      ],
      featured: true,
    },
    {
      slug: "higher-derivative-string-theory",
      title: "Higher-Derivative String Theory and Dualities",
      shortDescription:
        "Higher-derivative corrections, M-theory/type-II reductions and duality constraints in string effective actions.",
      description:
        "This research cluster organizes public work on higher-derivative corrections and string dualities, including four-point checks and T-duality constraints.",
      leadText: "Ahmed Rakin Kamal and collaborators",
      members: [ahmed.id],
      areas: ["string-theory", "quantum-field-theory"],
      publications: ["one-loop-d11-d10-four-point-check", "no-manifest-t-duality-alpha-prime-three"],
      featured: true,
    },
    {
      slug: "time-dependent-compactification",
      title: "Time Dependent Backgrounds in String Theory and Early Universe Cosmology",
      shortDescription:
        "Time-dependent internal geometry, flux backgrounds and cosmological solutions in higher-dimensional supergravity and early-universe theory.",
      description:
        "This group project connects dynamical compactification, time-dependent string/supergravity backgrounds and early-universe cosmology. Public project information identifies BRAC University Research Seed Grant Initiative support.",
      leadText: "Mahbubul Alam Majumdar (PI); Ratul Mahanta and Ahmed Rakin Kamal (Co-PIs)",
      funding: "BRAC University Research Seed Grant Initiative (RSGI) — USD 4,000 (public project record)",
      members: [mahbub.id, ahmed.id],
      areas: ["string-compactifications", "early-universe-cosmology"],
      publications: ["time-dependent-flux-backgrounds-type-iib"],
      featured: true,
    },
    {
      slug: "noncommutative-mathematical-physics",
      title: "Noncommutative Geometry and Quantum Mechanics",
      shortDescription:
        "Noncommutative quantum mechanics, deformation quantization and geometric/representation-theoretic structures.",
      description:
        "A research cluster reflecting Syed Hasibul Hassan Chowdhury's public publication record in noncommutative quantum mechanics and mathematical physics.",
      leadText: "Syed Hasibul Hassan Chowdhury",
      members: [hasibul.id],
      areas: ["mathematical-physics"],
      publications: [
        "bopp-shifts-toroidal-shadows",
        "supersymmetric-qm-noncommutative-plane",
        "gauge-invariant-energy-spectra-ncqm",
      ],
      featured: false,
    },
    {
      slug: "quantum-gravity-cosmology",
      title: "Quantum Gravity, Black Holes and Cosmology",
      shortDescription:
        "A broad research theme connecting string cosmology, quantum black holes and early-universe physics.",
      description:
        "This cluster groups public research interests and publications across string cosmology, black-hole information and primordial-universe theory.",
      leadText: "Mahbubul Alam Majumdar, Sayeda Tashnuba Jahan and collaborators",
      members: [mahbub.id, tashnuba.id],
      areas: ["string-theory", "black-holes-gravitation", "early-universe-cosmology"],
      publications: [
        "inflationary-brane-antibrane-universe",
        "d-brane-antibrane-annihilation-expanding-universe",
        "inflation-tachyon-condensation-large-n",
      ],
      featured: false,
    },
  ];

  for (let index = 0; index < projects.length; index += 1) {
    const item = projects[index];
    await db.project.create({
      data: {
        slug: item.slug,
        title: item.title,
        shortDescription: item.shortDescription,
        description: item.description,
        leadText: item.leadText,
        funding: "funding" in item ? item.funding : null,
        status: "CURRENT",
        featured: item.featured,
        sortOrder: index,
        members: { connect: item.members.map((id) => ({ id })) },
        researchAreas: {
          connect: item.areas.map((slug) => ({ id: areaIds[slug] })),
        },
        publications: {
          connect: item.publications.map((slug) => ({ id: publicationIds[slug] })),
        },
      },
    });
  }

  const newsItems = [
    {
      slug: "time-dependent-flux-backgrounds-jhep-2026",
      title: "Time-dependent flux backgrounds published in JHEP",
      summary:
        "Ahmed Rakin Kamal and Ratul Mahanta's work on time-dependent type-IIB flux backgrounds appeared in JHEP in June 2026.",
      date: new Date("2026-06-17T00:00:00Z"),
      externalUrl: "https://doi.org/10.1007/JHEP06(2026)188",
    },
    {
      slug: "fibre-inflation-jcap-2026",
      title: "Fibre-inflation work published in JCAP",
      summary:
        "The collaboration on moduli redefinitions and fibre inflation was published in JCAP in June 2026.",
      date: new Date("2026-06-08T00:00:00Z"),
      externalUrl: "https://doi.org/10.1088/1475-7516/2026/06/025",
    },
    {
      slug: "one-loop-d11-d10-jhep-2026",
      title: "Higher-derivative four-point check published in JHEP",
      summary:
        "The D=11 versus D=10 one-loop four-point analysis appeared in JHEP in February 2026.",
      date: new Date("2026-02-02T00:00:00Z"),
      externalUrl: "https://doi.org/10.1007/JHEP02(2026)010",
    },
    {
      slug: "noncommutative-geometry-jgp-2026",
      title: "New work in noncommutative mathematical physics",
      summary:
        "Syed Hasibul Hassan Chowdhury's 2026 Journal of Geometry and Physics article links Bopp shifts, toroidal structures and K-theoretic gap labels in noncommutative quantum mechanics.",
      date: new Date("2026-01-15T00:00:00Z"),
      externalUrl: "https://doi.org/10.1016/j.geomphys.2026.105942",
    },
    {
      slug: "ahmed-rakin-kamal-string-pheno-2026",
      title: "String-Pheno seminar on time-dependent type-IIB backgrounds",
      summary:
        "Ahmed Rakin Kamal presented time-dependent flux backgrounds in type IIB supergravity at the String-Pheno Seminars on 10 February 2026.",
      date: new Date("2026-02-10T00:00:00Z"),
      externalUrl: "https://sites.google.com/view/string-pheno-seminars/past-talks",
    },
    {
      slug: "pwf-bangladesh-gr-cosmology-school-2025",
      title: "Group members contribute to PWF Bangladesh school on gravitation and cosmology",
      summary:
        "Ahmed Rakin Kamal, Sayeda Tashnuba Jahan and Mishaal Hai were listed among the programme coordinators for the 2025 Physics Without Frontiers Bangladesh School on General Relativity and Cosmology.",
      date: new Date("2025-05-28T00:00:00Z"),
      externalUrl: "https://indico.ictp.it/event/11010/",
    },
  ];

  for (let index = 0; index < newsItems.length; index += 1) {
    const item = newsItems[index];
    await db.newsPost.create({
      data: {
        ...item,
        body: item.summary,
        featured: index < 3,
        sortOrder: index,
      },
    });
  }

  await db.page.create({
    data: {
      slug: "join",
      title: "Join Us",
      eyebrow: "Opportunities",
      body:
        "## Prospective Graduate Students\nWe welcome inquiries from students whose interests overlap strongly with the group's current research. Specific openings depend on supervision capacity and funding availability.\n\n## Undergraduate Researchers\nMotivated students may contact the group with a concise description of their preparation and research interests.\n\n## Research Assistants and Postdoctoral Researchers\nWhen funded positions are available, calls will be posted here.\n\n## Visitors and Collaborations\nResearchers interested in seminars, visits or focused collaborations are welcome to make contact.\n\n## How to Contact Us\nA useful first message includes a CV, transcript where relevant, a short statement of interests, and links to representative publications, projects or software.",
    },
  });

  await db.page.create({
    data: {
      slug: "about",
      title: "About the Group",
      eyebrow: "Fundamental Physics",
      body:
        "The Fundamental Physics & Cosmology Group brings together researchers at BRAC University and collaborators working on fundamental questions in theoretical physics.\n\n## Research\nOur interests include string theory, quantum gravity, early-universe cosmology, quantum field theory, black holes, compactification and mathematical physics.\n\n## Collaboration\nExplore our people, research projects and publications to learn more about our work. We welcome inquiries from researchers and students with shared interests.\n\n## Institutional Affiliation\nBRAC University, Dhaka, Bangladesh.",
    },
  });

  console.log(
    "Initial content ready: 6 researcher profiles, 6 research areas, 5 projects, 12 publications and 6 news items. No scheduled events have been added.",
  );
}

client.$transaction(seed, { timeout: 60000 })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.$disconnect();
  });
