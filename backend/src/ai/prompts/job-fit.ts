import type { HardDisqualifier, JobPosting, StructuredResumeProfile } from "../../domain/models.js";

export const jobFitSchema = {
  type: "object",
  properties: {
    overallScore: { type: "number" },
    recommendation: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    missingSkills: { type: "array", items: { type: "string" } },
    evidence: { type: "array", items: { type: "string" } },
    resumeTailoringHooks: { type: "array", items: { type: "string" } }
  },
  required: [
    "overallScore",
    "recommendation",
    "strengths",
    "weaknesses",
    "missingSkills",
    "evidence",
    "resumeTailoringHooks"
  ]
};

export function buildJobFitPrompt(
  profile: StructuredResumeProfile,
  job: JobPosting,
  hardDisqualifiers: HardDisqualifier[],
  semanticSimilarity: number
): {
  systemInstruction: string;
  prompt: string;
} {
  return {
    systemInstruction:
      "You are a conservative job-fit evaluator. Do not overstate candidate fit. Hard disqualifiers must remain explicit and separate from soft weaknesses. Use only evidence from the resume profile and the job description.",
    prompt: [
      "Evaluate this candidate against this job posting.",
      "You must keep hard disqualifiers separate from soft weaknesses.",
      "If required skills or requirements are missing, reflect that clearly.",
      "",
      "SEMANTIC SIMILARITY:",
      String(semanticSimilarity),
      "",
      "HARD DISQUALIFIERS:",
      JSON.stringify(hardDisqualifiers, null, 2),
      "",
      "PROFILE:",
      JSON.stringify(profile, null, 2),
      "",
      "JOB:",
      JSON.stringify(job, null, 2)
    ].join("\n")
  };
}
