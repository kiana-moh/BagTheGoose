import type { ParsedResumeDocument } from "../../domain/models.js";

export const resumeAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    candidateSummary: { type: "string" },
    degreeLevel: {
      type: "string",
      enum: ["high_school", "bachelors", "masters", "phd", "bootcamp", "unknown"]
    },
    majors: { type: "array", items: { type: "string" } },
    graduationYear: { type: ["integer", "null"] },
    skills: { type: "array", items: { type: "string" } },
    technologies: { type: "array", items: { type: "string" } },
    domainsOfStrength: { type: "array", items: { type: "string" } },
    rolePatterns: { type: "array", items: { type: "string" } },
    evidenceHighlights: { type: "array", items: { type: "string" } },
    confidence: { type: "number" }
  },
  required: [
    "candidateSummary",
    "degreeLevel",
    "majors",
    "graduationYear",
    "skills",
    "technologies",
    "domainsOfStrength",
    "rolePatterns",
    "evidenceHighlights",
    "confidence"
  ]
};

export function buildResumeAnalysisPrompt(parsed: ParsedResumeDocument): {
  systemInstruction: string;
  prompt: string;
} {
  return {
    systemInstruction:
      "You are a resume analysis engine. Extract structured information conservatively. Use only evidence present in the resume. Do not hallucinate education, skills, employment, leadership, or impact. If uncertain, lower confidence rather than guessing. For degreeLevel, you must return exactly one of: high_school, bachelors, masters, phd, bootcamp, unknown.",
    prompt: [
      "Analyze the following LaTeX resume after deterministic preprocessing.",
      "Return structured profile information.",
      "Distinguish explicit evidence from inference.",
      "",
      "PARSED SECTIONS:",
      JSON.stringify(parsed.sections, null, 2),
      "",
      "PLAIN TEXT:",
      parsed.plainText
    ].join("\n")
  };
}
