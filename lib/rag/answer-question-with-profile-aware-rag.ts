import {
  answerQuestionWithRagDocuments,
  type RagDocumentAnswerResult,
} from "@/lib/rag/answer-question-with-rag-documents";
import { buildProfileAwareRagQuery } from "@/lib/rag/build-profile-aware-rag-query";
import { mapActiveSearchContextToCandidateProfileRagInput } from "@/lib/rag/map-active-search-context-to-candidate-profile-rag-input";
import { getActiveSearchContext } from "@/lib/search-context/get-active-search-context";

export async function answerQuestionWithProfileAwareRag(
  question: string,
  options?: {
    topK?: number;
    sourceTypes?: string[];
  },
): Promise<RagDocumentAnswerResult> {
  const context = await getActiveSearchContext();

  if (!context) {
    throw new Error(
      "Aucun contexte de recherche actif trouvé. Vérifie le seed CandidateProfile/SearchScenario.",
    );
  }

  const profile = mapActiveSearchContextToCandidateProfileRagInput(context);
  const retrievalQuery = buildProfileAwareRagQuery(question, profile);

  return answerQuestionWithRagDocuments(question, {
    topK: options?.topK,
    sourceTypes: options?.sourceTypes,
    retrievalQuery,
  });
}