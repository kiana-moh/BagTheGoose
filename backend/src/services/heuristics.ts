import type {
  DegreeLevel,
  HardDisqualifier,
  JobFitAnalysis,
  JobPosting,
  ParsedResumeDocument,
  ResumeSection,
  StructuredResumeProfile,
  TargetRole
} from "../domain/models.js";

const KNOWN_SKILLS = [
  "python",
  "java",
  "typescript",
  "javascript",
  "react",
  "next.js",
  "node.js",
  "postgresql",
  "sql",
  "aws",
  "docker",
  "kubernetes",
  "tensorflow",
  "pytorch",
  "pandas",
  "fastapi",
  "flask",
  "c++",
  "go",
  "rust",
  "machine learning",
  "data pipelines"
];

const ROLE_MAP: Array<{ keyword: string; roles: string[] }> = [
  {
    keyword: "machine learning",
    roles: ["Machine Learning Engineer", "Data Engineer", "Applied AI Engineer"]
  },
  {
    keyword: "python",
    roles: ["Backend Engineer", "Software Engineer", "Data Engineer"]
  },
  {
    keyword: "react",
    roles: ["Frontend Engineer", "Full Stack Engineer", "Web Developer"]
  },
  {
    keyword: "node.js",
    roles: ["Backend Engineer", "Full Stack Engineer", "Platform Engineer"]
  },
  {
    keyword: "aws",
    roles: ["Platform Engineer", "Infrastructure Engineer", "Backend Engineer"]
  }
];

export function normalizePlainText(latex: string): string {
  return latex
    .replace(/%.*$/gm, " ")
    .replace(/\\section\*?\{([^}]*)\}/g, "\nSECTION: $1\n")
    .replace(/\\subsection\*?\{([^}]*)\}/g, "\nSUBSECTION: $1\n")
    .replace(/\\textbf\{([^}]*)\}/g, "$1")
    .replace(/\\emph\{([^}]*)\}/g, "$1")
    .replace(/\\item/g, "\n- ")
    .replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, " ")
    .replace(/[{}&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractSections(latex: string): ResumeSection[] {
  const sectionRegex = /\\section\*?\{([^}]*)\}/g;
  const sections: ResumeSection[] = [];
  const matches = Array.from(latex.matchAll(sectionRegex));

  for (let index = 0; index < matches.length; index += 1) {
    const heading = matches[index][1].trim();
    const start = matches[index].index ?? 0;
    const nextStart = matches[index + 1]?.index ?? latex.length;
    const rawContent = latex.slice(start, nextStart);
    const plainContent = normalizePlainText(rawContent);
    const bullets = plainContent
      .split("- ")
      .map((part) => part.trim())
      .filter(Boolean);

    sections.push({
      heading,
      content: plainContent,
      bullets
    });
  }

  return sections;
}

export function detectSkills(text: string): string[] {
  const lower = text.toLowerCase();
  return KNOWN_SKILLS.filter((skill) => lower.includes(skill.toLowerCase()));
}

export function inferDegreeLevel(text: string): DegreeLevel {
  const lower = text.toLowerCase();

  if (lower.includes("phd") || lower.includes("doctor")) {
    return "phd";
  }

  if (lower.includes("master")) {
    return "masters";
  }

  if (lower.includes("bachelor") || lower.includes("b.sc") || lower.includes("basc")) {
    return "bachelors";
  }

  return "unknown";
}

export function inferGraduationYear(text: string): number | undefined {
  const matches = Array.from(text.matchAll(/\b(20\d{2})\b/g)).map((match) => Number(match[1]));
  if (matches.length === 0) {
    return undefined;
  }

  return Math.max(...matches);
}

export function inferMajors(text: string): string[] {
  const candidates = [
    "computer science",
    "software engineering",
    "computer engineering",
    "data science",
    "statistics",
    "mathematics",
    "electrical engineering"
  ];

  const lower = text.toLowerCase();
  return candidates.filter((candidate) => lower.includes(candidate));
}

export function buildDeterministicProfile(parsed: ParsedResumeDocument): StructuredResumeProfile {
  const technologies = detectSkills(parsed.plainText);
  const degreeLevel = inferDegreeLevel(parsed.plainText);
  const graduationYear = inferGraduationYear(parsed.plainText);
  const majors = inferMajors(parsed.plainText);
  const experienceSection = parsed.sections.find((section) =>
    section.heading.toLowerCase().includes("experience")
  );
  const projectSection = parsed.sections.find((section) =>
    section.heading.toLowerCase().includes("project")
  );

  return {
    candidateSummary:
      "Candidate with early-career technical experience inferred from resume content.",
    degreeLevel,
    majors,
    graduationYear,
    education: [
      {
        degreeLevel,
        program: majors[0],
        graduationYear,
        evidence: parsed.educationLines.slice(0, 3)
      }
    ].filter((entry) => entry.evidence.length > 0 || entry.program || entry.graduationYear),
    skills: technologies,
    technologies,
    domainsOfStrength: inferDomains(parsed.plainText),
    rolePatterns: inferRoleSeedsFromProfileText(parsed.plainText),
    experience: experienceSection
      ? [
          {
            title: undefined,
            organization: undefined,
            bullets: experienceSection.bullets.slice(0, 6),
            domains: inferDomains(experienceSection.content),
            technologies: detectSkills(experienceSection.content)
          }
        ]
      : [],
    projects: projectSection
      ? [
          {
            name: undefined,
            bullets: projectSection.bullets.slice(0, 6),
            domains: inferDomains(projectSection.content),
            technologies: detectSkills(projectSection.content)
          }
        ]
      : [],
    evidenceHighlights: [
      ...parsed.educationLines.slice(0, 2),
      ...parsed.experienceLines.slice(0, 2),
      ...parsed.projectLines.slice(0, 2)
    ].filter(Boolean),
    confidence: 0.55
  };
}

export function inferRoleSeeds(profile: StructuredResumeProfile): string[] {
  const seeds = new Set<string>();

  for (const tech of profile.technologies) {
    for (const mapping of ROLE_MAP) {
      if (tech.toLowerCase().includes(mapping.keyword)) {
        for (const role of mapping.roles) {
          seeds.add(role);
        }
      }
    }
  }

  for (const pattern of profile.rolePatterns) {
    seeds.add(pattern);
  }

  if (seeds.size === 0) {
    seeds.add("Software Engineer");
    seeds.add("Backend Engineer");
  }

  return Array.from(seeds);
}

export function buildFallbackTargetRoles(profile: StructuredResumeProfile): TargetRole[] {
  return inferRoleSeeds(profile).slice(0, 6).map((role, index) => ({
    role,
    category: index < 3 ? "direct" : "adjacent",
    rationale: `Supported by skills and patterns seen in the profile for ${role}.`,
    confidence: index < 3 ? 0.75 : 0.58,
    evidence: profile.technologies.slice(0, 4)
  }));
}

export function buildScrapingProfile(profile: StructuredResumeProfile, targetRoles: TargetRole[]) {
  return {
    desiredRoleKeywords: targetRoles
      .filter((role) => role.category === "direct")
      .map((role) => role.role.toLowerCase()),
    adjacentRoleKeywords: targetRoles
      .filter((role) => role.category !== "direct")
      .map((role) => role.role.toLowerCase()),
    blockedSeniorityKeywords: ["senior", "staff", "principal", "lead", "manager", "director"],
    preferredLocations: ["remote", "canada", "ontario", "toronto", "waterloo"],
    blockedLocations: [],
    blockedVisaTerms: [
      "u.s. citizenship required",
      "security clearance required",
      "must be authorized without sponsorship"
    ],
    blockedDegreeTerms: profile.degreeLevel === "bachelors" || profile.degreeLevel === "unknown"
      ? ["phd required", "doctoral degree required"]
      : [],
    skillHints: profile.technologies.slice(0, 12)
  };
}

export function detectHardDisqualifiers(
  profile: StructuredResumeProfile,
  job: JobPosting
): HardDisqualifier[] {
  const description = job.description.toLowerCase();
  const disqualifiers: HardDisqualifier[] = [];

  if (
    profile.degreeLevel !== "phd" &&
    (description.includes("phd required") || description.includes("doctoral degree required"))
  ) {
    disqualifiers.push({
      type: "degree_requirement",
      reason: "Job explicitly requires a PhD or doctoral degree.",
      severity: "hard"
    });
  }

  if (
    description.includes("u.s. citizenship required") ||
    description.includes("security clearance required")
  ) {
    disqualifiers.push({
      type: "citizenship_requirement",
      reason: "Job includes citizenship or clearance requirements.",
      severity: "hard"
    });
  }

  if (
    description.includes("authorized to work") &&
    description.includes("without sponsorship")
  ) {
    disqualifiers.push({
      type: "visa_requirement",
      reason: "Job requires work authorization without sponsorship.",
      severity: "hard"
    });
  }

  const yearsMatch = description.match(/(\d+)\+?\s+years?/i);
  if (yearsMatch && Number(yearsMatch[1]) >= 4) {
    disqualifiers.push({
      type: "years_requirement",
      reason: `Job asks for ${yearsMatch[1]}+ years of experience.`,
      severity: "warning"
    });
  }

  if (/\b(senior|staff|principal|lead)\b/i.test(job.title)) {
    disqualifiers.push({
      type: "seniority_requirement",
      reason: "Job title signals seniority beyond an early-career target.",
      severity: "hard"
    });
  }

  return disqualifiers;
}

export function buildFallbackJobFit(
  profile: StructuredResumeProfile,
  job: JobPosting,
  hardDisqualifiers: HardDisqualifier[],
  semanticSimilarity: number
): JobFitAnalysis {
  const missingSkills = detectMissingSkills(profile, job.description);
  const hardPenalty = hardDisqualifiers.some((item) => item.severity === "hard") ? 0.35 : 0;
  const weaknessPenalty = Math.min(0.25, missingSkills.length * 0.05);
  const score = Math.max(
    0,
    Math.min(1, semanticSimilarity * 0.65 + 0.25 - hardPenalty - weaknessPenalty)
  );

  return {
    overallScore: score,
    semanticSimilarity,
    recommendation:
      score >= 0.8 ? "strong_apply" : score >= 0.62 ? "apply" : score >= 0.45 ? "borderline" : "skip",
    strengths: profile.technologies.slice(0, 5).map((skill) => `Evidence of ${skill} experience.`),
    weaknesses: missingSkills.map((skill) => `Job appears to require ${skill}.`),
    missingSkills,
    hardDisqualifiers,
    evidence: profile.evidenceHighlights.slice(0, 6),
    resumeTailoringHooks: job.description
      .split(/[.\n]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => detectSkills(part).length > 0)
      .slice(0, 5)
  };
}

export function buildFallbackTailoringPlan(
  profile: StructuredResumeProfile,
  job: JobPosting,
  originalLatexResume: string
) {
  const jobSkills = detectSkills(job.description);

  return {
    summary: "Emphasize the most relevant existing technical work and align wording with the job.",
    edits: jobSkills.slice(0, 3).map((skill) => ({
      section: "Experience or Projects",
      target: skill,
      suggestedRewrite: `Rewrite an existing bullet to foreground ${skill} where it is already truthfully represented.`,
      rationale: `The job description emphasizes ${skill}.`
    })),
    skillsToElevate: jobSkills,
    bulletsToPrioritize: profile.evidenceHighlights.slice(0, 4),
    prohibitedClaims: [
      "Do not add unearned metrics.",
      "Do not claim ownership or technologies missing from the resume.",
      `Do not introduce statements unsupported by: ${originalLatexResume.slice(0, 80)}...`
    ]
  };
}

export function inferDomains(text: string): string[] {
  const lower = text.toLowerCase();
  const domains = [
    "backend",
    "frontend",
    "full stack",
    "machine learning",
    "data engineering",
    "platform",
    "cloud",
    "developer tools"
  ];

  return domains.filter((domain) => lower.includes(domain));
}

export function inferRoleSeedsFromProfileText(text: string): string[] {
  const lower = text.toLowerCase();
  const roles = new Set<string>();

  if (lower.includes("backend")) roles.add("Backend Engineer");
  if (lower.includes("frontend")) roles.add("Frontend Engineer");
  if (lower.includes("full stack")) roles.add("Full Stack Engineer");
  if (lower.includes("machine learning")) roles.add("Machine Learning Engineer");
  if (lower.includes("data")) roles.add("Data Engineer");
  if (roles.size === 0) roles.add("Software Engineer");

  return Array.from(roles);
}

export function detectMissingSkills(profile: StructuredResumeProfile, jobDescription: string): string[] {
  const jobSkills = detectSkills(jobDescription);
  const profileSkillSet = new Set(profile.technologies.map((item) => item.toLowerCase()));
  return jobSkills.filter((skill) => !profileSkillSet.has(skill.toLowerCase()));
}
