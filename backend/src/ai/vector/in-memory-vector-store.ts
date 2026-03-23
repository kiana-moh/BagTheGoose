import type { SimilarityMatch, VectorRecord } from "../../domain/models.js";
import type { VectorStore } from "./vector-store.js";

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

export class InMemoryVectorStore implements VectorStore {
  readonly name = "memory";
  private readonly records = new Map<string, VectorRecord>();

  async upsert(records: VectorRecord[]): Promise<void> {
    for (const record of records) {
      this.records.set(`${record.namespace}:${record.id}`, record);
    }
  }

  async query(namespace: string, vector: number[], limit: number): Promise<SimilarityMatch[]> {
    const matches: SimilarityMatch[] = [];

    for (const record of this.records.values()) {
      if (record.namespace !== namespace) {
        continue;
      }

      matches.push({
        id: record.id,
        score: cosineSimilarity(vector, record.vector),
        metadata: record.metadata
      });
    }

    return matches.sort((left, right) => right.score - left.score).slice(0, limit);
  }
}
