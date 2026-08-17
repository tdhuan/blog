// Single source of truth for CV content (spec §3). The CV page and the
// print/PDF output both render from these values — edit here only.

export interface CvContact {
  kind: "email" | "phone" | "github";
  href: string;
  label: string;
}

export interface CvProfile {
  name: string;
  role: string;
  summary: string;
  openToOpportunities: boolean;
  contacts: CvContact[];
}

export interface CvExperienceEntry {
  title: string;
  company: string;
  period: string;
  summary: string;
  highlights: string[];
  stack: string[];
}

export interface CvEducationEntry {
  institution: string;
  degree: string;
  period: string;
}

export const profile: CvProfile = {
  name: "Huan Tran Dinh",
  role: "Front end developer",
  summary:
    "Software engineer interested in building considered digital experiences, useful tools, and the systems that make them last.",
  openToOpportunities: true,
  contacts: [
    {
      kind: "email",
      href: "mailto:tdhuan013@gmail.com",
      label: "tdhuan013@gmail.com",
    },
    { kind: "phone", href: "tel:+84962468571", label: "0962 468 571" },
    {
      kind: "github",
      href: "https://github.com/tdhuan",
      label: "github.com/tdhuan",
    },
  ],
};

export const experience: CvExperienceEntry[] = [
  {
    title: "Software Engineer",
    company: "Camelo",
    period: "05/2021 — 03/2026",
    summary:
      "Contributed to the development and continued improvement of Camelo’s web product and customer-facing sites.",
    highlights: [
      "Helped evolve the web application from its early stages into a production product.",
      "Collaborated with designers to deliver features end to end, from planning and implementation through testing and release",
      "Built reusable, responsive interface patterns and documented them in Storybook for the team.",
      "Implemented data-driven interface flows using React and GraphQL.",
      "Investigated and resolved bugs in the web app.",
      "Supported teammates with implementation questions and day-to-day development work.",
    ],
    stack: [
      "TypeScript",
      "React",
      "Next.js",
      "GraphQL",
      "Tailwind CSS",
      "Headless UI",
      "TanStack Query",
      "React Hook Form",
      "Storybook",
    ],
  },
  {
    title: "Front End Engineer",
    company: "Sutrix Solution",
    period: "12/2020 — 05/2021",
    summary:
      "Contributed to the development and continued improvement of Camelo’s web product and customer-facing sites.",
    highlights: [
      "Helped evolve the web application from its early stages into a production product.",
      "Collaborated with designers to deliver features end to end, from planning and implementation through testing and release",
    ],
    stack: ["React, Redux"],
  },
];

export const education: CvEducationEntry[] = [
  {
    institution: "VNUHCM - University of Science",
    degree: "Bachelor's degree, Information Technology",
    period: "2015 — 2019",
  },
];
