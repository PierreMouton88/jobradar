import { z } from "zod";

export const jobAnalysisSchema = z.object({
  summary: z.string(),
  requiredSkills: z.array(z.string()),
  niceToHaveSkills: z.array(z.string()),
  experienceLevel: z.enum([
    "internship",
    "junior",
    "mid",
    "senior",
    "unknown",
  ]),
  remotePolicy: z.enum([
    "on_site",
    "hybrid",
    "full_remote",
    "unknown",
  ]),
  salaryMentioned: z.boolean(),
  redFlags: z.array(z.string()),
  positiveSignals: z.array(z.string()),
});

export type JobAnalysis = z.infer<typeof jobAnalysisSchema>;