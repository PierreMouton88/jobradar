import type { CampaignRagSyncPlanItem } from "@/lib/rag/build-campaign-rag-sync-plan";
import {
  type CampaignRagSyncPreview,
  getCampaignRagSyncPreview,
} from "@/lib/rag/get-campaign-rag-sync-preview";
import { generateEmbedding } from "@/lib/rag/generate-embedding";
import {
  type CampaignRagSyncExecutionSelection,
  selectCampaignRagSyncExecution,
} from "@/lib/rag/select-campaign-rag-sync-execution";
import { saveRagDocumentEmbedding } from "@/lib/rag/save-rag-document-embedding";
import { updateRagDocumentWithoutEmbedding } from "@/lib/rag/update-rag-document-without-embedding";

const DEFAULT_MAX_DOCUMENTS = 10;
const DEFAULT_MAX_EMBEDDINGS = 5;

export type ExecuteCampaignRagSyncOptions = {
  campaignId: string;
  execute?: boolean;
  maxDocuments?: number;
  maxEmbeddings?: number;
};

export type CampaignRagSyncItemExecutionStatus =
  | "PLANNED"
  | "SUCCESS"
  | "ERROR";

export type CampaignRagSyncItemExecutionResult = {
  sourceId: string;
  title: string;
  action: "CREATE" | "UPDATE";
  requiresEmbedding: boolean;
  status: CampaignRagSyncItemExecutionStatus;
  embeddingDimensions?: number;
  errorMessage?: string;
};

export type CampaignRagSyncExecutionResult = {
  mode: "DRY_RUN" | "EXECUTE";
  preview: CampaignRagSyncPreview;
  selection: CampaignRagSyncExecutionSelection;
  items: CampaignRagSyncItemExecutionResult[];
  summary: {
    plannedDocuments: number;
    plannedEmbeddings: number;
    successfulDocuments: number;
    createdDocuments: number;
    updatedDocuments: number;
    generatedEmbeddings: number;
    errors: number;
  };
};

export type CampaignRagSyncDependencies = {
  getPreview: typeof getCampaignRagSyncPreview;
  generateEmbedding: typeof generateEmbedding;
  saveEmbedding: typeof saveRagDocumentEmbedding;
  updateWithoutEmbedding:
    typeof updateRagDocumentWithoutEmbedding;
};

const DEFAULT_DEPENDENCIES: CampaignRagSyncDependencies = {
  getPreview: getCampaignRagSyncPreview,
  generateEmbedding,
  saveEmbedding: saveRagDocumentEmbedding,
  updateWithoutEmbedding:
    updateRagDocumentWithoutEmbedding,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unknown campaign RAG synchronization error.";
}

function createPlannedResult(
  item: CampaignRagSyncPlanItem,
): CampaignRagSyncItemExecutionResult {
  return {
    sourceId: item.candidate.sourceId,
    title: item.candidate.title,
    action: item.action as "CREATE" | "UPDATE",
    requiresEmbedding: item.requiresEmbedding,
    status: "PLANNED",
  };
}

export async function executeCampaignRagSync(
  options: ExecuteCampaignRagSyncOptions,
  dependencies: CampaignRagSyncDependencies = DEFAULT_DEPENDENCIES,
): Promise<CampaignRagSyncExecutionResult> {
  const execute = options.execute ?? false;
  const maxDocuments =
    options.maxDocuments ?? DEFAULT_MAX_DOCUMENTS;
  const maxEmbeddings =
    options.maxEmbeddings ?? DEFAULT_MAX_EMBEDDINGS;

  const preview = await dependencies.getPreview(
    options.campaignId,
  );

  const selection = selectCampaignRagSyncExecution(
    preview.plan,
    {
      maxDocuments,
      maxEmbeddings,
    },
  );

  if (!execute) {
    return {
      mode: "DRY_RUN",
      preview,
      selection,
      items: selection.selectedItems.map(
        createPlannedResult,
      ),
      summary: {
        plannedDocuments:
          selection.summary.selectedDocuments,
        plannedEmbeddings:
          selection.summary.selectedEmbeddings,
        successfulDocuments: 0,
        createdDocuments: 0,
        updatedDocuments: 0,
        generatedEmbeddings: 0,
        errors: 0,
      },
    };
  }

  if (preview.campaign.dryRun) {
    throw new Error(
      "Cannot execute a RAG synchronization for an import campaign created in dry-run mode.",
    );
  }

  if (
    preview.campaign.status !== "SUCCESS" &&
    preview.campaign.status !== "PARTIAL"
  ) {
    throw new Error(
      [
        "Cannot execute a RAG synchronization for campaign",
        `${preview.campaign.id} with status`,
        `${preview.campaign.status}.`,
      ].join(" "),
    );
  }

  const items: CampaignRagSyncItemExecutionResult[] = [];

  for (const item of selection.selectedItems) {
    const candidate = item.candidate;

    try {
      let embeddingDimensions: number | undefined;

      if (item.requiresEmbedding) {
        const embedding =
          await dependencies.generateEmbedding(
            candidate.content,
          );

        const saved =
          await dependencies.saveEmbedding({
            sourceType: "job_offer",
            sourceId: candidate.sourceId,
            title: candidate.title,
            content: candidate.content,
            metadata: candidate.metadata,
            embedding,
            modelName: candidate.modelName,
          });

        embeddingDimensions =
          saved.embeddingDimensions;
      } else {
        await dependencies.updateWithoutEmbedding({
          sourceType: "job_offer",
          sourceId: candidate.sourceId,
          title: candidate.title,
          content: candidate.content,
          metadata: candidate.metadata,
          modelName: candidate.modelName,
        });
      }

      items.push({
        sourceId: candidate.sourceId,
        title: candidate.title,
        action: item.action as "CREATE" | "UPDATE",
        requiresEmbedding: item.requiresEmbedding,
        status: "SUCCESS",
        embeddingDimensions,
      });
    } catch (error) {
      items.push({
        sourceId: candidate.sourceId,
        title: candidate.title,
        action: item.action as "CREATE" | "UPDATE",
        requiresEmbedding: item.requiresEmbedding,
        status: "ERROR",
        errorMessage: getErrorMessage(error),
      });
    }
  }

  return {
    mode: "EXECUTE",
    preview,
    selection,
    items,
    summary: {
      plannedDocuments:
        selection.summary.selectedDocuments,
      plannedEmbeddings:
        selection.summary.selectedEmbeddings,
      successfulDocuments: items.filter(
        (item) => item.status === "SUCCESS",
      ).length,
      createdDocuments: items.filter(
        (item) =>
          item.status === "SUCCESS" &&
          item.action === "CREATE",
      ).length,
      updatedDocuments: items.filter(
        (item) =>
          item.status === "SUCCESS" &&
          item.action === "UPDATE",
      ).length,
      generatedEmbeddings: items.filter(
        (item) =>
          item.status === "SUCCESS" &&
          item.requiresEmbedding,
      ).length,
      errors: items.filter(
        (item) => item.status === "ERROR",
      ).length,
    },
  };
}