import { describe, expect, it, vi } from "vitest";

import type { CampaignRagSyncPlanItem } from "@/lib/rag/build-campaign-rag-sync-plan";
import type { CampaignRagSyncPreview } from "@/lib/rag/get-campaign-rag-sync-preview";
import {
  type CampaignRagSyncDependencies,
  executeCampaignRagSync,
} from "@/lib/rag/execute-campaign-rag-sync";

function createPlanItem(
  sourceId: string,
  options: {
    action?: "CREATE" | "UPDATE" | "UP_TO_DATE";
    requiresEmbedding?: boolean;
  } = {},
): CampaignRagSyncPlanItem {
  const action = options.action ?? "CREATE";

  return {
    action,
    requiresEmbedding: options.requiresEmbedding ?? action !== "UP_TO_DATE",
    reasons:
      action === "UP_TO_DATE"
        ? []
        : action === "CREATE"
          ? ["DOCUMENT_MISSING"]
          : ["METADATA_CHANGED"],
    candidate: {
      sourceId,
      title: `Offre ${sourceId}`,
      content: `Contenu ${sourceId}`,
      metadata: {
        jobOfferId: sourceId,
      },
      modelName: "text-embedding-3-small",
    },
  };
}

function createPreview(
  plan: CampaignRagSyncPlanItem[],
  overrides: Partial<CampaignRagSyncPreview["campaign"]> = {},
): CampaignRagSyncPreview {
  return {
    campaign: {
      id: "campaign-1",
      status: "SUCCESS",
      dryRun: false,
      startedAt: new Date("2026-07-16T12:00:00.000Z"),
      finishedAt: new Date("2026-07-16T12:05:00.000Z"),
      ...overrides,
    },
    selectedJobOfferIds: plan.map((item) => item.candidate.sourceId),
    missingJobOfferIds: [],
    plan,
    summary: {
      selectedOffers: plan.length,
      foundOffers: plan.length,
      missingOffers: 0,
      create: plan.filter((item) => item.action === "CREATE").length,
      update: plan.filter((item) => item.action === "UPDATE").length,
      upToDate: plan.filter((item) => item.action === "UP_TO_DATE").length,
      requiringEmbedding: plan.filter((item) => item.requiresEmbedding).length,
    },
  };
}

function createDependencies(
  preview: CampaignRagSyncPreview,
): CampaignRagSyncDependencies {
  return {
    getPreview: vi.fn().mockResolvedValue(preview),
    generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    saveEmbedding: vi.fn().mockImplementation(async (input) => ({
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      title: input.title,
      embeddingDimensions: input.embedding.length,
    })),
    updateWithoutEmbedding: vi.fn().mockImplementation(async (input) => ({
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      title: input.title,
    })),
  };
}

describe("executeCampaignRagSync", () => {
  it("reste en dry-run par défaut sans appel OpenAI ni écriture", async () => {
    const preview = createPreview([createPlanItem("offer-1")]);
    const dependencies = createDependencies(preview);

    const result = await executeCampaignRagSync(
      {
        campaignId: "campaign-1",
      },
      dependencies,
    );

    expect(result.mode).toBe("DRY_RUN");
    expect(result.items[0].status).toBe("PLANNED");

    expect(dependencies.generateEmbedding).not.toHaveBeenCalled();
    expect(dependencies.saveEmbedding).not.toHaveBeenCalled();
    expect(dependencies.updateWithoutEmbedding).not.toHaveBeenCalled();
  });

  it("exécute un embedding et une mise à jour sans embedding", async () => {
    const preview = createPreview([
      createPlanItem("offer-created"),
      createPlanItem("offer-updated", {
        action: "UPDATE",
        requiresEmbedding: false,
      }),
    ]);
    const dependencies = createDependencies(preview);

    const result = await executeCampaignRagSync(
      {
        campaignId: "campaign-1",
        execute: true,
        maxDocuments: 10,
        maxEmbeddings: 5,
      },
      dependencies,
    );

    expect(dependencies.generateEmbedding).toHaveBeenCalledTimes(1);
    expect(dependencies.saveEmbedding).toHaveBeenCalledTimes(1);
    expect(dependencies.updateWithoutEmbedding).toHaveBeenCalledTimes(1);

    expect(result.summary).toMatchObject({
      successfulDocuments: 2,
      createdDocuments: 1,
      updatedDocuments: 1,
      generatedEmbeddings: 1,
      errors: 0,
    });
  });

  it("continue après une erreur sur une offre", async () => {
    const preview = createPreview([
      createPlanItem("offer-error"),
      createPlanItem("offer-success"),
    ]);
    const dependencies = createDependencies(preview);

    vi.mocked(dependencies.generateEmbedding)
      .mockRejectedValueOnce(new Error("OpenAI unavailable"))
      .mockResolvedValueOnce([0.1, 0.2]);

    const result = await executeCampaignRagSync(
      {
        campaignId: "campaign-1",
        execute: true,
        maxDocuments: 10,
        maxEmbeddings: 10,
      },
      dependencies,
    );

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      sourceId: "offer-error",
      status: "ERROR",
      errorMessage: "OpenAI unavailable",
    });
    expect(result.items[1]).toMatchObject({
      sourceId: "offer-success",
      status: "SUCCESS",
    });

    expect(result.summary.errors).toBe(1);
    expect(result.summary.successfulDocuments).toBe(1);
  });

  it("refuse l’exécution d’une campagne d’import dry-run", async () => {
    const preview = createPreview([createPlanItem("offer-1")], {
      dryRun: true,
    });
    const dependencies = createDependencies(preview);

    await expect(
      executeCampaignRagSync(
        {
          campaignId: "campaign-1",
          execute: true,
        },
        dependencies,
      ),
    ).rejects.toThrow(
      "Cannot execute a RAG synchronization for an import campaign created in dry-run mode.",
    );

    expect(dependencies.generateEmbedding).not.toHaveBeenCalled();
  });

  it("applique les limites avant toute exécution", async () => {
    const preview = createPreview([
      createPlanItem("offer-1"),
      createPlanItem("offer-2"),
      createPlanItem("offer-3"),
    ]);
    const dependencies = createDependencies(preview);

    const result = await executeCampaignRagSync(
      {
        campaignId: "campaign-1",
        execute: true,
        maxDocuments: 10,
        maxEmbeddings: 1,
      },
      dependencies,
    );

    expect(dependencies.generateEmbedding).toHaveBeenCalledTimes(1);
    expect(result.summary.plannedDocuments).toBe(1);
    expect(result.summary.plannedEmbeddings).toBe(1);
    expect(result.selection.summary.skippedByEmbeddingLimit).toBe(2);
  });

  it("refuse une campagne dont le statut ne permet pas l’exécution", async () => {
    const preview = createPreview([createPlanItem("offer-1")], {
      status: "FAILED",
    });

    const dependencies = createDependencies(preview);

    await expect(
      executeCampaignRagSync(
        {
          campaignId: "campaign-1",
          execute: true,
        },
        dependencies,
      ),
    ).rejects.toThrow(
      "Cannot execute a RAG synchronization for campaign campaign-1 with status FAILED.",
    );

    expect(dependencies.generateEmbedding).not.toHaveBeenCalled();
  });

  it("termine proprement lorsqu’aucun document ne nécessite de synchronisation", async () => {
    const preview = createPreview([
      createPlanItem("offer-1", {
        action: "UP_TO_DATE",
        requiresEmbedding: false,
      }),
    ]);

    const dependencies = createDependencies(preview);

    const result = await executeCampaignRagSync(
      {
        campaignId: "campaign-1",
        execute: true,
      },
      dependencies,
    );

    expect(result.items).toEqual([]);
    expect(result.summary).toMatchObject({
      plannedDocuments: 0,
      plannedEmbeddings: 0,
      successfulDocuments: 0,
      generatedEmbeddings: 0,
      errors: 0,
    });

    expect(dependencies.generateEmbedding).not.toHaveBeenCalled();
    expect(dependencies.saveEmbedding).not.toHaveBeenCalled();
    expect(dependencies.updateWithoutEmbedding).not.toHaveBeenCalled();
  });
});
