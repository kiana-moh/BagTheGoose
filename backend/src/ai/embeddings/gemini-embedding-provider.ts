import type { EmbedTextParams, EmbeddingProvider } from "./embedding-provider.js";

interface GeminiEmbeddingProviderOptions {
  apiKey?: string;
  model: string;
  outputDimensionality?: number;
}

interface GeminiEmbedResponse {
  embedding?: {
    values?: number[];
  };
}

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly name = "gemini";
  private readonly apiKey?: string;
  private readonly model: string;
  private readonly outputDimensionality?: number;

  constructor(options: GeminiEmbeddingProviderOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.outputDimensionality = options.outputDimensionality;
  }

  async embed(params: EmbedTextParams): Promise<number[][]> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is required for Gemini embeddings.");
    }

    const vectors: number[][] = [];

    for (const text of params.texts) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": this.apiKey
          },
          body: JSON.stringify({
            content: {
              parts: [
                {
                  text
                }
              ]
            },
            taskType: params.taskType,
            outputDimensionality: this.outputDimensionality
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini embeddings failed: ${response.status} ${errorText}`);
      }

      const json = (await response.json()) as GeminiEmbedResponse;
      vectors.push(json.embedding?.values || []);
    }

    return vectors;
  }
}
