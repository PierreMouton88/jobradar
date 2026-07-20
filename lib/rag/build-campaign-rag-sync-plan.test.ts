import { describe, expect, it } from "vitest";

import {
  type CampaignRagDocumentCandidate,
  type ExistingCampaignRagDocument,
  buildCampaignRagSyncPlan,
} from "@/lib/rag/build-campaign-rag-sync-plan";

const DEFAULT_MODEL_NAME = "text-embedding-3-small";

function createCandidate(
  overrides: Partial<CampaignRagDocumentCandidate> = {},
): CampaignRagDocumentCandidate {
  return {
    sourceId: "offer-1",
    title: "Développeur TypeScript",
    content: "Contenu RAG de l'offre",
    metadata: {
      source: "linkedin",
      remote: true,
    },
    modelName: DEFAULT_MODEL_NAME,
    ...overrides,
  };
}

function createExistingDocument(
  overrides: Partial<ExistingCampaignRagDocument> = {},
): ExistingCampaignRagDocument {
  return {
    sourceId: "offer-1",
    title: "Développeur TypeScript",
    content: "Contenu RAG de l'offre",
    metadata: {
      source: "linkedin",
      remote: true,
    },
    modelName: DEFAULT_MODEL_NAME,
    ...overrides,
  };
}

describe("buildCampaignRagSyncPlan", () => {
  it("planifie une création lorsque le document RAG n’existe pas", () => {
    const candidate = createCandidate();

    const result = buildCampaignRagSyncPlan([candidate], []);

    expect(result).toEqual([
      {
        action: "CREATE",
        requiresEmbedding: true,
        reasons: ["DOCUMENT_MISSING"],
        candidate,
      },
    ]);
  });

  it("considère comme à jour un document strictement identique", () => {
    const candidate = createCandidate({
      metadata: {
        source: "linkedin",
        remote: true,
      },
    });

    const existingDocument = createExistingDocument({
      metadata: {
        remote: true,
        source: "linkedin",
      },
    });

    const result = buildCampaignRagSyncPlan(
      [candidate],
      [existingDocument],
    );

    expect(result).toEqual([
      {
        action: "UP_TO_DATE",
        requiresEmbedding: false,
        reasons: [],
        candidate,
      },
    ]);
  });

  it("demande un nouvel embedding lorsque le contenu change", () => {
    const candidate = createCandidate({
      content: "Nouveau contenu RAG",
    });

    const result = buildCampaignRagSyncPlan(
      [candidate],
      [createExistingDocument()],
    );

    expect(result[0]).toMatchObject({
      action: "UPDATE",
      requiresEmbedding: true,
      reasons: ["CONTENT_CHANGED"],
    });
  });

  it("demande un nouvel embedding lorsque le modèle change", () => {
    const candidate = createCandidate({
      modelName: "new-embedding-model",
    });

    const result = buildCampaignRagSyncPlan(
      [candidate],
      [createExistingDocument()],
    );

    expect(result[0]).toMatchObject({
      action: "UPDATE",
      requiresEmbedding: true,
      reasons: ["MODEL_CHANGED"],
    });
  });

  it("met à jour le document sans nouvel embedding si seuls le titre ou les métadonnées changent", () => {
    const candidate = createCandidate({
      title: "Développeur Fullstack TypeScript",
      metadata: {
        source: "linkedin",
        remote: false,
      },
    });

    const result = buildCampaignRagSyncPlan(
      [candidate],
      [createExistingDocument()],
    );

    expect(result[0]).toMatchObject({
      action: "UPDATE",
      requiresEmbedding: false,
      reasons: ["TITLE_CHANGED", "METADATA_CHANGED"],
    });
  });

  it("préserve l’ordre des candidates dans le plan", () => {
    const candidates = [
      createCandidate({
        sourceId: "offer-2",
        title: "Offre 2",
      }),
      createCandidate({
        sourceId: "offer-1",
        title: "Offre 1",
      }),
      createCandidate({
        sourceId: "offer-3",
        title: "Offre 3",
      }),
    ];

    const result = buildCampaignRagSyncPlan(candidates, []);

    expect(result.map((item) => item.candidate.sourceId)).toEqual([
      "offer-2",
      "offer-1",
      "offer-3",
    ]);
  });
});