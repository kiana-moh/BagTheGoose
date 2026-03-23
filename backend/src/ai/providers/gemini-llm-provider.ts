import type {
  GenerateStructuredParams,
  GenerateTextParams,
  LLMProvider
} from "./llm-provider.js";

interface GeminiLLMProviderOptions {
  apiKey?: string;
  model: string;
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export class GeminiLLMProvider implements LLMProvider {
  readonly name = "gemini";
  private readonly apiKey?: string;
  private readonly model: string;

  constructor(options: GeminiLLMProviderOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
  }

  async generateObject<T>(params: GenerateStructuredParams<T>): Promise<T> {
    if (!this.apiKey) {
      return params.fallback();
    }

    const responseText = await this.generateRawJson({
      systemInstruction: params.systemInstruction,
      prompt: params.prompt,
      schema: params.schema,
      temperature: params.temperature
    });

    try {
      return JSON.parse(responseText) as T;
    } catch {
      return params.fallback();
    }
  }

  async generateText(params: GenerateTextParams): Promise<string> {
    if (!this.apiKey) {
      return params.fallback();
    }

    try {
      const response = await this.callGemini({
        prompt: this.composePrompt(params.systemInstruction, params.prompt),
        temperature: params.temperature,
        responseMimeType: "text/plain"
      });

      return this.extractText(response) || (await params.fallback());
    } catch {
      return params.fallback();
    }
  }

  private async generateRawJson(options: {
    systemInstruction: string;
    prompt: string;
    schema: Record<string, unknown>;
    temperature?: number;
  }): Promise<string> {
    const response = await this.callGemini({
      prompt: this.composePrompt(options.systemInstruction, options.prompt),
      temperature: options.temperature,
      responseMimeType: "application/json",
      responseJsonSchema: options.schema
    });

    return this.extractText(response) || "{}";
  }

  private composePrompt(systemInstruction: string, prompt: string): string {
    return [
      "SYSTEM INSTRUCTION:",
      systemInstruction,
      "",
      "USER INPUT:",
      prompt
    ].join("\n");
  }

  private async callGemini(options: {
    prompt: string;
    temperature?: number;
    responseMimeType: string;
    responseJsonSchema?: Record<string, unknown>;
  }): Promise<GeminiGenerateContentResponse> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey ?? ""
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: options.prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: options.temperature ?? 0.2,
            responseMimeType: options.responseMimeType,
            responseJsonSchema: options.responseJsonSchema
          }
        })
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${text}`);
    }

    return (await response.json()) as GeminiGenerateContentResponse;
  }

  private extractText(response: GeminiGenerateContentResponse): string {
    return response.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  }
}
