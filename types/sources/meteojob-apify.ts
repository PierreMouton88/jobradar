import { z } from "zod";

export const meteojobApifyLocationSchema = z
  .object({
    name: z.string().nullish(),
    admin1_label: z.string().nullish(),
    country_label: z.string().nullish(),
  })
  .loose();

export const meteojobApifyCompanySchema = z
  .object({
    name: z.string().nullish(),
  })
  .loose()
  .nullish();

export const meteojobApifySalarySchema = z
  .object({
    currency: z.string().nullish(),
    from: z.number().nullish(),
    to: z.number().nullish(),
    period: z.string().nullish(),
  })
  .loose()
  .nullish();

export const meteojobApifyUrlSchema = z
  .object({
    job_offer: z.string().nullish(),
    job_offer_short: z.string().nullish(),
    redirect: z.string().nullish(),
  })
  .loose()
  .nullish();

export const meteojobApifyLabelValueSchema = z
  .object({
    value: z.string().nullish(),
    meteojob_id: z.string().nullish(),
  })
  .loose();

export const meteojobApifyLabelsSchema = z
  .object({
    salary: meteojobApifyLabelValueSchema.nullish(),
    telework: meteojobApifyLabelValueSchema.nullish(),
    experience_level_list: z.array(meteojobApifyLabelValueSchema).nullish(),
    contract_type_list: z.array(meteojobApifyLabelValueSchema).nullish(),
    job_type_list: z.array(meteojobApifyLabelValueSchema).nullish(),
  })
  .loose()
  .nullish();

export const meteojobApifyOfferSchema = z
  .object({
    id: z.coerce.string(),
    title: z.string(),

    company: meteojobApifyCompanySchema,

    locality: z.string().nullish(),
    locations: z.array(meteojobApifyLocationSchema).nullish(),

    contract_types: z.array(z.string()).nullish(),
    job_type: z.array(z.string()).nullish(),

    description: z.string().nullish(),
    profile_description: z.string().nullish(),
    company_description: z.string().nullish(),
    highlight: z.string().nullish(),
    benefits: z.string().nullish(),

    publication_date: z.string().nullish(),
    last_modification: z.string().nullish(),

    salary: meteojobApifySalarySchema,
    labels: meteojobApifyLabelsSchema,

    url: meteojobApifyUrlSchema,

    from_url: z.string().nullish(),
  })
  .loose();

export type MeteojobApifyOffer = z.infer<typeof meteojobApifyOfferSchema>;