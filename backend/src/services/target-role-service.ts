import type { EmbeddingProvider } from "../ai/embeddings/embedding-provider.js";
import { buildTargetRolePrompt, targetRoleSchema } from "../ai/prompts/target-role-inference.js";
import type { LLMProvider } from "../ai/providers/llm-provider.js";
import type { VectorStore } from "../ai/vector/vector-store.js";
import type { StructuredResumeProfile, TargetRole } from "../domain/models.js";
import { buildFallbackTargetRoles, inferRoleSeeds } from "./heuristics.js";

export class TargetRoleService {
  constructor(
    private readonly llmProvider: LLMProvider,
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly vectorStore: VectorStore
  ) {}

  async infer(profile: StructuredResumeProfile): Promise<TargetRole[]> {
    const seeds = inferRoleSeeds(profile);
    const prompt = buildTargetRolePrompt(profile, seeds);

    const response = await this.llmProvider.generateObject<{ targetRoles: TargetRole[] }>({
      taskName: "target_role_inference",
      systemInstruction: prompt.systemInstruction,
      prompt: prompt.prompt,
      schema: targetRoleSchema,
      fallback: () => ({
        targetRoles: buildFallbackTargetRoles(profile)
      })
    });

    const targetRoles = response.targetRoles;

    const embeddings = await this.embeddingProvider.embed({
      texts: targetRoles.map((role) => `${role.role}\n${role.rationale}`),
      taskType: "RETRIEVAL_DOCUMENT"
    });

    await this.vectorStore.upsert(
      targetRoles.map((role, index) => ({
        id: `role-${Date.now()}-${index}`,
        namespace: "target-roles",
        vector: embeddings[index],
        metadata: {
          role: role.role,
          category: role.category,
          rationale: role.rationale,
          confidence: role.confidence,
          evidence: role.evidence
        }
      }))
    );

    return targetRoles;
  }
}
