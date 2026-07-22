import { describe, expect, it, vi } from "vitest";

import type { GeneratedJobRadarReport } from "@/lib/reports/generate-jobradar-report";
import {
  runDailyJobRadarWorkflow,
  type RunDailyJobRadarWorkflowDependencies,
} from "@/lib/workflows/run-daily-jobradar-workflow";
import { getDailyJobRadarWorkflowConfig } from "@/lib/workflows/daily-jobradar-workflow-config";

function createReport(): GeneratedJobRadarReport {
  return {
    filename: "jobradar-report-2026-07-21-campaign-1.md",
    filePath: "/reports/jobradar-report-2026-07-21-campaign-1.md",
    content: "# Rapport JobRadar — 2026-07-21",
    modifiedAt: new Date("2026-07-21T08:00:00.000Z"),

    scope: {
      type: "campaign",
      campaignId: "campaign-1",
    },

    campaignId: "campaign-1",
    scopedOffersCount: 2,
  };
}

function createDependencies(): RunDailyJobRadarWorkflowDependencies {
  return {
    runImport: vi.fn().mockResolvedValue({
      campaignId: "campaign-1",
    }),

    getCampaignJobOfferIds: vi.fn().mockResolvedValue(["offer-1", "offer-2"]),

    runRag: vi.fn().mockResolvedValue({
      errors: 0,
      successfulDocuments: 2,
    }),

    runAi: vi.fn().mockResolvedValue({
      failedAnalyses: 0,
      successfulAnalyses: 2,
      totalTokens: 500,
    }),

    generateReport: vi.fn().mockResolvedValue(createReport()),

    sendReportEmail: vi.fn().mockResolvedValue({
      messageId: "message-1",
    }),
  };
}

function createEnabledConfig() {
  return getDailyJobRadarWorkflowConfig({
    DAILY_WORKFLOW_ENABLED: "true",
    DAILY_APIFY_ENABLED: "true",
    DAILY_RAG_ENABLED: "true",
    DAILY_AI_ENABLED: "true",
    DAILY_EMAIL_ENABLED: "true",

    DAILY_MAX_LOCATIONS: "2",
    DAILY_MAX_OFFERS_PER_PLAN: "10",
    DAILY_MAX_RAG_DOCUMENTS: "8",
    DAILY_MAX_EMBEDDINGS: "2",
    DAILY_MAX_AI_ANALYSES: "2",
  });
}

describe("runDailyJobRadarWorkflow", () => {
  it("ne déclenche aucune dépendance en dry-run", async () => {
    const dependencies = createDependencies();

    const result = await runDailyJobRadarWorkflow(
      {
        config: createEnabledConfig(),
      },
      dependencies,
    );

    expect(result.mode).toBe("DRY_RUN");
    expect(result.status).toBe("PLANNED");

    expect(dependencies.runImport).not.toHaveBeenCalled();

    expect(dependencies.runRag).not.toHaveBeenCalled();

    expect(dependencies.runAi).not.toHaveBeenCalled();

    expect(dependencies.generateReport).not.toHaveBeenCalled();

    expect(dependencies.sendReportEmail).not.toHaveBeenCalled();
  });

  it("enchaîne toutes les étapes avec l’identifiant exact de la campagne", async () => {
    const dependencies = createDependencies();

    const result = await runDailyJobRadarWorkflow(
      {
        config: createEnabledConfig(),
        execute: true,
        now: new Date("2026-07-21T07:00:00.000Z"),
      },
      dependencies,
    );

    expect(dependencies.runImport).toHaveBeenCalledWith({
      maxLocations: 2,
      maxOffersPerPlan: 10,
    });

    expect(dependencies.getCampaignJobOfferIds).toHaveBeenCalledWith(
      "campaign-1",
    );

    expect(dependencies.runRag).toHaveBeenCalledWith({
      campaignId: "campaign-1",
      maxDocuments: 8,
      maxEmbeddings: 2,
    });

    expect(dependencies.runAi).toHaveBeenCalledWith({
      jobOfferIds: ["offer-1", "offer-2"],
      maxAnalyses: 2,
    });

    expect(dependencies.generateReport).toHaveBeenCalledWith({
      now: new Date("2026-07-21T07:00:00.000Z"),
      campaignId: "campaign-1",
      recentHours: 24,
    });

    expect(dependencies.sendReportEmail).toHaveBeenCalledWith({
      report: createReport(),
      campaignId: "campaign-1",
    });

    expect(result.status).toBe("SUCCESS");
    expect(result.campaignId).toBe("campaign-1");
  });

  it("poursuit après des erreurs partielles du RAG", async () => {
    const dependencies = createDependencies();

    vi.mocked(dependencies.runRag).mockResolvedValue({
      errors: 1,
      successfulDocuments: 1,
    });

    const result = await runDailyJobRadarWorkflow(
      {
        config: createEnabledConfig(),
        execute: true,
      },
      dependencies,
    );

    expect(result.status).toBe("PARTIAL");

    expect(result.steps.find((step) => step.id === "RAG_SYNC")).toMatchObject({
      status: "PARTIAL",
    });

    expect(dependencies.runAi).toHaveBeenCalled();

    expect(dependencies.generateReport).toHaveBeenCalled();

    expect(dependencies.sendReportEmail).toHaveBeenCalled();
  });

  it("utilise un rapport temporel si l’import échoue", async () => {
    const dependencies = createDependencies();

    vi.mocked(dependencies.runImport).mockRejectedValue(
      new Error("Apify unavailable"),
    );

    const result = await runDailyJobRadarWorkflow(
      {
        config: createEnabledConfig(),
        execute: true,
        recentHours: 12,
      },
      dependencies,
    );

    expect(dependencies.runRag).not.toHaveBeenCalled();

    expect(dependencies.runAi).not.toHaveBeenCalled();

    expect(dependencies.generateReport).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: null,
        recentHours: 12,
      }),
    );

    expect(dependencies.sendReportEmail).toHaveBeenCalled();

    expect(result.status).toBe("PARTIAL");
  });

  it("n’envoie pas d’email lorsque l’étape est désactivée", async () => {
    const dependencies = createDependencies();

    const config = getDailyJobRadarWorkflowConfig({
      DAILY_WORKFLOW_ENABLED: "true",
      DAILY_APIFY_ENABLED: "true",
      DAILY_RAG_ENABLED: "true",
      DAILY_AI_ENABLED: "true",
      DAILY_EMAIL_ENABLED: "false",
    });

    const result = await runDailyJobRadarWorkflow(
      {
        config,
        execute: true,
      },
      dependencies,
    );

    expect(dependencies.sendReportEmail).not.toHaveBeenCalled();

    expect(result.steps.find((step) => step.id === "EMAIL")).toMatchObject({
      status: "SKIPPED",
    });

    expect(result.status).toBe("SUCCESS");
  });
  it("refuse une exécution active sans dépendances serveur", async () => {
    await expect(
      runDailyJobRadarWorkflow({
        config: createEnabledConfig(),
        execute: true,
      }),
    ).rejects.toThrow(
      "Daily workflow dependencies are required in execute mode.",
    );
  });
});
