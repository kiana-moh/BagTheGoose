import type {
  GenerateStructuredParams,
  GenerateTextParams,
  LLMProvider
} from "./llm-provider.js";

export class MockLLMProvider implements LLMProvider {
  readonly name = "mock";

  async generateObject<T>(params: GenerateStructuredParams<T>): Promise<T> {
    return params.fallback();
  }

  async generateText(params: GenerateTextParams): Promise<string> {
    return params.fallback();
  }
}
