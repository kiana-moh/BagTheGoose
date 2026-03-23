import OpenAI from "openai";
import type {
  GenerateStructuredParams,
  GenerateTextParams,
  LLMProvider
} from "./llm-provider.js";

interface OpenAILLMProviderOptions {
  apiKey?: string;
  model: string;
}

export class OpenAILLMProvider implements LLMProvider {
  readonly name = "openai";
  private readonly client?: OpenAI;
  private readonly model: string;

  constructor(options: OpenAILLMProviderOptions) {
    this.model = options.model;
    this.client = options.apiKey ? new OpenAI({ apiKey: options.apiKey }) : undefined;
  }

  async generateObject<T>(params: GenerateStructuredParams<T>): Promise<T> {
    if (!this.client) {
      return params.fallback();
    }

    try {
      const response = await this.client.responses.create({
        model: this.model,
        temperature: params.temperature ?? 0,
        input: [
          {
            role: "system",
            content: params.systemInstruction
          },
          {
            role: "user",
            content: params.prompt
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: params.taskName,
            strict: true,
            schema: params.schema
          }
        }
      });

      return JSON.parse(response.output_text || "{}") as T;
    } catch {
      return params.fallback();
    }
  }

  async generateText(params: GenerateTextParams): Promise<string> {
    if (!this.client) {
      return params.fallback();
    }

    try {
      const response = await this.client.responses.create({
        model: this.model,
        temperature: params.temperature ?? 0,
        input: [
          {
            role: "system",
            content: params.systemInstruction
          },
          {
            role: "user",
            content: params.prompt
          }
        ]
      });

      return response.output_text || (await params.fallback());
    } catch {
      return params.fallback();
    }
  }
}
