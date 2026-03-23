export interface GenerateStructuredParams<T> {
  taskName: string;
  systemInstruction: string;
  prompt: string;
  schema: Record<string, unknown>;
  temperature?: number;
  fallback: () => Promise<T> | T;
}

export interface GenerateTextParams {
  systemInstruction: string;
  prompt: string;
  temperature?: number;
  fallback: () => Promise<string> | string;
}

export interface LLMProvider {
  readonly name: string;
  generateObject<T>(params: GenerateStructuredParams<T>): Promise<T>;
  generateText(params: GenerateTextParams): Promise<string>;
}
