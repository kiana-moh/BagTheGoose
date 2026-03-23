import type { ScrapingProfile, StructuredResumeProfile, TargetRole } from "../domain/models.js";
import { buildScrapingProfile } from "./heuristics.js";

export class ScrapingProfileService {
  build(profile: StructuredResumeProfile, targetRoles: TargetRole[]): ScrapingProfile {
    return buildScrapingProfile(profile, targetRoles);
  }
}
