import type { ParsedResumeDocument } from "../domain/models.js";
import { detectSkills, extractSections, normalizePlainText } from "./heuristics.js";

export class LatexResumeParserService {
  parse(latexResume: string): ParsedResumeDocument {
    const plainText = normalizePlainText(latexResume);
    const sections = extractSections(latexResume);

    const educationSection = sections.find((section) =>
      section.heading.toLowerCase().includes("education")
    );
    const experienceSection = sections.find((section) =>
      section.heading.toLowerCase().includes("experience")
    );
    const projectSection = sections.find((section) =>
      section.heading.toLowerCase().includes("project")
    );

    return {
      rawLatex: latexResume,
      plainText,
      sections,
      detectedSkills: detectSkills(plainText),
      educationLines: educationSection?.bullets ?? [],
      experienceLines: experienceSection?.bullets ?? [],
      projectLines: projectSection?.bullets ?? []
    };
  }
}
