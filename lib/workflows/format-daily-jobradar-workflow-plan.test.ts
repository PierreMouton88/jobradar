import { describe, expect, it } from "vitest";

import { buildDailyJobRadarWorkflowPlan } from "@/lib/workflows/build-daily-jobradar-workflow-plan";
import { getDailyJobRadarWorkflowConfig } from "@/lib/workflows/daily-jobradar-workflow-config";
import { formatDailyJobRadarWorkflowPlan } from "@/lib/workflows/format-daily-jobradar-workflow-plan";

describe("formatDailyJobRadarWorkflowPlan", () => {
  it("affiche une preview sûre lorsque le workflow est désactivé", () => {
    const config = getDailyJobRadarWorkflowConfig({});
    const plan = buildDailyJobRadarWorkflowPlan(config);

    const output = formatDailyJobRadarWorkflowPlan(plan);

    expect(output).toContain("Workflow global : désactivé");
    expect(output).toContain("Étapes planifiées : 0");
    expect(output).toContain("Étapes ignorées : 5");
    expect(output).toContain("Appels externes autorisés : non");

    expect(output).toContain("Localisations Apify : 0");
    expect(output).toContain("Embeddings maximaux : 0");
    expect(output).toContain("Analyses IA maximales : 0");

    expect(output).toContain(
      "Aucun Actor Apify, appel OpenAI, embedding, email ou écriture métier n’a été exécuté.",
    );
  });

  it("affiche les étapes et limites explicitement autorisées", () => {
    const config = getDailyJobRadarWorkflowConfig({
      DAILY_WORKFLOW_ENABLED: "true",

      DAILY_APIFY_ENABLED: "true",
      DAILY_RAG_ENABLED: "true",
      DAILY_AI_ENABLED: "true",
      DAILY_EMAIL_ENABLED: "true",

      DAILY_MAX_LOCATIONS: "2",
      DAILY_MAX_OFFERS_PER_PLAN: "15",
      DAILY_MAX_RAG_DOCUMENTS: "12",
      DAILY_MAX_EMBEDDINGS: "4",
      DAILY_MAX_AI_ANALYSES: "2",
    });

    const plan = buildDailyJobRadarWorkflowPlan(config);

    const output = formatDailyJobRadarWorkflowPlan(plan);

    expect(output).toContain("Workflow global : activé");
    expect(output).toContain(
      "[PLANIFIÉE] Campagne d’import Apify",
    );
    expect(output).toContain(
      "[PLANIFIÉE] Synchronisation RAG de la campagne",
    );
    expect(output).toContain(
      "[PLANIFIÉE] Analyses IA contrôlées",
    );
    expect(output).toContain(
      "[PLANIFIÉE] Génération du rapport",
    );
    expect(output).toContain(
      "[PLANIFIÉE] Envoi du digest email",
    );

    expect(output).toContain("Localisations Apify : 2");
    expect(output).toContain(
      "Offres maximales par plan Apify : 15",
    );
    expect(output).toContain("Documents RAG maximaux : 12");
    expect(output).toContain("Embeddings maximaux : 4");
    expect(output).toContain("Analyses IA maximales : 2");
    expect(output).toContain("Emails maximaux : 1");

    expect(output).toContain("Étapes planifiées : 5");
    expect(output).toContain("Appels externes autorisés : oui");
  });

  it("explique pourquoi une étape autorisée peut être ignorée", () => {
    const config = getDailyJobRadarWorkflowConfig({
      DAILY_WORKFLOW_ENABLED: "true",
      DAILY_AI_ENABLED: "true",
      DAILY_MAX_AI_ANALYSES: "0",
    });

    const plan = buildDailyJobRadarWorkflowPlan(config);

    const output = formatDailyJobRadarWorkflowPlan(plan);

    expect(output).toContain(
      "[IGNORÉE] Analyses IA contrôlées",
    );
    expect(output).toContain(
      "Raison : limite configurée à zéro",
    );
  });
});