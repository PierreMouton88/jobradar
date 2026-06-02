import { z } from "zod";

export const indeedApifyLocationSchema = z
  .object({
    formattedAddressShort: z.string().optional().nullable(),
    fullAddress: z.string().optional().nullable(),
  })
  .optional()
  .nullable();

export const indeedApifySalarySchema = z
  .object({
    salaryText: z.string().optional().nullable(),
    salaryMin: z.number().optional().nullable(),
    salaryMax: z.number().optional().nullable(),
    salaryCurrency: z.string().optional().nullable(),
  })
  .optional()
  .nullable();

export const indeedApifyOfferSchema = z.object({
  jobKey: z.string(),
  title: z.string(),
  companyName: z.string(),
  location: indeedApifyLocationSchema,
  jobType: z.array(z.string()).optional().nullable(),
  descriptionText: z.string(),
  jobUrl: z.string(),
  applyUrl: z.string().optional().nullable(),
  datePublished: z.string().optional().nullable(),
  isRemote: z.boolean().optional().nullable(),
  salary: indeedApifySalarySchema,
  attributes: z.array(z.string()).optional().nullable(),
});

export type IndeedApifyOffer = z.infer<typeof indeedApifyOfferSchema>;