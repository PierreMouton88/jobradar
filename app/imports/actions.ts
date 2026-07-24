"use server";

import { timingSafeEqual } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runApifyImportCampaign } from "@/lib/imports/run-apify-import-campaign";
import { prisma } from "@/lib/prisma";

import type { SupportedApifyActorSource } from "@/lib/sources/apify/apify-actor-adapter";

import { getManualDemoJobRadarWorkflowConfig } from "@/lib/workflows/daily-jobradar-workflow-config";

import { DailyJobRadarWorkflowAlreadyRunningError } from "@/lib/workflows/daily-jobradar-workflow-lock";

import type {
  DailyJobRadarWorkflowStatus,
  DailyJobRadarWorkflowStepResult,
} from "@/lib/workflows/run-daily-jobradar-workflow";

import { runDailyJobRadarWorkflowWithRuntime } from "@/lib/workflows/run-daily-jobradar-workflow-with-runtime";

const manualDemoWorkflowInputSchema = z.object({
  campaignId: z.string().trim().min(1, "Identifiant de campagne manquant."),
  accessCode: z.string().trim().min(1, "Le code d’accès est obligatoire."),
});

export type ManualDemoWorkflowActionResult = {
  status: DailyJobRadarWorkflowStatus;
  campaignId: string | null;
  jobOfferCount: number;
  reportFilePath: string | null;
  steps: DailyJobRadarWorkflowStepResult[];
};

function valuesAreEqual(leftValue: string, rightValue: string): boolean {
  const leftBuffer = Buffer.from(leftValue);
  const rightBuffer = Buffer.from(rightValue);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function validateManualDemoAccessCode(accessCode: string): void {
  const configuredAccessCode =
    process.env.MANUAL_DEMO_ACCESS_CODE?.trim();

  if (!configuredAccessCode) {
    throw new Error(
      "Le déclenchement manuel est indisponible : aucun code d’accès n’est configuré.",
    );
  }

  if (!valuesAreEqual(accessCode.trim(), configuredAccessCode)) {
    throw new Error("Code d’accès incorrect.");
  }
}

export async function runImportCampaignAction(input: {
  sources: SupportedApifyActorSource[];
  locations: string[];
}) {
  if (input.sources.length === 0) {
    throw new Error(
      "Sélectionne au moins une source avant de lancer la campagne.",
    );
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

export async function runManualDemoWorkflowAction(
  input: unknown,
): Promise<ManualDemoWorkflowActionResult> {
  const parsedInput = manualDemoWorkflowInputSchema.parse(input);

  const config = getManualDemoJobRadarWorkflowConfig();

  if (!config.enabled) {
    throw new Error(
      "Le workflow manuel de démonstration est désactivé en production.",
    );
  }

  validateManualDemoAccessCode(parsedInput.accessCode);

  const campaign = await prisma.importCampaign.findUnique({
    where: {
      id: parsedInput.campaignId,
    },
    select: {
      id: true,
      status: true,
      dryRun: true,
      finishedAt: true,
    },
  });

  if (!campaign) {
    throw new Error("Cette campagne n’existe pas.");
  }

  if (campaign.dryRun) {
    throw new Error(
      "Le workflow de démonstration ne peut pas utiliser une campagne dry-run.",
    );
  }

  if (campaign.status === "RUNNING" || !campaign.finishedAt) {
    throw new Error(
      "La campagne est encore en cours. Attends la fin de l’import.",
    );
  }

  if (campaign.status === "FAILED") {
    throw new Error(
      "Le workflow de démonstration ne peut pas utiliser une campagne en échec.",
    );
  }

  try {
    const result = await runDailyJobRadarWorkflowWithRuntime({
      execute: true,
      config,
      trigger: "MANUAL",
      campaignId: campaign.id,
      recentHours: 24,

      // Next.js est un processus persistant : Prisma reste connecté.
      disconnectDependencies: false,
    });

    revalidatePath("/imports");
    revalidatePath(`/imports/${campaign.id}`);
    revalidatePath("/offers");

    return {
      status: result.status,
      campaignId: result.campaignId,
      jobOfferCount: result.jobOfferIds.length,
      reportFilePath: result.report?.filePath ?? null,
      steps: result.steps,
    };
  } catch (error) {
    if (error instanceof DailyJobRadarWorkflowAlreadyRunningError) {
      throw new Error(
        "Un autre workflow est déjà en cours. Réessaie après sa fin.",
      );
    }

    throw error;
  }
}