import type { SupportedApifyActorSource } from "@/lib/sources/apify/apify-actor-adapter";
import { listApifyActorAdapters } from "@/lib/sources/apify/apify-actor-adapters";

export type ImportSourceViewModel = {
  source: SupportedApifyActorSource;
  label: string;
  description: string;
  actorId: string;
  minLimit: number;
  defaultLimit: number;
  statusLabel: string;
};

const sourceLabels: Record<SupportedApifyActorSource, string> = {
  indeed: "Indeed",
  linkedin: "LinkedIn",
  meteojob: "Meteojob",
};

const sourceDescriptions: Record<SupportedApifyActorSource, string> = {
  indeed:
    "Source utile pour récupérer des offres ciblées depuis un scénario de recherche. L’adapter utilise le texte compact du scénario et une localisation.",
  linkedin:
    "Source techniquement intégrée. L’adapter impose une limite minimale de 10 résultats, même si une limite plus basse est demandée.",
  meteojob:
    "Source utile pour obtenir du volume. L’adapter utilise volontairement une requête large comme “développeur web”, car les requêtes trop précises ramènent peu ou pas de résultats.",
};

export function getImportSourcesViewModel(): ImportSourceViewModel[] {
  return listApifyActorAdapters().map((adapter) => {
    return {
      source: adapter.source,
      label: sourceLabels[adapter.source],
      description: sourceDescriptions[adapter.source],
      actorId: adapter.actorId,
      minLimit: adapter.minLimit,
      defaultLimit: adapter.defaultLimit,
      statusLabel: "Disponible",
    };
  });
}