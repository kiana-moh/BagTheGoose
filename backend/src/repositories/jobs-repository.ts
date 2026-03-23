import type { Database } from "../db/pool.js";
import type { ApplicationTrackerItemRecord, JobRecord } from "../domain/models.js";

function mapJob(row: {
  id: string;
  user_id: string;
  external_source: string;
  external_job_id: string | null;
  company: string;
  title: string;
  location: string | null;
  description: string | null;
  url: string | null;
  imported_at: string;
  created_at: string;
  updated_at: string;
}): JobRecord {
  return {
    id: row.id,
    userId: row.user_id,
    externalSource: row.external_source,
    externalJobId: row.external_job_id,
    company: row.company,
    title: row.title,
    location: row.location,
    description: row.description,
    url: row.url,
    importedAt: row.imported_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapTracker(row: {
  id: string;
  user_id: string;
  job_id: string;
  status: "saved" | "applied" | "interview" | "offer" | "rejected";
  match_score: string | number | null;
  deadline: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}): ApplicationTrackerItemRecord {
  return {
    id: row.id,
    userId: row.user_id,
    jobId: row.job_id,
    status: row.status,
    matchScore: row.match_score === null ? null : Number(row.match_score),
    deadline: row.deadline,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class JobsRepository {
  constructor(private readonly db: Database) {}

  async importJobForUser(input: {
    userId: string;
    externalSource: string;
    externalJobId?: string | null;
    company: string;
    title: string;
    location?: string | null;
    description?: string | null;
    url?: string | null;
    matchScore?: number | null;
  }): Promise<{ job: JobRecord; trackerItem: ApplicationTrackerItemRecord }> {
    return this.db.transaction(async (client) => {
      let jobRow;

      if (input.externalJobId) {
        const result = await client.query<{
          id: string;
          user_id: string;
          external_source: string;
          external_job_id: string | null;
          company: string;
          title: string;
          location: string | null;
          description: string | null;
          url: string | null;
          imported_at: string;
          created_at: string;
          updated_at: string;
        }>(
          `
            insert into jobs (
              user_id, external_source, external_job_id, company, title, location, description, url
            )
            values ($1, $2, $3, $4, $5, $6, $7, $8)
            on conflict (user_id, external_source, external_job_id)
            do update set
              company = excluded.company,
              title = excluded.title,
              location = excluded.location,
              description = excluded.description,
              url = excluded.url,
              imported_at = now(),
              updated_at = now()
            returning *
          `,
          [
            input.userId,
            input.externalSource,
            input.externalJobId,
            input.company,
            input.title,
            input.location ?? null,
            input.description ?? null,
            input.url ?? null
          ]
        );
        jobRow = result.rows[0];
      } else {
        const result = await client.query<{
          id: string;
          user_id: string;
          external_source: string;
          external_job_id: string | null;
          company: string;
          title: string;
          location: string | null;
          description: string | null;
          url: string | null;
          imported_at: string;
          created_at: string;
          updated_at: string;
        }>(
          `
            insert into jobs (
              user_id, external_source, external_job_id, company, title, location, description, url
            )
            values ($1, $2, null, $3, $4, $5, $6, $7)
            returning *
          `,
          [
            input.userId,
            input.externalSource,
            input.company,
            input.title,
            input.location ?? null,
            input.description ?? null,
            input.url ?? null
          ]
        );
        jobRow = result.rows[0];
      }

      const trackerResult = await client.query<{
        id: string;
        user_id: string;
        job_id: string;
        status: "saved" | "applied" | "interview" | "offer" | "rejected";
        match_score: string | number | null;
        deadline: string | null;
        notes: string | null;
        created_at: string;
        updated_at: string;
      }>(
        `
          insert into application_tracker_items (user_id, job_id, status, match_score)
          values ($1, $2, 'saved', $3)
          on conflict (user_id, job_id)
          do update set
            match_score = excluded.match_score,
            updated_at = now()
          returning *
        `,
        [input.userId, jobRow.id, input.matchScore ?? null]
      );

      return {
        job: mapJob(jobRow),
        trackerItem: mapTracker(trackerResult.rows[0])
      };
    });
  }

  async listTrackerItemsForUser(userId: string): Promise<
    Array<
      ApplicationTrackerItemRecord & {
        company: string;
        title: string;
        location: string | null;
        url: string | null;
      }
    >
  > {
    const result = await this.db.query<{
      id: string;
      user_id: string;
      job_id: string;
      status: "saved" | "applied" | "interview" | "offer" | "rejected";
      match_score: string | number | null;
      deadline: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
      company: string;
      title: string;
      location: string | null;
      url: string | null;
    }>(
      `
        select
          t.*,
          j.company,
          j.title,
          j.location,
          j.url
        from application_tracker_items t
        inner join jobs j on j.id = t.job_id
        where t.user_id = $1
        order by t.updated_at desc
      `,
      [userId]
    );

    return result.rows.map((row) => ({
      ...mapTracker(row),
      company: row.company,
      title: row.title,
      location: row.location,
      url: row.url
    }));
  }

  async updateTrackerItem(input: {
    userId: string;
    trackerItemId: string;
    status?: "saved" | "applied" | "interview" | "offer" | "rejected";
    matchScore?: number | null;
    deadline?: string | null;
    notes?: string | null;
  }): Promise<(ApplicationTrackerItemRecord & {
    company: string;
    title: string;
    location: string | null;
    url: string | null;
  }) | null> {
    const result = await this.db.query<{
      id: string;
      user_id: string;
      job_id: string;
      status: "saved" | "applied" | "interview" | "offer" | "rejected";
      match_score: string | number | null;
      deadline: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
      company: string;
      title: string;
      location: string | null;
      url: string | null;
    }>(
      `
        update application_tracker_items as t
        set
          status = coalesce($3, t.status),
          match_score = coalesce($4, t.match_score),
          deadline = coalesce($5, t.deadline),
          notes = coalesce($6, t.notes),
          updated_at = now()
        from jobs j
        where t.id = $1
          and t.user_id = $2
          and j.id = t.job_id
        returning
          t.*,
          j.company,
          j.title,
          j.location,
          j.url
      `,
      [
        input.trackerItemId,
        input.userId,
        input.status ?? null,
        input.matchScore ?? null,
        input.deadline ?? null,
        input.notes ?? null
      ]
    );

    if (!result.rowCount) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...mapTracker(row),
      company: row.company,
      title: row.title,
      location: row.location,
      url: row.url
    };
  }
}
