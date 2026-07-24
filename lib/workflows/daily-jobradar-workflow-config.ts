
import { z } from "zod";

export const DAILY_WORKFLOW_LIMITS = {
  maxLocations: 10,
  maxOffersPerPlan: 100,
  maxRagDocuments: 200,
  maxEmbeddings: 50,
  maxAiAnalyses: 20,
} as const;

export type ManualDemoWorkflowEnv = Partial<
  Record<
    | "MANUAL_DEMO_WORKFLOW_ENABLED"
    | "DAILY_TIMEZONE",
    string
  >
>;

function booleanFromEnv(defaultValue: boolean) {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalizedValue = value.trim().toLowerCase();

      if (normalizedValue === "true") {
        return true;
      }

      if (normalizedValue === "false") {
        return false;
      }
    }

    return value;
  }, z.boolean());
}

function integerFromEnv(options: {
  defaultValue: number;
  min: number;
  max: number;
}) {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return options.defaultValue;
    }

    if (typeof value === "string") {
      return Number(value);
    }

    return value;
  }, z.number().int().min(options.min).max(options.max));
}

const dailyJobRadarWorkflowEnvSchema = z
  .object({
    DAILY_WORKFLOW_ENABLED: booleanFromEnv(false),

    DAILY_APIFY_ENABLED: booleanFromEnv(false),
    DAILY_RAG_ENABLED: booleanFromEnv(false),
    DAILY_AI_ENABLED: booleanFromEnv(false),
    DAILY_EMAIL_ENABLED: booleanFromEnv(false),

    DAILY_MAX_LOCATIONS: integerFromEnv({
      defaultValue: 3,
      min: 1,
      max: DAILY_WORKFLOW_LIMITS.maxLocations,
    }),

    DAILY_MAX_OFFERS_PER_PLAN: integerFromEnv({
      defaultValue: 10,
      min: 1,
      max: DAILY_WORKFLOW_LIMITS.maxOffersPerPlan,
    }),

    DAILY_MAX_RAG_DOCUMENTS: integerFromEnv({
      defaultValue: 20,
      min: 0,
      max: DAILY_WORKFLOW_LIMITS.maxRagDocuments,
    }),

    DAILY_MAX_EMBEDDINGS: integerFromEnv({
      defaultValue: 5,
      min: 0,
      max: DAILY_WORKFLOW_LIMITS.maxEmbeddings,
    }),

    DAILY_MAX_AI_ANALYSES: integerFromEnv({
      defaultValue: 3,
      min: 0,
      max: DAILY_WORKFLOW_LIMITS.maxAiAnalyses,
    }),

    DAILY_TIMEZONE: z.string().trim().min(1).default("Europe/Paris"),
  })
  .transform((env) => ({
    enabled: env.DAILY_WORKFLOW_ENABLED,
    timezone: env.DAILY_TIMEZONE,

    apify: {
      enabled: env.DAILY_APIFY_ENABLED,
      maxLocations: env.DAILY_MAX_LOCATIONS,
      maxOffersPerPlan: env.DAILY_MAX_OFFERS_PER_PLAN,
    },

    rag: {
      enabled: env.DAILY_RAG_ENABLED,
      maxDocuments: env.DAILY_MAX_RAG_DOCUMENTS,
      maxEmbeddings: env.DAILY_MAX_EMBEDDINGS,
    },

    ai: {
      enabled: env.DAILY_AI_ENABLED,
      maxAnalyses: env.DAILY_MAX_AI_ANALYSES,
    },

    email: {
      enabled: env.DAILY_EMAIL_ENABLED,
    },
  }));

export type DailyJobRadarWorkflowConfig = z.infer<
  typeof dailyJobRadarWorkflowEnvSchema
>;

export function getManualDemoJobRadarWorkflowConfig(
  env: ManualDemoWorkflowEnv = process.env as ManualDemoWorkflowEnv,
): DailyJobRadarWorkflowConfig {
  const manualDemoEnabled = booleanFromEnv(false).parse(
    env.MANUAL_DEMO_WORKFLOW_ENABLED,
  );

  return getDailyJobRadarWorkflowConfig({
    DAILY_WORKFLOW_ENABLED: String(manualDemoEnabled),

    // La campagne Apify existe déjà.
    DAILY_APIFY_ENABLED: "false",

    // Pipeline post-import complet.
    DAILY_RAG_ENABLED: "true",
    DAILY_AI_ENABLED: "true",
    DAILY_EMAIL_ENABLED: "true",

    // Non utilisés car Apify est désactivé.
    DAILY_MAX_LOCATIONS: "1",
    DAILY_MAX_OFFERS_PER_PLAN: "1",

    // Plafonds techniques maximaux actuellement acceptés par l’application.
    DAILY_MAX_RAG_DOCUMENTS: String(
      DAILY_WORKFLOW_LIMITS.maxRagDocuments,
    ),
    DAILY_MAX_EMBEDDINGS: String(
      DAILY_WORKFLOW_LIMITS.maxEmbeddings,
    ),
    DAILY_MAX_AI_ANALYSES: String(
      DAILY_WORKFLOW_LIMITS.maxAiAnalyses,
    ),

    DAILY_TIMEZONE: env.DAILY_TIMEZONE,
  });
}
export type DailyJobRadarWorkflowStep = "apify" | "rag" | "ai" | "email";

export type DailyJobRadarWorkflowEnv = Partial<
  Record<
    | "DAILY_WORKFLOW_ENABLED"
    | "DAILY_APIFY_ENABLED"
    | "DAILY_RAG_ENABLED"
    | "DAILY_AI_ENABLED"
    | "DAILY_EMAIL_ENABLED"
    | "DAILY_MAX_LOCATIONS"
    | "DAILY_MAX_OFFERS_PER_PLAN"
    | "DAILY_MAX_RAG_DOCUMENTS"
    | "DAILY_MAX_EMBEDDINGS"
    | "DAILY_MAX_AI_ANALYSES"
    | "DAILY_TIMEZONE",
    string
  >
>;
export function getDailyJobRadarWorkflowConfig(
  env: DailyJobRadarWorkflowEnv = process.env as DailyJobRadarWorkflowEnv,
): DailyJobRadarWorkflowConfig {
  return dailyJobRadarWorkflowEnvSchema.parse({
    DAILY_WORKFLOW_ENABLED: env.DAILY_WORKFLOW_ENABLED,

    DAILY_APIFY_ENABLED: env.DAILY_APIFY_ENABLED,
    DAILY_RAG_ENABLED: env.DAILY_RAG_ENABLED,
    DAILY_AI_ENABLED: env.DAILY_AI_ENABLED,
    DAILY_EMAIL_ENABLED: env.DAILY_EMAIL_ENABLED,

    DAILY_MAX_LOCATIONS: env.DAILY_MAX_LOCATIONS,
    DAILY_MAX_OFFERS_PER_PLAN: env.DAILY_MAX_OFFERS_PER_PLAN,
    DAILY_MAX_RAG_DOCUMENTS: env.DAILY_MAX_RAG_DOCUMENTS,
    DAILY_MAX_EMBEDDINGS: env.DAILY_MAX_EMBEDDINGS,
    DAILY_MAX_AI_ANALYSES: env.DAILY_MAX_AI_ANALYSES,

    DAILY_TIMEZONE: env.DAILY_TIMEZONE,
  });
}

export function isDailyWorkflowStepEnabled(
  config: DailyJobRadarWorkflowConfig,
  step: DailyJobRadarWorkflowStep,
): boolean {
  return config.enabled && config[step].enabled;
}