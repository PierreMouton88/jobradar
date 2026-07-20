import type { CampaignRagSyncPlanItem } from "@/lib/rag/build-campaign-rag-sync-plan";

export type CampaignRagSyncExecutionSkipReason =
  | "UP_TO_DATE"
  | "DOCUMENT_LIMIT_REACHED"
  | "EMBEDDING_LIMIT_REACHED";

export type SkippedCampaignRagSyncPlanItem = {
  item: CampaignRagSyncPlanItem;
  reason: CampaignRagSyncExecutionSkipReason;
};

export type CampaignRagSyncExecutionSelection = {
  selectedItems: CampaignRagSyncPlanItem[];
  skippedItems: SkippedCampaignRagSyncPlanItem[];
  summary: {
    selectedDocuments: number;
    selectedEmbeddings: number;
    selectedWithoutEmbedding: number;
    skippedUpToDate: number;
    skippedByDocumentLimit: number;
    skippedByEmbeddingLimit: number;
  };
};

export type SelectCampaignRagSyncExecutionOptions = {
  maxDocuments: number;
  maxEmbeddings: number;
};

function assertNonNegativeInteger(
  value: number,
  optionName: string,
): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(
      `${optionName} must be a non-negative integer.`,
    );
  }
}

export function selectCampaignRagSyncExecution(
  plan: CampaignRagSyncPlanItem[],
  options: SelectCampaignRagSyncExecutionOptions,
): CampaignRagSyncExecutionSelection {
  assertNonNegativeInteger(
    options.maxDocuments,
    "maxDocuments",
  );
  assertNonNegativeInteger(
    options.maxEmbeddings,
    "maxEmbeddings",
  );

  const selectedItems: CampaignRagSyncPlanItem[] = [];
  const skippedItems: SkippedCampaignRagSyncPlanItem[] = [];

  let selectedEmbeddings = 0;

  for (const item of plan) {
    if (item.action === "UP_TO_DATE") {
      skippedItems.push({
        item,
        reason: "UP_TO_DATE",
      });

      continue;
    }

    if (selectedItems.length >= options.maxDocuments) {
      skippedItems.push({
        item,
        reason: "DOCUMENT_LIMIT_REACHED",
      });

      continue;
    }

    if (
      item.requiresEmbedding &&
      selectedEmbeddings >= options.maxEmbeddings
    ) {
      skippedItems.push({
        item,
        reason: "EMBEDDING_LIMIT_REACHED",
      });

      continue;
    }

    selectedItems.push(item);

    if (item.requiresEmbedding) {
      selectedEmbeddings += 1;
    }
  }

  return {
    selectedItems,
    skippedItems,
    summary: {
      selectedDocuments: selectedItems.length,
      selectedEmbeddings,
      selectedWithoutEmbedding:
        selectedItems.length - selectedEmbeddings,
      skippedUpToDate: skippedItems.filter(
        (entry) => entry.reason === "UP_TO_DATE",
      ).length,
      skippedByDocumentLimit: skippedItems.filter(
        (entry) =>
          entry.reason === "DOCUMENT_LIMIT_REACHED",
      ).length,
      skippedByEmbeddingLimit: skippedItems.filter(
        (entry) =>
          entry.reason === "EMBEDDING_LIMIT_REACHED",
      ).length,
    },
  };
}