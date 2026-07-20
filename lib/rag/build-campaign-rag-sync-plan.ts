export type CampaignRagSyncAction = "CREATE" | "UPDATE" | "UP_TO_DATE";

export type CampaignRagSyncReason =
  | "DOCUMENT_MISSING"
  | "CONTENT_CHANGED"
  | "TITLE_CHANGED"
  | "METADATA_CHANGED"
  | "MODEL_CHANGED";

export type CampaignRagDocumentCandidate = {
  sourceId: string;
  title: string;
  content: string;
  metadata: Record<string, unknown> | null;
  modelName: string;
};

export type ExistingCampaignRagDocument = {
  sourceId: string;
  title: string;
  content: string;
  metadata: Record<string, unknown> | null;
  modelName: string;
};

export type CampaignRagSyncPlanItem = {
  action: CampaignRagSyncAction;
  requiresEmbedding: boolean;
  reasons: CampaignRagSyncReason[];
  candidate: CampaignRagDocumentCandidate;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function areJsonValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) {
      return false;
    }

    if (left.length !== right.length) {
      return false;
    }

    return left.every((value, index) =>
      areJsonValuesEqual(value, right[index]),
    );
  }

  if (isRecord(left) || isRecord(right)) {
    if (!isRecord(left) || !isRecord(right)) {
      return false;
    }

    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();

    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    return leftKeys.every(
      (key, index) =>
        key === rightKeys[index] &&
        areJsonValuesEqual(left[key], right[key]),
    );
  }

  return false;
}

export function buildCampaignRagSyncPlan(
  candidates: CampaignRagDocumentCandidate[],
  existingDocuments: ExistingCampaignRagDocument[],
): CampaignRagSyncPlanItem[] {
  const existingDocumentsBySourceId = new Map(
    existingDocuments.map((document) => [document.sourceId, document]),
  );

  return candidates.map((candidate) => {
    const existingDocument = existingDocumentsBySourceId.get(
      candidate.sourceId,
    );

    if (!existingDocument) {
      return {
        action: "CREATE",
        requiresEmbedding: true,
        reasons: ["DOCUMENT_MISSING"],
        candidate,
      };
    }

    const reasons: CampaignRagSyncReason[] = [];

    if (candidate.content !== existingDocument.content) {
      reasons.push("CONTENT_CHANGED");
    }

    if (candidate.title !== existingDocument.title) {
      reasons.push("TITLE_CHANGED");
    }

    if (
      !areJsonValuesEqual(candidate.metadata, existingDocument.metadata)
    ) {
      reasons.push("METADATA_CHANGED");
    }

    if (candidate.modelName !== existingDocument.modelName) {
      reasons.push("MODEL_CHANGED");
    }

    if (reasons.length === 0) {
      return {
        action: "UP_TO_DATE",
        requiresEmbedding: false,
        reasons: [],
        candidate,
      };
    }

    return {
      action: "UPDATE",
      requiresEmbedding:
        reasons.includes("CONTENT_CHANGED") ||
        reasons.includes("MODEL_CHANGED"),
      reasons,
      candidate,
    };
  });
}