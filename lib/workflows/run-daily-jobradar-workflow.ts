import type { GeneratedJobRadarReport } from "@/lib/reports/generate-jobradar-report";
import { getDailyJobRadarWorkflowConfig } from "./daily-jobradar-workflow-config";
import {
  buildDailyJobRadarWorkflowPlan,
  DailyJobRadarWorkflowStepId,
} from "./build-daily-jobradar-workflow-plan";

const DEFAULT_RECENT_HOURS = 24;

export type DailyJobRadarWorkflowMode = "DRY_RUN" | "EXECUTE";

export type DailyJobRadarWorkflowStatus =
  | "PLANNED"
  | "SKIPPED"
  | "SUCCESS"
  | "PARTIAL"
  | "FAILED";

export type DailyJobRadarWorkflowStepStatus =
  | "PLANNED"
  | "SKIPPED"
  | "SUCCESS"
  | "PARTIAL"
  | "ERROR";

export type DailyJobRadarWorkflowStepResult = {
  id: DailyJobRadarWorkflowStepId;
  status: DailyJobRadarWorkflowStepStatus;
  message: string;
  errorMessage?: string;
};

export type RunDailyJobRadarWorkflowOptions = {
  execute?: boolean;
  config?: ReturnType<typeof getDailyJobRadarWorkflowConfig>;
  now?: Date;

  /**
   * Permet de relancer manuellement les étapes sur une campagne existante
   * lorsque l’import Apify n’est pas planifié.
   */
  campaignId?: string | null;

  /**
   * Portée de secours du rapport lorsqu’aucune campagne n’est disponible.
   */
  recentHours?: number;
};

export type DailyJobRadarWorkflowResult = {
  mode: DailyJobRadarWorkflowMode;
  status: DailyJobRadarWorkflowStatus;
  startedAt: Date;
  finishedAt: Date;

  campaignId: string | null;
  jobOfferIds: string[];

  report: GeneratedJobRadarReport | null;
  steps: DailyJobRadarWorkflowStepResult[];
};

export type RunDailyJobRadarWorkflowDependencies = {
  runImport: (input: {
    maxLocations: number;
    maxOffersPerPlan: number;
  }) => Promise<{
    campaignId: string | null;
  }>;

  getCampaignJobOfferIds: (campaignId: string) => Promise<string[]>;

  runRag: (input: {
    campaignId: string;
    maxDocuments: number;
    maxEmbeddings: number;
  }) => Promise<{
    errors: number;
    successfulDocuments: number;
  }>;

  runAi: (input: { jobOfferIds: string[]; maxAnalyses: number }) => Promise<{
    failedAnalyses: number;
    successfulAnalyses: number;
    totalTokens: number;
  }>;

  generateReport: (input: {
    now: Date;
    campaignId: string | null;
    recentHours: number;
  }) => Promise<GeneratedJobRadarReport>;

  sendReportEmail: (input: {
    report: GeneratedJobRadarReport;
    campaignId: string | null;
  }) => Promise<{
    messageId: string;
  }>;
};

function isPlanned(
  steps: ReturnType<typeof buildDailyJobRadarWorkflowPlan>["steps"],
  id: DailyJobRadarWorkflowStepId,
): boolean {
  return steps.some((step) => step.id === id && step.status === "PLANNED");
}

function validateRecentHours(recentHours: number): void {
  if (!Number.isInteger(recentHours) || recentHours <= 0) {
    throw new Error("recentHours must be a positive integer.");
  }
}

function buildDryRunSteps(
  plan: ReturnType<typeof buildDailyJobRadarWorkflowPlan>,
): DailyJobRadarWorkflowStepResult[] {
  return plan.steps.map((step) => ({
    id: step.id,
    status: step.status === "PLANNED" ? "PLANNED" : "SKIPPED",
    message:
      step.status === "PLANNED"
        ? "Étape prévue par la configuration."
        : `Étape ignorée : ${step.reason}.`,
  }));
}

function getWorkflowStatus(
  steps: DailyJobRadarWorkflowStepResult[],
): DailyJobRadarWorkflowStatus {
  const hasError = steps.some((step) => step.status === "ERROR");

  const hasPartial = steps.some((step) => step.status === "PARTIAL");

  const hasSuccess = steps.some((step) => step.status === "SUCCESS");

  if (hasError && !hasSuccess && !hasPartial) {
    return "FAILED";
  }

  if (hasError || hasPartial) {
    return "PARTIAL";
  }

  if (hasSuccess) {
    return "SUCCESS";
  }

  return "SKIPPED";
}

export async function runDailyJobRadarWorkflow(
  options: RunDailyJobRadarWorkflowOptions = {},
  dependencies?: RunDailyJobRadarWorkflowDependencies,
): Promise<DailyJobRadarWorkflowResult> {
  const startedAt = options.now ?? new Date();
  const recentHours = options.recentHours ?? DEFAULT_RECENT_HOURS;

  validateRecentHours(recentHours);

  const config = options.config ?? getDailyJobRadarWorkflowConfig();

  const plan = buildDailyJobRadarWorkflowPlan(config);

  const execute = options.execute ?? false;

  if (!execute) {
    return {
      mode: "DRY_RUN",
      status: config.enabled ? "PLANNED" : "SKIPPED",
      startedAt,
      finishedAt: new Date(),
      campaignId: options.campaignId ?? null,
      jobOfferIds: [],
      report: null,
      steps: buildDryRunSteps(plan),
    };
  }

  if (!config.enabled) {
    return {
      mode: "EXECUTE",
      status: "SKIPPED",
      startedAt,
      finishedAt: new Date(),
      campaignId: options.campaignId ?? null,
      jobOfferIds: [],
      report: null,
      steps: buildDryRunSteps(plan),
    };
  }
  if (!dependencies) {
    throw new Error(
      "Daily workflow dependencies are required in execute mode.",
    );
  }
  const steps: DailyJobRadarWorkflowStepResult[] = [];

  let campaignId = options.campaignId ?? null;

  let jobOfferIds: string[] = [];
  let report: GeneratedJobRadarReport | null = null;

  if (isPlanned(plan.steps, "APIFY_IMPORT")) {
    try {
      const importResult = await dependencies.runImport({
        maxLocations: plan.limits.maxLocations,
        maxOffersPerPlan: plan.limits.maxOffersPerPlan,
      });

      campaignId = importResult.campaignId;

      steps.push({
        id: "APIFY_IMPORT",
        status: "SUCCESS",
        message: `Campagne créée : ${campaignId}.`,
      });
    } catch (error) {
      steps.push({
        id: "APIFY_IMPORT",
        status: "ERROR",
        message: "La campagne d’import a échoué.",
        errorMessage:
          error instanceof Error ? error.message : "Unknown import error.",
      });
    }
  } else {
    steps.push({
      id: "APIFY_IMPORT",
      status: "SKIPPED",
      message: "Import Apify non planifié.",
    });
  }

  if (campaignId) {
    try {
      jobOfferIds = await dependencies.getCampaignJobOfferIds(campaignId);
    } catch (error) {
      steps.push({
        id: "RAG_SYNC",
        status: "ERROR",
        message: "Impossible de lire les offres de la campagne.",
        errorMessage:
          error instanceof Error
            ? error.message
            : "Unknown campaign scope error.",
      });
    }
  }

  if (isPlanned(plan.steps, "RAG_SYNC")) {
    if (!campaignId) {
      steps.push({
        id: "RAG_SYNC",
        status: "SKIPPED",
        message: "Synchronisation RAG ignorée : aucune campagne disponible.",
      });
    } else if (
      !steps.some((step) => step.id === "RAG_SYNC" && step.status === "ERROR")
    ) {
      try {
        const ragResult = await dependencies.runRag({
          campaignId,
          maxDocuments: plan.limits.maxRagDocuments,
          maxEmbeddings: plan.limits.maxEmbeddings,
        });

        steps.push({
          id: "RAG_SYNC",
          status: ragResult.errors > 0 ? "PARTIAL" : "SUCCESS",
          message: `${ragResult.successfulDocuments} document(s) RAG synchronisé(s), ${ragResult.errors} erreur(s).`,
        });
      } catch (error) {
        steps.push({
          id: "RAG_SYNC",
          status: "ERROR",
          message: "La synchronisation RAG a échoué.",
          errorMessage:
            error instanceof Error ? error.message : "Unknown RAG error.",
        });
      }
    }
  } else if (!steps.some((step) => step.id === "RAG_SYNC")) {
    steps.push({
      id: "RAG_SYNC",
      status: "SKIPPED",
      message: "Synchronisation RAG non planifiée.",
    });
  }

  if (isPlanned(plan.steps, "AI_ANALYSIS")) {
    if (!campaignId) {
      steps.push({
        id: "AI_ANALYSIS",
        status: "SKIPPED",
        message: "Analyses IA ignorées : aucune campagne disponible.",
      });
    } else {
      try {
        const aiResult = await dependencies.runAi({
          jobOfferIds,
          maxAnalyses: plan.limits.maxAiAnalyses,
        });

        steps.push({
          id: "AI_ANALYSIS",
          status: aiResult.failedAnalyses > 0 ? "PARTIAL" : "SUCCESS",
          message: `${aiResult.successfulAnalyses} analyse(s) réussie(s), ${aiResult.failedAnalyses} erreur(s), ${aiResult.totalTokens} token(s).`,
        });
      } catch (error) {
        steps.push({
          id: "AI_ANALYSIS",
          status: "ERROR",
          message: "L’étape d’analyse IA a échoué.",
          errorMessage:
            error instanceof Error
              ? error.message
              : "Unknown AI analysis error.",
        });
      }
    }
  } else {
    steps.push({
      id: "AI_ANALYSIS",
      status: "SKIPPED",
      message: "Analyses IA non planifiées.",
    });
  }

  try {
    report = await dependencies.generateReport({
      now: startedAt,
      campaignId,
      recentHours,
    });

    steps.push({
      id: "REPORT",
      status: "SUCCESS",
      message: `Rapport généré : ${report.filePath}.`,
    });
  } catch (error) {
    steps.push({
      id: "REPORT",
      status: "ERROR",
      message: "La génération du rapport a échoué.",
      errorMessage:
        error instanceof Error ? error.message : "Unknown report error.",
    });
  }

  if (isPlanned(plan.steps, "EMAIL")) {
    if (!report) {
      steps.push({
        id: "EMAIL",
        status: "SKIPPED",
        message: "Email ignoré : aucun rapport disponible.",
      });
    } else {
      try {
        const emailResult = await dependencies.sendReportEmail({
          report,
          campaignId,
        });

        steps.push({
          id: "EMAIL",
          status: "SUCCESS",
          message: `Email envoyé : ${emailResult.messageId}.`,
        });
      } catch (error) {
        steps.push({
          id: "EMAIL",
          status: "ERROR",
          message: "L’envoi du digest a échoué.",
          errorMessage:
            error instanceof Error ? error.message : "Unknown email error.",
        });
      }
    }
  } else {
    steps.push({
      id: "EMAIL",
      status: "SKIPPED",
      message: "Envoi email non planifié.",
    });
  }

  return {
    mode: "EXECUTE",
    status: getWorkflowStatus(steps),
    startedAt,
    finishedAt: new Date(),
    campaignId,
    jobOfferIds,
    report,
    steps,
  };
}
