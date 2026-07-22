import { describe, expect, it } from "vitest";

import { buildDailyJobRadarWorkflowPlan } from "@/lib/workflows/build-daily-jobradar-workflow-plan";
import { getDailyJobRadarWorkflowConfig } from "@/lib/workflows/daily-jobradar-workflow-config";

describe("buildDailyJobRadarWorkflowPlan", () => {
  it("ignore toutes les étapes lorsque le workflow global est désactivé", () => {
    const config = getDailyJobRadarWorkflowConfig({
      DAILY_WORKFLOW_ENABLED: "false",

      DAILY_APIFY_ENABLED: "true",
      DAILY_RAG_ENABLED: "true",
      DAILY_AI_ENABLED: "true",
      DAILY_EMAIL_ENABLED: "true",
    });

    const plan = buildDailyJobRadarWorkflowPlan(config);

    expect(plan.steps).toHaveLength(5);

    expect(
      plan.steps.every(
        (step) =>
          step.status === "SKIPPED" &&
          step.reason === "WORKFLOW_DISABLED",
      ),
    ).toBe(true);

    expect(plan.summary).toEqual({
      plannedSteps: 0,
      skippedSteps: 5,
      externalCallsAuthorized: false,
    });

    expect(plan.limits).toEqual({
      maxLocations: 0,
      maxOffersPerPlan: 0,
      maxRagDocuments: 0,
      maxEmbeddings: 0,
      maxAiAnalyses: 0,
      maxEmails: 0,
    });
  });

  it("planifie seulement le rapport lorsque les étapes externes sont désactivées", () => {
    const config = getDailyJobRadarWorkflowConfig({
      DAILY_WORKFLOW_ENABLED: "true",
    });

    const plan = buildDailyJobRadarWorkflowPlan(config);

    expect(
      plan.steps.find((step) => step.id === "REPORT"),
    ).toMatchObject({
      status: "PLANNED",
      reason: "READY",
      external: false,
    });

    expect(
      plan.steps
        .filter((step) => step.id !== "REPORT")
        .every(
          (step) =>
            step.status === "SKIPPED" &&
            step.reason === "STEP_DISABLED",
        ),
    ).toBe(true);

    expect(plan.summary).toEqual({
      plannedSteps: 1,
      skippedSteps: 4,
      externalCallsAuthorized: false,
    });
  });

  it("planifie toutes les étapes explicitement autorisées avec leurs limites", () => {
    const config = getDailyJobRadarWorkflowConfig({
      DAILY_WORKFLOW_ENABLED: "true",

      DAILY_APIFY_ENABLED: "true",
      DAILY_RAG_ENABLED: "true",
      DAILY_AI_ENABLED: "true",
      DAILY_EMAIL_ENABLED: "true",

      DAILY_MAX_LOCATIONS: "2",
      DAILY_MAX_OFFERS_PER_PLAN: "15",
      DAILY_MAX_RAG_DOCUMENTS: "12",
      DAILY_MAX_EMBEDDINGS: "4",
      DAILY_MAX_AI_ANALYSES: "2",
    });

    const plan = buildDailyJobRadarWorkflowPlan(config);

    expect(
      plan.steps.every((step) => step.status === "PLANNED"),
    ).toBe(true);

    expect(plan.limits).toEqual({
      maxLocations: 2,
      maxOffersPerPlan: 15,
      maxRagDocuments: 12,
      maxEmbeddings: 4,
      maxAiAnalyses: 2,
      maxEmails: 1,
    });

    expect(plan.summary).toEqual({
      plannedSteps: 5,
      skippedSteps: 0,
      externalCallsAuthorized: true,
    });
  });

  it("ignore l’analyse IA lorsqu’elle est activée avec une limite à zéro", () => {
    const config = getDailyJobRadarWorkflowConfig({
      DAILY_WORKFLOW_ENABLED: "true",
      DAILY_AI_ENABLED: "true",
      DAILY_MAX_AI_ANALYSES: "0",
    });

    const plan = buildDailyJobRadarWorkflowPlan(config);

    expect(
      plan.steps.find((step) => step.id === "AI_ANALYSIS"),
    ).toMatchObject({
      status: "SKIPPED",
      reason: "LIMIT_ZERO",
    });

    expect(plan.limits.maxAiAnalyses).toBe(0);
  });

  it("conserve le RAG planifié avec zéro embedding si des documents restent autorisés", () => {
    const config = getDailyJobRadarWorkflowConfig({
      DAILY_WORKFLOW_ENABLED: "true",
      DAILY_RAG_ENABLED: "true",
      DAILY_MAX_RAG_DOCUMENTS: "10",
      DAILY_MAX_EMBEDDINGS: "0",
    });

    const plan = buildDailyJobRadarWorkflowPlan(config);

    expect(
      plan.steps.find((step) => step.id === "RAG_SYNC"),
    ).toMatchObject({
      status: "PLANNED",
      reason: "READY",
    });

    expect(plan.limits.maxRagDocuments).toBe(10);
    expect(plan.limits.maxEmbeddings).toBe(0);
  });

  it("ignore le RAG lorsque sa limite de documents vaut zéro", () => {
    const config = getDailyJobRadarWorkflowConfig({
      DAILY_WORKFLOW_ENABLED: "true",
      DAILY_RAG_ENABLED: "true",
      DAILY_MAX_RAG_DOCUMENTS: "0",
    });

    const plan = buildDailyJobRadarWorkflowPlan(config);

    expect(
      plan.steps.find((step) => step.id === "RAG_SYNC"),
    ).toMatchObject({
      status: "SKIPPED",
      reason: "LIMIT_ZERO",
    });

    expect(plan.limits.maxRagDocuments).toBe(0);
    expect(plan.limits.maxEmbeddings).toBe(0);
  });
});