import type { EmbedTextParams, EmbeddingProvider } from "./embedding-provider.js";

function hashTextToVector(text: string, dimensions = 32): number[] {
  const vector = Array.from({ length: dimensions }, () => 0);

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    vector[index % dimensions] += code / 255;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}

export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly name = "mock";

  async embed(params: EmbedTextParams): Promise<number[][]> {
    return params.texts.map((text) => hashTextToVector(text));
  }
}
