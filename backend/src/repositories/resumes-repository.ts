import type { Database } from "../db/pool.js";
import type { ResumeParseStatus, ResumeRecord } from "../domain/models.js";
import { mapNullableJson } from "../db/sql.js";

function mapResume(row: {
  id: string;
  user_id: string;
  latex_content: string;
  source_type: "pasted" | "uploaded";
  file_name: string | null;
  parse_status: ResumeParseStatus;
  extracted_json: unknown;
  created_at: string;
  updated_at: string;
}): ResumeRecord {
  return {
    id: row.id,
    userId: row.user_id,
    latexContent: row.latex_content,
    sourceType: row.source_type,
    fileName: row.file_name,
    parseStatus: row.parse_status,
    extractedJson: mapNullableJson<Record<string, unknown>>(row.extracted_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class ResumesRepository {
  constructor(private readonly db: Database) {}

  async upsert(input: {
    userId: string;
    latexContent: string;
    sourceType: "pasted" | "uploaded";
    fileName?: string | null;
    parseStatus: ResumeParseStatus;
    extractedJson?: Record<string, unknown> | null;
  }): Promise<ResumeRecord> {
    const result = await this.db.query<{
      id: string;
      user_id: string;
      latex_content: string;
      source_type: "pasted" | "uploaded";
      file_name: string | null;
      parse_status: ResumeParseStatus;
      extracted_json: unknown;
      created_at: string;
      updated_at: string;
    }>(
      `
        insert into resumes (user_id, latex_content, source_type, file_name, parse_status, extracted_json)
        values ($1, $2, $3, $4, $5, $6)
        on conflict (user_id)
        do update set
          latex_content = excluded.latex_content,
          source_type = excluded.source_type,
          file_name = excluded.file_name,
          parse_status = excluded.parse_status,
          extracted_json = excluded.extracted_json,
          updated_at = now()
        returning *
      `,
      [
        input.userId,
        input.latexContent,
        input.sourceType,
        input.fileName ?? null,
        input.parseStatus,
        input.extractedJson ?? null
      ]
    );

    return mapResume(result.rows[0]);
  }

  async findByUserId(userId: string): Promise<ResumeRecord | null> {
    const result = await this.db.query<{
      id: string;
      user_id: string;
      latex_content: string;
      source_type: "pasted" | "uploaded";
      file_name: string | null;
      parse_status: ResumeParseStatus;
      extracted_json: unknown;
      created_at: string;
      updated_at: string;
    }>("select * from resumes where user_id = $1", [userId]);

    if (!result.rowCount) {
      return null;
    }

    return mapResume(result.rows[0]);
  }
}
