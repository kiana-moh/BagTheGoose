import { buildResumeAnalysisPrompt, resumeAnalysisSchema } from "../ai/prompts/resume-analysis.js";
import type { EmbeddingProvider } from "../ai/embeddings/embedding-provider.js";
import type { LLMProvider } from "../ai/providers/llm-provider.js";
import type { VectorStore } from "../ai/vector/vector-store.js";
import type { StructuredResumeProfile } from "../domain/models.js";
import { buildDeterministicProfile } from "./heuristics.js";
import { LatexResumeParserService } from "./latex-resume-parser-service.js";

export class ResumeAnalysisService {
  constructor(
    private readonly parser: LatexResumeParserService,
    private readonly llmProvider: LLMProvider,
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly vectorStore: VectorStore
  ) {}

  async analyze(latexResume: string): Promise<StructuredResumeProfile> {
    const parsed = this.parser.parse(latexResume);
    const deterministic = buildDeterministicProfile(parsed);
    const prompt = buildResumeAnalysisPrompt(parsed);

    const llmResult = await this.llmProvider.generateObject<
      Pick<
        StructuredResumeProfile,
        | "candidateSummary"
        | "degreeLevel"
        | "majors"
        | "graduationYear"
        | "skills"
        | "technologies"
        | "domainsOfStrength"
        | "rolePatterns"
        | "evidenceHighlights"
        | "confidence"
      > & {
        graduationYear?: number | null;
      }
    >({
      taskName: "resume_analysis",
      systemInstruction: prompt.systemInstruction,
      prompt: prompt.prompt,
      schema: resumeAnalysisSchema,
      fallback: () => ({
        candidateSummary: deterministic.candidateSummary,
        degreeLevel: deterministic.degreeLevel,
        majors: deterministic.majors,
        graduationYear: deterministic.graduationYear,
        skills: deterministic.skills,
        technologies: deterministic.technologies,
        domainsOfStrength: deterministic.domainsOfStrength,
        rolePatterns: deterministic.rolePatterns,
        evidenceHighlights: deterministic.evidenceHighlights,
        confidence: deterministic.confidence
      })
    });

    const profile: StructuredResumeProfile = {
      ...deterministic,
      ...llmResult,
      graduationYear:
        typeof llmResult.graduationYear === "number"
          ? llmResult.graduationYear
          : deterministic.graduationYear
    };

    const [embedding] = await this.embeddingProvider.embed({
      texts: [this.profileSummary(profile)],
      taskType: "RETRIEVAL_DOCUMENT"
    });

    await this.vectorStore.upsert([
      {
        id: `resume-${Date.now()}`,
        namespace: "resume-profiles",
        vector: embedding,
        metadata: {
          candidateSummary: profile.candidateSummary,
          degreeLevel: profile.degreeLevel,
          majors: profile.majors
        }
      }
    ]);

    return profile;
  }

  private profileSummary(profile: StructuredResumeProfile): string {
    return [
      profile.candidateSummary,
      `Degree: ${profile.degreeLevel}`,
      `Majors: ${profile.majors.join(", ")}`,
      `Technologies: ${profile.technologies.join(", ")}`,
      `Domains: ${profile.domainsOfStrength.join(", ")}`,
      `Role patterns: ${profile.rolePatterns.join(", ")}`
    ].join("\n");
  }
}
