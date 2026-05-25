import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

import {
  searchJobOffersWithRag,
  type RagSearchResult,
} from "@/lib/rag/search-job-offers";

type AnswerQuestionAboutOffersResult = {
  answer: string;
  sources: RagSearchResult[];
};

function buildSourcesContext(results: RagSearchResult[]): string {
  return results
    .map((result, index) => {
      return `SOURCE ${index + 1}
Offre ID : ${result.jobOfferId}
Titre : ${result.title}
Entreprise : ${result.company}
Lieu : ${result.location}
Contrat : ${result.contractType}
Distance vectorielle : ${result.distance}

Document :
${result.content}`;
    })
    .join("\n\n---\n\n");
}

export async function answerQuestionAboutOffers(
  question: string,
): Promise<AnswerQuestionAboutOffersResult> {
  if (!question.trim()) {
    throw new Error("Question cannot be empty.");
  }

  const sources = await searchJobOffersWithRag(question, 3);

  if (sources.length === 0) {
    return {
      answer:
        "Je n’ai trouvé aucune offre pertinente dans la base pour répondre à cette question.",
      sources: [],
    };
  }

  const context = buildSourcesContext(sources);

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: `Tu es un assistant RAG intégré à une application d'analyse d'offres d'emploi.

Tu dois répondre uniquement à partir des sources fournies.
Tu ne dois pas inventer d'offres, d'entreprises, de salaires ou de conditions.
Si les sources ne permettent pas de répondre clairement, dis-le.
Réponds en français.

Règles de citation :
- Quand tu mentionnes une offre, cite son numéro de source, par exemple [Source 1].
- Si une offre est moins pertinente, explique pourquoi à partir des informations disponibles.
- Ne cite jamais une source que tu n'as pas utilisée dans ton raisonnement.`,
    prompt: `Question utilisateur :
${question}

Sources disponibles :
${context}

Réponds de façon claire, utile et concise.`,
  });

  return {
    answer: text,
    sources,
  };
}