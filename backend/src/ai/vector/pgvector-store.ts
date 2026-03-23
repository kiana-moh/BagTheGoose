import { Pool } from "pg";
import type { SimilarityMatch, VectorRecord } from "../../domain/models.js";
import type { VectorStore } from "./vector-store.js";

interface PgVectorStoreOptions {
  connectionString: string;
  tableName?: string;
}

export class PgVectorStore implements VectorStore {
  readonly name = "pgvector";
  private readonly pool: Pool;
  private readonly tableName: string;

  constructor(options: PgVectorStoreOptions) {
    this.pool = new Pool({ connectionString: options.connectionString });
    this.tableName = options.tableName ?? "vector_documents";
  }

  async upsert(records: VectorRecord[]): Promise<void> {
    if (records.length === 0) {
      return;
    }

    for (const record of records) {
      await this.pool.query(
        `
          insert into ${this.tableName} (id, namespace, embedding, metadata)
          values ($1, $2, $3::vector, $4::jsonb)
          on conflict (id, namespace)
          do update set embedding = excluded.embedding, metadata = excluded.metadata
        `,
        [record.id, record.namespace, `[${record.vector.join(",")}]`, JSON.stringify(record.metadata)]
      );
    }
  }

  async query(namespace: string, vector: number[], limit: number): Promise<SimilarityMatch[]> {
    const result = await this.pool.query(
      `
        select id, metadata, 1 - (embedding <=> $1::vector) as score
        from ${this.tableName}
        where namespace = $2
        order by embedding <=> $1::vector
        limit $3
      `,
      [`[${vector.join(",")}]`, namespace, limit]
    );

    return result.rows.map((row) => ({
      id: String(row.id),
      score: Number(row.score),
      metadata: row.metadata as Record<string, unknown>
    }));
  }
}
