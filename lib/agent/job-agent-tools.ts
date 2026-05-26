import { tool } from "ai";
import { z } from "zod";

import { searchOffersForAgent } from "@/lib/agent/search-offers-for-agent";
import { getOfferDetailsForAgent } from "@/lib/agent/get-offer-details-for-agent";

export const jobAgentTools = {
  searchOffers: tool({
    description:
      "Recherche des offres d'emploi dans la base de données à partir d'une requête texte. Utilise ce tool quand l'utilisateur demande de trouver, comparer ou lister des offres.",
    inputSchema: z.object({
      query: z
        .string()
        .min(1)
        .describe("La requête de recherche, par exemple 'React junior remote'."),
    }),
    execute: async ({ query }) => {
      const results = await searchOffersForAgent(query);

      return {
        count: results.length,
        offers: results,
      };
    },
  }),

  getOfferDetails: tool({
    description:
      "Récupère les détails complets d'une offre d'emploi à partir de son identifiant. Utilise ce tool seulement si tu as déjà un offerId provenant d'un résultat de recherche.",
    inputSchema: z.object({
      offerId: z
        .string()
        .min(1)
        .describe("L'identifiant unique de l'offre à consulter."),
    }),
    execute: async ({ offerId }) => {
      const offer = await getOfferDetailsForAgent(offerId);

      if (!offer) {
        return {
          found: false,
          offer: null,
        };
      }

      return {
        found: true,
        offer,
      };
    },
  }),
};