import type { SimilarityMatch, VectorRecord } from "../../domain/models.js";

export interface VectorStore {
  readonly name: string;
  upsert(records: VectorRecord[]): Promise<void>;
  query(namespace: string, vector: number[], limit: number): Promise<SimilarityMatch[]>;
}
