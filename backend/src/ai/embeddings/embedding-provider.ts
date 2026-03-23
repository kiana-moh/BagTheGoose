export interface EmbedTextParams {
  texts: string[];
  taskType?: "SEMANTIC_SIMILARITY" | "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";
}

export interface EmbeddingProvider {
  readonly name: string;
  embed(params: EmbedTextParams): Promise<number[][]>;
}
