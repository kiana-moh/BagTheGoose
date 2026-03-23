import type { EmbeddingProvider } from "../ai/embeddings/embedding-provider.js";
import { buildJobFitPrompt, jobFitSchema } from "../ai/prompts/job-fit.js";
import type { LLMProvider } from "../ai/providers/llm-provider.js";
import type {
  JobFitAnalysis,
  JobPosting,
  StructuredResumeProfile
} from "../domain/models.js";
import { buildFallbackJobFit, detectHardDisqualifiers } from "./heuristics.js";

export class JobFitService {
  constructor(
    private readonly llmProvider: LLMProvider,
    private readonly embeddingProvider: EmbeddingProvider
  ) {}

  async analyze(profile: StructuredResumeProfile, job: JobPosting): Promise<JobFitAnalysis> {
    const hardDisqualifiers = detectHardDisqualifiers(profile, job);
    const [profileEmbedding, jobEmbedding] = await this.embeddingProvider.embed({
      texts: [this.profileSummary(profile), this.jobSummary(job)],
      taskType: "SEMANTIC_SIMILARITY"
    });
    const semanticSimilarity = cosineSimilarity(profileEmbedding, jobEmbedding);
    const prompt = buildJobFitPrompt(profile, job, hardDisqualifiers, semanticSimilarity);

    const response = await this.llmProvider.generateObject<
      Pick<
        JobFitAnalysis,
        | "overallScore"
        | "recommendation"
        | "strengths"
        | "weaknesses"
        | "missingSkills"
        | "evidence"
        | "resumeTailoringHooks"
      >
    >({
      taskName: "job_fit_scoring",
      systemInstruction: prompt.systemInstruction,
      prompt: prompt.prompt,
      schema: jobFitSchema,
      fallback: () => {
        const fallback = buildFallbackJobFit(profile, job, hardDisqualifiers, semanticSimilarity);
        return {
          overallScore: fallback.overallScore,
          recommendation: fallback.recommendation,
          strengths: fallback.strengths,
          weaknesses: fallback.weaknesses,
          missingSkills: fallback.missingSkills,
          evidence: fallback.evidence,
          resumeTailoringHooks: fallback.resumeTailoringHooks
        };
      }
    });

    return {
      semanticSimilarity,
      hardDisqualifiers,
      ...response
    };
  }

  private profileSummary(profile: StructuredResumeProfile): string {
    return [
      profile.candidateSummary,
      profile.technologies.join(", "),
      profile.domainsOfStrength.join(", "),
      profile.rolePatterns.join(", ")
    ].join("\n");
  }

  private jobSummary(job: JobPosting): string {
    return [job.title, job.company, job.location ?? "", job.description].join("\n");
  }
}

function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}
