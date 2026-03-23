import { buildResumeTailoringPrompt, tailoringSchema } from "../ai/prompts/resume-tailoring.js";
import type { LLMProvider } from "../ai/providers/llm-provider.js";
import type {
  JobFitAnalysis,
  JobPosting,
  ResumeTailoringPlan,
  StructuredResumeProfile
} from "../domain/models.js";
import { buildFallbackTailoringPlan } from "./heuristics.js";

export class ResumeTailoringService {
  constructor(private readonly llmProvider: LLMProvider) {}

  async tailor(options: {
    profile: StructuredResumeProfile;
    job: JobPosting;
    originalLatexResume: string;
    fitAnalysis?: JobFitAnalysis;
  }): Promise<ResumeTailoringPlan> {
    const prompt = buildResumeTailoringPrompt(options);

    return this.llmProvider.generateObject<ResumeTailoringPlan>({
      taskName: "resume_tailoring",
      systemInstruction: prompt.systemInstruction,
      prompt: prompt.prompt,
      schema: tailoringSchema,
      fallback: () =>
        buildFallbackTailoringPlan(options.profile, options.job, options.originalLatexResume)
    });
  }
}
