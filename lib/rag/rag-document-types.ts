export type RagDocumentSourceType =
  | "job_offer"
  | "candidate_profile"
  | "profile_document";

export type RagDocumentWriteInput = {
  sourceType: RagDocumentSourceType;
  sourceId: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown> | null;
};