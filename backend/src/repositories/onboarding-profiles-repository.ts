import type { Database } from "../db/pool.js";
import type { OnboardingProfileRecord } from "../domain/models.js";

function mapOnboardingProfile(row: {
  id: string;
  user_id: string;
  academic_info_json: Record<string, unknown>;
  preferences_json: Record<string, unknown>;
  skills_review_json: Record<string, unknown>;
  completed_at: string | null;
  updated_at: string;
}): OnboardingProfileRecord {
  return {
    id: row.id,
    userId: row.user_id,
    academicInfoJson: row.academic_info_json,
    preferencesJson: row.preferences_json,
    skillsReviewJson: row.skills_review_json,
    completedAt: row.completed_at,
    updatedAt: row.updated_at
  };
}

export class OnboardingProfilesRepository {
  constructor(private readonly db: Database) {}

  async upsert(input: {
    userId: string;
    academicInfoJson: Record<string, unknown>;
    preferencesJson: Record<string, unknown>;
    skillsReviewJson: Record<string, unknown>;
    completedAt?: string | null;
  }): Promise<OnboardingProfileRecord> {
    const result = await this.db.query<{
      id: string;
      user_id: string;
      academic_info_json: Record<string, unknown>;
      preferences_json: Record<string, unknown>;
      skills_review_json: Record<string, unknown>;
      completed_at: string | null;
      updated_at: string;
    }>(
      `
        insert into onboarding_profiles (
          user_id,
          academic_info_json,
          preferences_json,
          skills_review_json,
          completed_at
        )
        values ($1, $2, $3, $4, $5)
        on conflict (user_id)
        do update set
          academic_info_json = excluded.academic_info_json,
          preferences_json = excluded.preferences_json,
          skills_review_json = excluded.skills_review_json,
          completed_at = excluded.completed_at,
          updated_at = now()
        returning *
      `,
      [
        input.userId,
        input.academicInfoJson,
        input.preferencesJson,
        input.skillsReviewJson,
        input.completedAt ?? null
      ]
    );

    return mapOnboardingProfile(result.rows[0]);
  }

  async findByUserId(userId: string): Promise<OnboardingProfileRecord | null> {
    const result = await this.db.query<{
      id: string;
      user_id: string;
      academic_info_json: Record<string, unknown>;
      preferences_json: Record<string, unknown>;
      skills_review_json: Record<string, unknown>;
      completed_at: string | null;
      updated_at: string;
    }>("select * from onboarding_profiles where user_id = $1", [userId]);

    if (!result.rowCount) {
      return null;
    }

    return mapOnboardingProfile(result.rows[0]);
  }
}
