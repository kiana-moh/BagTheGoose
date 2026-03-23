import { z } from "zod";

export const resumeSchema = z.object({
  latexContent: z
    .string()
    .min(80, "Paste enough LaTeX content for analysis.")
    .refine(
      (value) => value.includes("\\section") || value.includes("\\begin"),
      "This does not look like LaTeX source."
    )
});

export type ResumeFormValues = z.infer<typeof resumeSchema>;
