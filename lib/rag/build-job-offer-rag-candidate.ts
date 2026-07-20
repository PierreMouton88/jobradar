import type { CampaignRagDocumentCandidate } from "@/lib/rag/build-campaign-rag-sync-plan";
import { buildJobOfferRagDocument } from "@/lib/rag/job-offer-rag-document";
import { RAG_EMBEDDING_MODEL_NAME } from "@/lib/rag/rag-embedding-config";

export type JobOfferForRagCandidate = {
  id: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  remote: boolean;
  skills: string[];
  description: string;
  source: string;
  url: string;
  analysis: {
    summary: string;
    requiredSkills: string[];
    niceToHaveSkills: string[];
    experienceLevel: string;
    remotePolicy: string;
    redFlags: string[];
    positiveSignals: string[];
  } | null;
};

export function buildJobOfferRagCandidate(
  offer: JobOfferForRagCandidate,
): CampaignRagDocumentCandidate {
  const content = buildJobOfferRagDocument({
    title: offer.title,
    company: offer.company,
    location: offer.location,
    contractType: offer.contractType,
    remote: offer.remote,
    skills: offer.skills,
    description: offer.description,
    analysis: offer.analysis,
  });

  return {
    sourceId: offer.id,
    title: offer.company
      ? `${offer.title} — ${offer.company}`
      : offer.title,
    content,
    metadata: {
      jobOfferId: offer.id,
      title: offer.title,
      company: offer.company,
      location: offer.location,
      contractType: offer.contractType,
      remote: offer.remote,
      source: offer.source,
      url: offer.url,
      hasAnalysis: Boolean(offer.analysis),
    },
    modelName: RAG_EMBEDDING_MODEL_NAME,
  };
}