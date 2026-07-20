import { describe, expect, it } from "vitest";

import type { CampaignRagSyncPlanItem } from "@/lib/rag/build-campaign-rag-sync-plan";
import { selectCampaignRagSyncExecution } from "@/lib/rag/select-campaign-rag-sync-execution";

function createPlanItem(
  sourceId: string,
  options: {
    action?: CampaignRagSyncPlanItem["action"];
    requiresEmbedding?: boolean;
  } = {},
): CampaignRagSyncPlanItem {
  return {
    action: options.action ?? "CREATE",
    requiresEmbedding:
      options.requiresEmbedding ?? true,
    reasons:
      options.action === "UP_TO_DATE"
        ? []
        : ["DOCUMENT_MISSING"],
    candidate: {
      sourceId,
      title: `Offre ${sourceId}`,
      content: `Contenu ${sourceId}`,
      metadata: null,
      modelName: "text-embedding-3-small",
    },
  };
}

describe("selectCampaignRagSyncExecution", () => {
  it("sélectionne les créations et mises à jour en ignorant les documents déjà à jour", () => {
    const plan = [
      createPlanItem("offer-1"),
      createPlanItem("offer-2", {
        action: "UP_TO_DATE",
        requiresEmbedding: false,
      }),
      createPlanItem("offer-3", {
        action: "UPDATE",
        requiresEmbedding: false,
      }),
    ];

    const result = selectCampaignRagSyncExecution(plan, {
      maxDocuments: 10,
      maxEmbeddings: 10,
    });

    expect(
      result.selectedItems.map(
        (item) => item.candidate.sourceId,
      ),
    ).toEqual(["offer-1", "offer-3"]);

    expect(result.summary).toEqual({
      selectedDocuments: 2,
      selectedEmbeddings: 1,
      selectedWithoutEmbedding: 1,
      skippedUpToDate: 1,
      skippedByDocumentLimit: 0,
      skippedByEmbeddingLimit: 0,
    });
  });

  it("limite le nombre de documents nécessitant un embedding", () => {
    const plan = [
      createPlanItem("offer-1"),
      createPlanItem("offer-2"),
      createPlanItem("offer-3", {
        action: "UPDATE",
        requiresEmbedding: false,
      }),
      createPlanItem("offer-4"),
    ];

    const result = selectCampaignRagSyncExecution(plan, {
      maxDocuments: 10,
      maxEmbeddings: 2,
    });

    expect(
      result.selectedItems.map(
        (item) => item.candidate.sourceId,
      ),
    ).toEqual(["offer-1", "offer-2", "offer-3"]);

    expect(result.summary.selectedEmbeddings).toBe(2);
    expect(
      result.summary.skippedByEmbeddingLimit,
    ).toBe(1);
  });

  it("limite le nombre total de documents modifiés", () => {
    const plan = [
      createPlanItem("offer-1"),
      createPlanItem("offer-2", {
        action: "UPDATE",
        requiresEmbedding: false,
      }),
      createPlanItem("offer-3"),
    ];

    const result = selectCampaignRagSyncExecution(plan, {
      maxDocuments: 2,
      maxEmbeddings: 10,
    });

    expect(
      result.selectedItems.map(
        (item) => item.candidate.sourceId,
      ),
    ).toEqual(["offer-1", "offer-2"]);

    expect(result.summary.selectedDocuments).toBe(2);
    expect(
      result.summary.skippedByDocumentLimit,
    ).toBe(1);
  });

  it("préserve l’ordre du plan de synchronisation", () => {
    const plan = [
      createPlanItem("offer-3"),
      createPlanItem("offer-1"),
      createPlanItem("offer-2"),
    ];

    const result = selectCampaignRagSyncExecution(plan, {
      maxDocuments: 3,
      maxEmbeddings: 3,
    });

    expect(
      result.selectedItems.map(
        (item) => item.candidate.sourceId,
      ),
    ).toEqual(["offer-3", "offer-1", "offer-2"]);
  });

  it("refuse les limites négatives ou non entières", () => {
    expect(() =>
      selectCampaignRagSyncExecution([], {
        maxDocuments: -1,
        maxEmbeddings: 5,
      }),
    ).toThrow(
      "maxDocuments must be a non-negative integer.",
    );

    expect(() =>
      selectCampaignRagSyncExecution([], {
        maxDocuments: 5,
        maxEmbeddings: 1.5,
      }),
    ).toThrow(
      "maxEmbeddings must be a non-negative integer.",
    );
  });
});