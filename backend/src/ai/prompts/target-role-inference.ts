import type { StructuredResumeProfile } from "../../domain/models.js";

export const targetRoleSchema = {
  type: "object",
  properties: {
    targetRoles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: { type: "string" },
          category: { type: "string" },
          rationale: { type: "string" },
          confidence: { type: "number" },
          evidence: { type: "array", items: { type: "string" } }
        },
        required: ["role", "category", "rationale", "confidence", "evidence"]
      }
    }
  },
  required: ["targetRoles"]
};

export function buildTargetRolePrompt(profile: StructuredResumeProfile, roleSeeds: string[]): {
  systemInstruction: string;
  prompt: string;
} {
  return {
    systemInstruction:
      "You infer job targets for a candidate. Ground every role recommendation in evidence from the structured resume profile. Separate direct roles from adjacent roles and avoid overstating fit.",
    prompt: [
      "Use the structured resume profile and deterministic role seeds to infer likely target roles.",
      "Include direct and adjacent opportunities the candidate is plausibly qualified for.",
      "Do not suggest roles unsupported by the profile.",
      "",
      "ROLE SEEDS:",
      JSON.stringify(roleSeeds, null, 2),
      "",
      "PROFILE:",
      JSON.stringify(profile, null, 2)
    ].join("\n")
  };
}
