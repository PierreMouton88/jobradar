import fs from "node:fs/promises";
import path from "node:path";
import {
  ImportCampaignOfferAction,
  ImportCampaignStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

function getCliOptionValue(optionName: string): string | null {
  const prefix = `${optionName}=`;

  const inlineArg = process.argv.find((arg) => arg.startsWith(prefix));

  if (inlineArg) {
    return inlineArg.slice(prefix.length);
  }

  const optionIndex = process.argv.indexOf(optionName);

  if (optionIndex !== -1) {
    return process.argv[optionIndex + 1] ?? null;
  }

  return null;
}

function parseCampaignIdArg(): string {
  const rawValue = getCliOptionValue("--campaign-id");

  if (!rawValue) {
    return "latest";
  }

  const trimmedValue = rawValue.trim();

  if (trimmedValue.length === 0) {
    throw new Error("Invalid --campaign-id value: expected a non-empty value.");
  }

  return trimmedValue;
}

function formatDateForDisplay(date: Date | null): string {
  if (!date) {
    return "Non renseigné";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDateForFilename(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDuration(startedAt: Date, finishedAt: Date | null): string {
  if (!finishedAt) {
    return "En cours";
  }

  const durationMs = finishedAt.getTime() - startedAt.getTime();
  const durationSeconds = Math.max(0, Math.round(durationMs / 1000));

  if (durationSeconds < 60) {
    return `${durationSeconds}s`;
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return `${minutes}min ${seconds}s`;
}

function formatList(values: string[] | null | undefined): string {
  if (!values || values.length === 0) {
    return "Non renseigné";
  }

  return values.join(", ");
}

function formatOptionalValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Non renseigné";
  }

  if (typeof value === "boolean") {
    return value ? "oui" : "non";
  }

  return String(value);
}

function formatJsonValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "Non renseigné";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getActionLabel(action: ImportCampaignOfferAction): string {
  switch (action) {
    case ImportCampaignOfferAction.CREATED:
      return "Créée";

    case ImportCampaignOfferAction.UPDATED:
      return "Mise à jour";

    case ImportCampaignOfferAction.REJECTED_BY_RELEVANCE:
      return "Rejetée par pertinence";

    case ImportCampaignOfferAction.PREVIEW_ERROR:
      return "Erreur de preview";

    case ImportCampaignOfferAction.IMPORT_ERROR:
      return "Erreur d’import";

    default:
      return action;
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "RUNNING":
      return "En cours";

    case "SUCCESS":
      return "Succès";

    case "PARTIAL":
      return "Partiel";

    case "FAILED":
      return "Échec";

    default:
      return status;
  }
}

async function getCampaign(campaignId: string) {
  const include = {
    runs: {
      orderBy: {
        startedAt: "asc" as const,
      },
    },
    offers: {
      orderBy: {
        createdAt: "asc" as const,
      },
      include: {
        jobOffer: {
          include: {
            analysis: true,
          },
        },
      },
    },
  };

  if (campaignId === "latest") {
    return prisma.importCampaign.findFirst({
      where: {
        dryRun: false,
        status: {
          in: [ImportCampaignStatus.SUCCESS, ImportCampaignStatus.PARTIAL],
        },
      },
      orderBy: {
        startedAt: "desc",
      },
      include,
    });
  }

  return prisma.importCampaign.findUnique({
    where: {
      id: campaignId,
    },
    include,
  });
}

type ImportCampaignWithRelations = NonNullable<
  Awaited<ReturnType<typeof getCampaign>>
>;

type CampaignOfferEvent = ImportCampaignWithRelations["offers"][number];

function getEventTitle(event: CampaignOfferEvent): string {
  return event.title ?? event.jobOffer?.title ?? "Titre inconnu";
}

function getEventCompany(event: CampaignOfferEvent): string {
  return event.company ?? event.jobOffer?.company ?? "Entreprise non renseignée";
}

function getEventLocation(event: CampaignOfferEvent): string {
  return event.location ?? event.jobOffer?.location ?? "Lieu non renseigné";
}

function getEventUrl(event: CampaignOfferEvent): string {
  return event.url ?? event.jobOffer?.url ?? "URL non renseignée";
}

function pushOfferEventBlock(
  lines: string[],
  event: CampaignOfferEvent,
  index: number,
) {
  const jobOffer = event.jobOffer;

  lines.push(`### ${index}. ${getEventTitle(event)}`);
  lines.push("");
  lines.push(`- Action : ${getActionLabel(event.action)}`);
  lines.push(`- Source : ${event.source}`);
  lines.push(`- External ID : ${formatOptionalValue(event.externalId)}`);
  lines.push(`- Entreprise : ${getEventCompany(event)}`);
  lines.push(`- Lieu : ${getEventLocation(event)}`);
  lines.push(`- URL source : ${getEventUrl(event)}`);

  if (jobOffer) {
    lines.push(`- Fiche locale : http://localhost:3000/offers/${jobOffer.id}`);
    lines.push(`- Contrat : ${jobOffer.contractType}`);
    lines.push(`- Télétravail : ${jobOffer.remote ? "oui" : "non"}`);
    lines.push(`- Score qualité : ${jobOffer.qualityScore}`);

    if (jobOffer.skills.length > 0) {
      lines.push(`- Compétences détectées : ${jobOffer.skills.join(", ")}`);
    }

    if (jobOffer.qualityIssues.length > 0) {
      lines.push("- Alertes qualité :");

      for (const issue of jobOffer.qualityIssues) {
        lines.push(`  - ${issue}`);
      }
    }

    if (jobOffer.analysis) {
      lines.push("- Analyse IA : oui");
      lines.push(`  - Résumé : ${jobOffer.analysis.summary}`);
      lines.push(`  - Niveau : ${jobOffer.analysis.experienceLevel}`);
      lines.push(`  - Télétravail IA : ${jobOffer.analysis.remotePolicy}`);
      lines.push(
        `  - Salaire mentionné : ${
          jobOffer.analysis.salaryMentioned ? "oui" : "non"
        }`,
      );
      lines.push(`  - Mode : ${jobOffer.analysis.analysisMode}`);
      lines.push(`  - Modèle : ${formatOptionalValue(jobOffer.analysis.modelName)}`);
      lines.push(`  - Tokens : ${formatOptionalValue(jobOffer.analysis.totalTokens)}`);

      if (jobOffer.analysis.positiveSignals.length > 0) {
        lines.push("  - Signaux positifs :");

        for (const signal of jobOffer.analysis.positiveSignals) {
          lines.push(`    - ${signal}`);
        }
      }

      if (jobOffer.analysis.redFlags.length > 0) {
        lines.push("  - Points de vigilance :");

        for (const redFlag of jobOffer.analysis.redFlags) {
          lines.push(`    - ${redFlag}`);
        }
      }
    } else {
      lines.push("- Analyse IA : non");
    }
  } else {
    lines.push("- Fiche locale : aucune offre associée en base");
  }

  if (event.relevanceScore !== null) {
    lines.push(`- Score de pertinence préfiltre : ${event.relevanceScore}`);
  }

  if (event.relevanceReasons.length > 0) {
    lines.push("- Raisons préfiltre :");

    for (const reason of event.relevanceReasons) {
      lines.push(`  - ${reason}`);
    }
  }

  if (event.errorMessage) {
    lines.push("- Erreur :");
    lines.push(`  - ${event.errorMessage}`);
  }

  lines.push("");
}

function pushOfferEventsSection(
  lines: string[],
  title: string,
  events: CampaignOfferEvent[],
  emptyMessage: string,
) {
  lines.push(`## ${title}`);
  lines.push("");

  if (events.length === 0) {
    lines.push(emptyMessage);
    lines.push("");
    return;
  }

  events.forEach((event, index) => {
    pushOfferEventBlock(lines, event, index + 1);
  });
}

async function main() {
  const campaignId = parseCampaignIdArg();
  const campaign = await getCampaign(campaignId);

  if (!campaign) {
    throw new Error(
      campaignId === "latest"
        ? "Aucune campagne SUCCESS/PARTIAL trouvée."
        : `Campagne introuvable : ${campaignId}`,
    );
  }

  const createdEvents = campaign.offers.filter(
    (event) => event.action === ImportCampaignOfferAction.CREATED,
  );

  const updatedEvents = campaign.offers.filter(
    (event) => event.action === ImportCampaignOfferAction.UPDATED,
  );

  const rejectedEvents = campaign.offers.filter(
    (event) => event.action === ImportCampaignOfferAction.REJECTED_BY_RELEVANCE,
  );

  const previewErrorEvents = campaign.offers.filter(
    (event) => event.action === ImportCampaignOfferAction.PREVIEW_ERROR,
  );

  const importErrorEvents = campaign.offers.filter(
    (event) => event.action === ImportCampaignOfferAction.IMPORT_ERROR,
  );

  const lines: string[] = [];

  lines.push(`# Rapport complet de campagne — ${campaign.id}`);
  lines.push("");
  lines.push(`Généré le ${formatDateForDisplay(new Date())}.`);
  lines.push("");
  lines.push("## Résumé");
  lines.push("");
  lines.push(`- ID campagne : ${campaign.id}`);
  lines.push(`- Statut : ${getStatusLabel(campaign.status)}`);
  lines.push(`- Source type : ${campaign.sourceType}`);
  lines.push(`- Dry-run : ${campaign.dryRun ? "oui" : "non"}`);
  lines.push(`- Démarrage : ${formatDateForDisplay(campaign.startedAt)}`);
  lines.push(`- Fin : ${formatDateForDisplay(campaign.finishedAt)}`);
  lines.push(`- Durée : ${formatDuration(campaign.startedAt, campaign.finishedAt)}`);
  lines.push(`- Scénario : ${formatOptionalValue(campaign.searchScenarioName)}`);
  lines.push(`- Profil candidat : ${formatOptionalValue(campaign.candidateName)}`);
  lines.push(`- Sources sélectionnées : ${formatList(campaign.selectedSources)}`);
  lines.push(
    `- Localisations sélectionnées : ${formatList(campaign.selectedLocations)}`,
  );
  lines.push("");
  lines.push("## Totaux");
  lines.push("");
  lines.push(`- Runs : ${campaign.runs.length}`);
  lines.push(`- Items bruts : ${campaign.totalRawItems}`);
  lines.push(`- Offres mappées : ${campaign.totalMappedOffers}`);
  lines.push(`- Offres préparées : ${campaign.totalPreparedOffers}`);
  lines.push(`- Offres uniques : ${campaign.totalUniqueOffers}`);
  lines.push(`- Acceptées par pertinence : ${campaign.totalAcceptedByRelevance}`);
  lines.push(`- Rejetées par pertinence : ${campaign.totalRejectedByRelevance}`);
  lines.push(`- Créées : ${campaign.totalCreated}`);
  lines.push(`- Mises à jour : ${campaign.totalUpdated}`);
  lines.push(`- Doublons ignorés : ${campaign.totalDuplicatesSkipped}`);
  lines.push(`- Erreurs : ${campaign.totalErrors}`);
  lines.push("");
  lines.push("## Répartition par action");
  lines.push("");
  lines.push(`- Créées : ${createdEvents.length}`);
  lines.push(`- Mises à jour : ${updatedEvents.length}`);
  lines.push(`- Rejetées par pertinence : ${rejectedEvents.length}`);
  lines.push(`- Erreurs de preview : ${previewErrorEvents.length}`);
  lines.push(`- Erreurs d’import : ${importErrorEvents.length}`);
  lines.push("");

  if (campaign.errorMessage) {
    lines.push("## Erreur campagne");
    lines.push("");
    lines.push("```txt");
    lines.push(campaign.errorMessage);
    lines.push("```");
    lines.push("");
  }

  lines.push("## Runs de campagne");
  lines.push("");

  if (campaign.runs.length === 0) {
    lines.push("Aucun run rattaché à cette campagne.");
    lines.push("");
  } else {
    for (const run of campaign.runs) {
      lines.push(`### ${run.displayName ?? run.source} — ${run.location ?? "Lieu non renseigné"}`);
      lines.push("");
      lines.push(`- ID run : ${run.id}`);
      lines.push(`- Statut : ${getStatusLabel(run.status)}`);
      lines.push(`- Source : ${run.source}`);
      lines.push(`- Actor ID : ${formatOptionalValue(run.actorId)}`);
      lines.push(`- Source label : ${formatOptionalValue(run.sourceLabel)}`);
      lines.push(`- Limite : ${formatOptionalValue(run.limit)}`);
      lines.push(`- Démarrage : ${formatDateForDisplay(run.startedAt)}`);
      lines.push(`- Fin : ${formatDateForDisplay(run.finishedAt)}`);
      lines.push(`- Durée : ${formatDuration(run.startedAt, run.finishedAt)}`);
      lines.push(`- Items bruts : ${run.rawItems}`);
      lines.push(`- Offres mappées : ${run.mappedOffers}`);
      lines.push(`- Offres préparées : ${run.preparedOffers}`);
      lines.push(`- Offres uniques : ${run.uniqueOffers}`);
      lines.push(`- Doublons ignorés : ${run.duplicatesSkipped}`);
      lines.push(`- Preview errors : ${run.previewErrors}`);
      lines.push(
        `- Préfiltre pertinence activé : ${
          run.relevanceFilterEnabled ? "oui" : "non"
        }`,
      );
      lines.push(
        `- Score minimum pertinence : ${formatOptionalValue(
          run.relevanceFilterMinScore,
        )}`,
      );
      lines.push(`- Acceptées par pertinence : ${run.acceptedByRelevance}`);
      lines.push(`- Rejetées par pertinence : ${run.rejectedByRelevance}`);
      lines.push(`- Créées : ${run.created}`);
      lines.push(`- Mises à jour : ${run.updated}`);
      lines.push(`- Erreurs : ${run.errors}`);

      if (run.relevanceRejectionReasonCounts) {
        lines.push("- Raisons de rejet agrégées :");
        lines.push("");
        lines.push("```json");
        lines.push(formatJsonValue(run.relevanceRejectionReasonCounts));
        lines.push("```");
      }

      if (run.errorMessage) {
        lines.push("- Erreur run :");
        lines.push("");
        lines.push("```txt");
        lines.push(run.errorMessage);
        lines.push("```");
      }

      lines.push("");
    }
  }

  pushOfferEventsSection(
    lines,
    "Offres créées",
    createdEvents,
    "Aucune offre créée pendant cette campagne.",
  );

  pushOfferEventsSection(
    lines,
    "Offres mises à jour",
    updatedEvents,
    "Aucune offre mise à jour pendant cette campagne.",
  );

  pushOfferEventsSection(
    lines,
    "Offres rejetées par pertinence",
    rejectedEvents,
    "Aucune offre rejetée par le préfiltre de pertinence.",
  );

  pushOfferEventsSection(
    lines,
    "Erreurs de preview",
    previewErrorEvents,
    "Aucune erreur de preview.",
  );

  pushOfferEventsSection(
    lines,
    "Erreurs d’import",
    importErrorEvents,
    "Aucune erreur d’import.",
  );

  const reportsDir = path.join(process.cwd(), "reports");
  await fs.mkdir(reportsDir, { recursive: true });

  const reportPath = path.join(
    reportsDir,
    `import-campaign-${campaign.id}-${formatDateForFilename(new Date())}.md`,
  );

  await fs.writeFile(reportPath, lines.join("\n"), "utf8");

  console.log(`Campaign report generated: ${reportPath}`);
  console.log(`Campaign: ${campaign.id}`);
  console.log(`Created: ${createdEvents.length}`);
  console.log(`Updated: ${updatedEvents.length}`);
  console.log(`Rejected: ${rejectedEvents.length}`);
  console.log(`Preview errors: ${previewErrorEvents.length}`);
  console.log(`Import errors: ${importErrorEvents.length}`);
}

main()
  .catch((error) => {
    console.error("Failed to generate import campaign report:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });