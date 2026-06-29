"use server";

import { revalidatePath } from "next/cache";
import { runApifyImportCampaign } from "@/lib/imports/run-apify-import-campaign";
import type { SupportedApifyActorSource } from "@/lib/sources/apify/apify-actor-adapter";

export async function runImportCampaignAction(input: {
  sources: SupportedApifyActorSource[];
  locations: string[];
}) {
  if (input.sources.length === 0) {
    throw new Error("Sélectionne au moins une source avant de lancer la campagne.");
  }

  if (input.locations.length === 0) {
    throw new Error(
      "Sélectionne au moins une localisation avant de lancer la campagne.",
    );
  }

  const report = await runApifyImportCampaign({
    dryRun: false,
    maxLocations: input.locations.length,
    limitPerPlan: 20,
    sources: input.sources,
    locations: input.locations,
  });

  revalidatePath("/imports");
  revalidatePath("/offers");
  revalidatePath("/scraping-runs");

  return report;
}