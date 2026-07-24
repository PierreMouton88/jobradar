import { describe, expect, it } from "vitest";

import {
  getDailyJobRadarWorkflowConfig,
  getManualDemoJobRadarWorkflowConfig,
  isDailyWorkflowStepEnabled,
} from "@/lib/workflows/daily-jobradar-workflow-config";

describe("getDailyJobRadarWorkflowConfig", () => {
  it("désactive toutes les actions externes par défaut", () => {
    const config = getDailyJobRadarWorkflowConfig({});

    expect(config).toEqual({
      enabled: false,
      timezone: "Europe/Paris",

      apify: {
        enabled: false,
        maxLocations: 3,
        maxOffersPerPlan: 10,
      },

      rag: {
        enabled: false,
        maxDocuments: 20,
        maxEmbeddings: 5,
      },

      ai: {
        enabled: false,
        maxAnalyses: 3,
      },

      email: {
        enabled: false,
      },
    });
  });

  it("convertit les variables d’environnement textuelles", () => {
    const config = getDailyJobRadarWorkflowConfig({
      DAILY_WORKFLOW_ENABLED: "true",
      DAILY_APIFY_ENABLED: "true",
      DAILY_RAG_ENABLED: "true",
      DAILY_AI_ENABLED: "false",
      DAILY_EMAIL_ENABLED: "true",

      DAILY_MAX_LOCATIONS: "2",
      DAILY_MAX_OFFERS_PER_PLAN: "15",
      DAILY_MAX_RAG_DOCUMENTS: "12",
      DAILY_MAX_EMBEDDINGS: "4",
      DAILY_MAX_AI_ANALYSES: "2",

      DAILY_TIMEZONE: "Europe/Paris",
    });

    expect(config.enabled).toBe(true);

    expect(config.apify).toEqual({
      enabled: true,
      maxLocations: 2,
      maxOffersPerPlan: 15,
    });

    expect(config.rag).toEqual({
      enabled: true,
      maxDocuments: 12,
      maxEmbeddings: 4,
    });

    expect(config.ai).toEqual({
      enabled: false,
      maxAnalyses: 2,
    });

    expect(config.email.enabled).toBe(true);
  });

  it("refuse une limite négative", () => {
    expect(() =>
      getDailyJobRadarWorkflowConfig({
        DAILY_MAX_EMBEDDINGS: "-1",
      }),
    ).toThrow();
  });

  it("maintient les étapes désactivées si le workflow global est désactivé", () => {
    const config = getDailyJobRadarWorkflowConfig({
      DAILY_WORKFLOW_ENABLED: "false",
      DAILY_APIFY_ENABLED: "true",
      DAILY_RAG_ENABLED: "true",
      DAILY_AI_ENABLED: "true",
      DAILY_EMAIL_ENABLED: "true",
    });

    expect(isDailyWorkflowStepEnabled(config, "apify")).toBe(false);
    expect(isDailyWorkflowStepEnabled(config, "rag")).toBe(false);
    expect(isDailyWorkflowStepEnabled(config, "ai")).toBe(false);
    expect(isDailyWorkflowStepEnabled(config, "email")).toBe(false);
  });

  it("refuse une limite supérieure au garde-fou maximal", () => {
    expect(() =>
      getDailyJobRadarWorkflowConfig({
        DAILY_MAX_AI_ANALYSES: "10000",
      }),
    ).toThrow();
  });

  describe("getManualDemoJobRadarWorkflowConfig", () => {
    it("reste désactivé lorsque le coupe-circuit manuel est absent", () => {
      const config = getManualDemoJobRadarWorkflowConfig({});

      expect(config.enabled).toBe(false);
      expect(config.apify.enabled).toBe(false);
    });

    it("construit une démonstration complète avec les plafonds applicatifs", () => {
      const config = getManualDemoJobRadarWorkflowConfig({
        MANUAL_DEMO_WORKFLOW_ENABLED: "true",
        DAILY_TIMEZONE: "Europe/Paris",
      });

      expect(config).toEqual({
        enabled: true,
        timezone: "Europe/Paris",

        apify: {
          enabled: false,
          maxLocations: 1,
          maxOffersPerPlan: 1,
        },

        rag: {
          enabled: true,
          maxDocuments: 200,
          maxEmbeddings: 50,
        },

        ai: {
          enabled: true,
          maxAnalyses: 20,
        },

        email: {
          enabled: true,
        },
      });
    });
  });
});
