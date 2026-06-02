import { z } from "zod";

export const linkedinApifyOfferSchema = z.object({
  job_id: z.string(),
  job_title: z.string(),
  company_name: z.string(),
  location: z.string().optional().nullable(),
  employment_type: z.string().optional().nullable(),
  job_description: z.string(),
  job_description_raw_html: z.string().optional().nullable(),
  job_url: z.string(),
  apply_url: z.string().optional().nullable(),
  salary_range: z.string().optional().nullable(),
  seniority_level: z.string().optional().nullable(),
  easy_apply: z.boolean().optional().nullable(),
  time_posted: z.string().optional().nullable(),
  num_applicants: z.string().optional().nullable(),
});

export type LinkedinApifyOffer = z.infer<typeof linkedinApifyOfferSchema>;