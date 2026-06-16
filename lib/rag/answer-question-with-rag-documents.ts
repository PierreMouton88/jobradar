import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

import {
  searchRagDocuments,
  type RagDocumentSearchResult,
} from "@/lib/rag/search-rag-documents";

export type RagDocumentAnswerSource = {
  sourceType: string;
  sourceId: string;
  title: string;
  distance: number;
};

export type RagDocumentAnswerResult = {
  answer: string;
  sources: RagDocumentAnswerSource[];
};

function formatRagDocumentContext(result: RagDocumentSearchResult): string {
  return `Source : ${result.title}
Type : ${result.sourceType}
Source ID : ${result.sourceId}
Distance vectorielle : ${result.distance}

Contenu :
${result.content}`;
}

export async function answerQuestionWithRagDocuments(
  question: string,
  options?: {
  topK?: number;
  sourceTypes?: string[];
  retrievalQuery?: string;
}
): Promise<RagDocumentAnswerResult> {
  const trimmedQuestion = question.trim();

  if (!trimmedQuestion) {
    throw new Error("Cannot answer an empty RAG question.");
  }

  const retrievalQuery = options?.retrievalQuery?.trim() || trimmedQuestion;

const searchResults = await searchRagDocuments(retrievalQuery, {
  topK: options?.topK ?? 5,
  sourceTypes: options?.sourceTypes,
});

  if (searchResults.length === 0) {
    return {
      answer:
        "Je n’ai trouvé aucun document pertinent dans l’index RAG pour répondre à cette question.",
      sources: [],
    };
  }

  const context = searchResults.map(formatRagDocumentContext).join("\n\n---\n\n");

  const { text } = await generateText({
    model: openai("gpt-4.1-mini"),
    system: `Tu es l'assistant RAG de JobRadar IA.

Tu dois répondre uniquement à partir du contexte fourni.
Le contexte peut contenir différents types de sources : offres d'emploi, profil candidat, CV ou documents de profil.

Règles :
- Si le contexte ne contient pas l'information demandée, dis-le clairement.
- Ne prétends pas connaître des informations qui ne sont pas dans le contexte.
- Réponds en français.
- Sois concret et utile.
- Quand c'est pertinent, distingue les informations issues du profil candidat et celles issues des offres.`,
    prompt: `Question utilisateur :
${trimmedQuestion}

Contexte RAG :
${context}

Réponds à la question en t'appuyant uniquement sur ce contexte.`,
  });

  return {
    answer: text,
    sources: searchResults.map((result) => ({
      sourceType: result.sourceType,
      sourceId: result.sourceId,
      title: result.title,
      distance: result.distance,
    })),
  };
}