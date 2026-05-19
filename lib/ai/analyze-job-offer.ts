import { jobAnalysisSchema, type JobAnalysis } from "./job-analysis-schema";
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";

type AnalyzeJobOfferInput = {
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
};
type AnalysisMode = "fake" | "real";

export type AnalyzeJobOfferResult = {
  analysis: JobAnalysis;
  metadata: {
    analysisMode: AnalysisMode;
    modelName?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
};

export async function analyzeJobOffer(
  offer: AnalyzeJobOfferInput,
): Promise<AnalyzeJobOfferResult> {
  const useFakeAI = process.env.USE_FAKE_AI !== "false";

  if (useFakeAI) {
    return analyzeJobOfferWithFakeAI(offer);
  }
  console.log("USE_FAKE_AI =", process.env.USE_FAKE_AI);
  return analyzeJobOfferWithRealAI(offer);
}

async function analyzeJobOfferWithFakeAI(
  offer: AnalyzeJobOfferInput,
): Promise<AnalyzeJobOfferResult> {
  const description = offer.description.toLowerCase();
  const location = offer.location.toLowerCase();
  console.log("Calling real OpenAI API...");
  const fakeAnalysis = {
    summary: `Cette offre "${offer.title}" chez ${offer.company} semble concerner un poste lié à ${
      offer.skills.length > 0
        ? offer.skills.join(", ")
        : "un profil développeur"
    }.`,
    requiredSkills: offer.skills,
    niceToHaveSkills: [],
    experienceLevel: detectFakeExperienceLevel(description),
    remotePolicy: detectFakeRemotePolicy(location, description),
    salaryMentioned:
      description.includes("€") ||
      description.includes("eur") ||
      description.includes("salaire"),
    redFlags: detectFakeRedFlags(description),
    positiveSignals: ["Analyse générée en mode fake pour tester le pipeline."],
  };

  return {
  analysis: jobAnalysisSchema.parse(fakeAnalysis),
  metadata: {
    analysisMode: "fake",
    modelName: "fake-ai",
  },
};
}

async function analyzeJobOfferWithRealAI(
  offer: AnalyzeJobOfferInput,
): Promise<AnalyzeJobOfferResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not defined.");
  }

  const { output, usage } = await generateText({
    model: openai("gpt-4.1-mini"),
    output: Output.object({
      schema: jobAnalysisSchema,
    }),
    prompt: `
Tu es un assistant d'analyse d'offres d'emploi pour un développeur web junior.

Analyse l'offre suivante et retourne une analyse structurée.

Règles :
- Ne rajoute pas de compétences qui ne sont pas présentes explicitement dans l'offre.
- Classe "internship" pour stage ou alternance si le poste est clairement en formation.
- Classe "junior" pour débutant, première expérience, ou poste explicitement junior.
- Classe "mid" pour confirmé, autonome, ou 2 à 5 ans d'expérience.
- Classe "senior" seulement pour lead, senior explicite, architecture, encadrement, ou forte responsabilité technique.
- Si le niveau d'expérience n'est pas clair, utilise "unknown".
- Si le poste est principalement en présentiel avec télétravail exceptionnel, utilise "on_site".
- Si le poste propose quelques jours de télétravail réguliers, utilise "hybrid".
- Si le poste est explicitement full remote, utilise "full_remote".
- Les red flags doivent signaler les éléments qui peuvent poser problème pour un développeur junior : autonomie rapide, délais courts, forte pression, nombreuses priorités, rythme soutenu, absence d'accompagnement, expérience élevée demandée, présentiel obligatoire.
- Les signaux positifs doivent signaler les éléments favorables : accompagnement, code review, missions progressives, stack moderne, télétravail régulier, équipe produit, formation.
- Réponds uniquement selon le schéma demandé.

Offre :
Titre : ${offer.title}
Entreprise : ${offer.company}
Localisation : ${offer.location}
Compétences détectées automatiquement : ${offer.skills.join(", ") || "aucune"}
Description :
${offer.description}
`,
  });

  console.log("AI usage:", usage);

return {
  analysis: jobAnalysisSchema.parse(output),
  metadata: {
    analysisMode: "real",
    modelName: "gpt-4.1-mini",
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
  },
};
}

function detectFakeExperienceLevel(
  description: string,
): JobAnalysis["experienceLevel"] {
  if (
    description.includes("stage") ||
    description.includes("stagiaire") ||
    description.includes("internship")
  ) {
    return "internship";
  }

  if (
    description.includes("junior") ||
    description.includes("débutant") ||
    description.includes("debutant") ||
    description.includes("première expérience") ||
    description.includes("premiere experience")
  ) {
    return "junior";
  }

  if (
    description.includes("senior") ||
    description.includes("lead") ||
    description.includes("expert")
  ) {
    return "senior";
  }

  if (
    description.includes("confirmé") ||
    description.includes("confirme") ||
    description.includes("3 ans") ||
    description.includes("4 ans") ||
    description.includes("5 ans")
  ) {
    return "mid";
  }

  return "unknown";
}

function detectFakeRemotePolicy(
  location: string,
  description: string,
): JobAnalysis["remotePolicy"] {
  const text = `${location} ${description}`;

  if (
    text.includes("full remote") ||
    text.includes("100% remote") ||
    text.includes("100 remote") ||
    text.includes("télétravail complet") ||
    text.includes("teletravail complet")
  ) {
    return "full_remote";
  }

  if (
    text.includes("hybride") ||
    text.includes("hybrid") ||
    text.includes("télétravail partiel") ||
    text.includes("teletravail partiel")
  ) {
    return "hybrid";
  }

  if (
    text.includes("présentiel") ||
    text.includes("presentiel") ||
    text.includes("sur site")
  ) {
    return "on_site";
  }

  if (
    text.includes("remote") ||
    text.includes("télétravail") ||
    text.includes("teletravail")
  ) {
    return "hybrid";
  }

  return "unknown";
}

function detectFakeRedFlags(description: string): string[] {
  const redFlags: string[] = [];

  if (
    description.includes("forte pression") ||
    description.includes("haute pression")
  ) {
    redFlags.push("Mention d’un environnement potentiellement sous pression.");
  }

  if (
    description.includes("autonome rapidement") ||
    description.includes("opérationnel rapidement") ||
    description.includes("operationnel rapidement")
  ) {
    redFlags.push(
      "Attente d’autonomie rapide, à vérifier pour un profil junior.",
    );
  }

  if (
    description.includes("nombreuses heures") ||
    description.includes("horaires étendus") ||
    description.includes("horaires etendus")
  ) {
    redFlags.push("Mention possible d’une charge horaire importante.");
  }

  return redFlags;
}
