import { z } from "zod";

export const onboardingBasicsSchema = z.object({
  school: z.string().min(2, "Add your school."),
  program: z.string().min(2, "Add your program."),
  graduationYear: z.string().min(4, "Add your graduation year."),
  workAuthorization: z.string().min(2, "Select your work authorization.")
});

export const onboardingPreferencesSchema = z.object({
  targetRoles: z.array(z.string()).min(1, "Add at least one target role."),
  preferredLocations: z.array(z.string()).min(1, "Add at least one preferred location."),
  workModes: z.array(z.enum(["remote", "hybrid", "onsite"])).min(1, "Pick at least one work mode."),
  applicationGoal: z.string().min(10, "Describe what you are targeting.")
});

export const onboardingTrackerSchema = z.object({
  defaultStatuses: z.array(z.string()).min(1, "Add at least one tracker status."),
  deadlineReminder: z.boolean()
});
