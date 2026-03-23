import type { JobFitAnalysis, JobPosting, StructuredResumeProfile } from "../../domain/models.js";

export const tailoringSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    edits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          section: { type: "string" },
          target: { type: "string" },
          suggestedRewrite: { type: "string" },
          rationale: { type: "string" }
        },
        required: ["section", "target", "suggestedRewrite", "rationale"]
      }
    },
    skillsToElevate: { type: "array", items: { type: "string" } },
    bulletsToPrioritize: { type: "array", items: { type: "string" } },
    prohibitedClaims: { type: "array", items: { type: "string" } }
  },
  required: ["summary", "edits", "skillsToElevate", "bulletsToPrioritize", "prohibitedClaims"]
};

export function buildResumeTailoringPrompt(options: {
  profile: StructuredResumeProfile;
  job: JobPosting;
  originalLatexResume: string;
  fitAnalysis?: JobFitAnalysis;
}): {
  systemInstruction: string;
  prompt: string;
} {
  return {
    systemInstruction:
      "You are a truthful resume tailoring engine. You may only rephrase, reorder, emphasize, or de-emphasize content already supported by the resume. Never invent experience, metrics, ownership, skills, or qualifications.",
    prompt: [
      "Generate tailoring suggestions for this job.",
      "Do not fabricate experience.",
      "Return bullet-level rewrite suggestions, priority changes, and prohibited claims.",
      "",
      "PROFILE:",
      JSON.stringify(options.profile, null, 2),
      "",
      "JOB:",
      JSON.stringify(options.job, null, 2),
      "",
      "FIT ANALYSIS:",
      JSON.stringify(options.fitAnalysis ?? null, null, 2),
      "",
      "ORIGINAL LATEX RESUME:",
      options.originalLatexResume
    ].join("\n")
  };
}
