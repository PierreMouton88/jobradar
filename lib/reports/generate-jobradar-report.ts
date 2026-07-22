import fs from "node:fs/promises";
import path from "node:path";
import {
  ImportCampaignOfferAction,
  ImportCampaignStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mapCandidateProfileToScoringProfile } from "@/lib/search-context/map-candidate-profile-to-scoring-profile";
import { scoreJobOffer } from "@/lib/scoring/score-job-offer";
import { getActiveSearchContext } from "@/lib/search-context/get-active-search-context";
import { prioritizeJobOffer } from "@/lib/scoring/prioritize-job-offer";
import {
  buildJobRadarOfferUrl,
  buildJobRadarReportPath,
  type JobRadarReportScope,
} from "@/lib/reports/jobradar-report-output";

type ScoringContractType =
  | "CDI"
  | "CDD"
  | "Stage"
  | "Alternance"
  | "Freelance"
  | "Inconnu";

type ScoringExperienceLevel =
  | "unknown"
  | "internship"
  | "junior"
  | "mid"
  | "senior";

type ScoringRemotePolicy = "unknown" | "on_site" | "hybrid" | "full_remote";

type ReportCampaignScope = NonNullable<
  Awaited<ReturnType<typeof getCampaignReportScope>>
>;

export type GenerateJobRadarReportOptions = {
  scope?: JobRadarReportScope;
  now?: Date;
  reportsDir?: string;
  appBaseUrl?: string | null;
};

export type GeneratedJobRadarReport = {
  filename: string;
  filePath: string;
  content: string;
  modifiedAt: Date;

  scope: JobRadarReportScope;
  campaignId: string | null;
  scopedOffersCount: number;
};

const REAL_SOURCE_FILTER: Prisma.JobOfferWhereInput = {
  NOT: [
    { source: { contains: "static-html" } },
    { source: { contains: "fake-dynamic-jobs" } },
    { source: { contains: "jobradar.local" } },
  ],
};

function getSinceDate(now: Date, recentHours: number | null): Date | null {
  if (recentHours === null) {
    return null;
  }

  return new Date(now.getTime() - recentHours * 60 * 60 * 1000);
}

function buildReportScopeFilter(
  sinceDate: Date | null,
  campaignJobOfferIds: string[] | null,
): Prisma.JobOfferWhereInput {
  if (campaignJobOfferIds) {
    return {
      AND: [
        REAL_SOURCE_FILTER,
        {
          id: {
            in: campaignJobOfferIds,
          },
        },
      ],
    };
  }

  if (!sinceDate) {
    return REAL_SOURCE_FILTER;
  }

  return {
    AND: [
      REAL_SOURCE_FILTER,
      {
        createdAt: {
          gte: sinceDate,
        },
      },
    ],
  };
}

function buildRunScopeFilter(
  sinceDate: Date | null,
): Prisma.ScrapingRunWhereInput {
  if (!sinceDate) {
    return {};
  }

  return {
    startedAt: {
      gte: sinceDate,
    },
  };
}

function formatReportScope(sinceDate: Date | null): string {
  if (!sinceDate) {
    return "veille réelle globale, sources de test exclues";
  }

  return `veille réelle récente depuis ${formatDateForDisplay(
    sinceDate,
  )}, sources de test exclues`;
}

function formatCampaignReportScope(scope: ReportCampaignScope): string {
  return `dernier batch d’import ${scope.campaign.id} lancé le ${formatDateForDisplay(
    scope.campaign.startedAt,
  )}`;
}

function formatDateForFilename(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDateForDisplay(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function mapContractTypeForScoring(contractType: string): ScoringContractType {
  switch (contractType) {
    case "CDI":
      return "CDI";

    case "CDD":
      return "CDD";

    case "STAGE":
    case "Stage":
      return "Stage";

    case "ALTERNANCE":
    case "Alternance":
      return "Alternance";

    case "FREELANCE":
    case "Freelance":
      return "Freelance";

    default:
      return "Inconnu";
  }
}

function mapExperienceLevelForScoring(
  experienceLevel: string,
): ScoringExperienceLevel {
  switch (experienceLevel) {
    case "internship":
    case "junior":
    case "mid":
    case "senior":
    case "unknown":
      return experienceLevel;

    default:
      return "unknown";
  }
}

function mapRemotePolicyForScoring(remotePolicy: string): ScoringRemotePolicy {
  switch (remotePolicy) {
    case "on_site":
    case "hybrid":
    case "full_remote":
    case "unknown":
      return remotePolicy;

    default:
      return "unknown";
  }
}

function uniqueStrings(values: Array<string | null>): string[] {
  return Array.from(
    new Set(
      values.filter((value): value is string => typeof value === "string"),
    ),
  );
}

async function getCampaignReportScope(campaignIdArg: string | null) {
  if (!campaignIdArg) {
    return null;
  }

  const include = {
    runs: {
      orderBy: {
        startedAt: "desc" as const,
      },
    },
    offers: {
      where: {
        jobOfferId: {
          not: null,
        },
        action: {
          in: [
            ImportCampaignOfferAction.CREATED,
            ImportCampaignOfferAction.UPDATED,
          ],
        },
      },
      select: {
        jobOfferId: true,
      },
    },
  };

  const campaign =
    campaignIdArg === "latest"
      ? await prisma.importCampaign.findFirst({
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
        })
      : await prisma.importCampaign.findUnique({
          where: {
            id: campaignIdArg,
          },
          include,
        });

  if (!campaign) {
    throw new Error(
      campaignIdArg === "latest"
        ? "Aucune campagne d’import SUCCESS/PARTIAL trouvée. Lance d’abord une campagne depuis /imports."
        : `Campagne d’import introuvable : ${campaignIdArg}`,
    );
  }

  const jobOfferIds = uniqueStrings(
    campaign.offers.map((campaignOffer) => campaignOffer.jobOfferId),
  );

  return {
    campaign,
    jobOfferIds,
  };
}

export async function generateJobRadarReport(
  options: GenerateJobRadarReportOptions = {},
): Promise<GeneratedJobRadarReport> {
  const now = options.now ?? new Date();
  const requestedScope = options.scope ?? {
    type: "global" as const,
  };

  const campaignIdArg =
    requestedScope.type === "campaign" ? requestedScope.campaignId : null;

  const campaignScope = await getCampaignReportScope(campaignIdArg);

  const recentHours =
    campaignScope === null && requestedScope.type === "recent-hours"
      ? requestedScope.recentHours
      : null;

  if (
    recentHours !== null &&
    (!Number.isFinite(recentHours) || recentHours <= 0)
  ) {
    throw new Error(
      `Invalid recentHours value: "${recentHours}". Expected a positive number.`,
    );
  }

  const sinceDate = campaignScope ? null : getSinceDate(now, recentHours);

  const reportScopeFilter = buildReportScopeFilter(
    sinceDate,
    campaignScope?.jobOfferIds ?? null,
  );
  const runScopeFilter = buildRunScopeFilter(sinceDate);

  const activeSearchContext = await getActiveSearchContext();
  const scoringProfile = activeSearchContext
    ? mapCandidateProfileToScoringProfile(activeSearchContext.candidateProfile)
    : null;

  const [
    offersCount,
    realOffersCount,
    reportScopeOffersCount,
    recentOffers,
    scrapingRuns,
    lowQualityOffers,
    candidateOffers,
  ] = await Promise.all([
    prisma.jobOffer.count(),

    prisma.jobOffer.count({
      where: REAL_SOURCE_FILTER,
    }),

    prisma.jobOffer.count({
      where: reportScopeFilter,
    }),

    prisma.jobOffer.findMany({
      where: reportScopeFilter,
      include: {
        analysis: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),

    campaignScope
      ? Promise.resolve([])
      : prisma.scrapingRun.findMany({
          where: runScopeFilter,
          orderBy: {
            startedAt: "desc",
          },
          take: 5,
        }),

    prisma.jobOffer.findMany({
      where: {
        AND: [
          reportScopeFilter,
          {
            qualityScore: {
              lt: 70,
            },
          },
        ],
      },
      orderBy: {
        qualityScore: "asc",
      },
      take: 10,
    }),

    prisma.jobOffer.findMany({
      where: reportScopeFilter,
      include: {
        analysis: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    }),
  ]);

  const recentRuns = campaignScope
    ? campaignScope.campaign.runs.map((run) => ({
        source: run.sourceLabel ?? run.source,
        status: run.status,
        offersCount: run.created + run.updated,
        startedAt: run.startedAt,
        errorMessage: run.errorMessage,
      }))
    : scrapingRuns;

  const scoredAndPrioritizedOffers = scoringProfile
    ? candidateOffers.map((offer) => {
        const analysisForScore = offer.analysis
          ? {
              experienceLevel: mapExperienceLevelForScoring(
                offer.analysis.experienceLevel,
              ),
              remotePolicy: mapRemotePolicyForScoring(
                offer.analysis.remotePolicy,
              ),
              salaryMentioned: offer.analysis.salaryMentioned,
              redFlags: offer.analysis.redFlags,
              positiveSignals: offer.analysis.positiveSignals,
            }
          : null;

        const scorableOffer = {
          title: offer.title,
          skills: offer.skills,
          contractType: mapContractTypeForScoring(offer.contractType),
          location: offer.location,
          qualityScore: offer.qualityScore,
          analysis: analysisForScore,
        };

        const score = scoreJobOffer(scorableOffer, scoringProfile);
        const priority = prioritizeJobOffer(scorableOffer, score);

        return {
          offer,
          score,
          priority,
        };
      })
    : [];

  const priorityQueueOffers = scoredAndPrioritizedOffers
    .filter(({ priority }) =>
      ["very_promising", "interesting", "needs_ai_analysis", "watch"].includes(
        priority.priority,
      ),
    )
    .sort((a, b) => b.score.percentage - a.score.percentage)
    .slice(0, 15);

  const ignoredByHeuristicOffers = scoredAndPrioritizedOffers
    .filter(({ priority }) => priority.priority === "probably_ignore")
    .sort((a, b) => b.score.percentage - a.score.percentage)
    .slice(0, 5);

  const aiAnalysisQueueOffers = priorityQueueOffers.filter(
    ({ priority }) => priority.priority === "needs_ai_analysis",
  );
  const priorityGroups = [
    {
      priority: "very_promising",
      title: "Très prometteuses",
    },
    {
      priority: "interesting",
      title: "Intéressantes",
    },
    {
      priority: "needs_ai_analysis",
      title: "À analyser avec IA",
    },
    {
      priority: "watch",
      title: "À surveiller",
    },
  ] as const;

  const reportLines: string[] = [];

  reportLines.push(`# Rapport JobRadar — ${formatDateForFilename(now)}`);
  reportLines.push("");
  reportLines.push("## Résumé");
  reportLines.push("");

  if (campaignScope) {
    reportLines.push(
      `- Mode rapport : ${formatCampaignReportScope(campaignScope)}`,
    );
    reportLines.push(`- Campagne d’import : ${campaignScope.campaign.id}`);
    reportLines.push(`- Statut campagne : ${campaignScope.campaign.status}`);
    reportLines.push(
      `- Source campagne : ${campaignScope.campaign.sourceType}`,
    );
    reportLines.push(
      `- Démarrage campagne : ${formatDateForDisplay(campaignScope.campaign.startedAt)}`,
    );

    if (campaignScope.campaign.finishedAt) {
      reportLines.push(
        `- Fin campagne : ${formatDateForDisplay(campaignScope.campaign.finishedAt)}`,
      );
    }

    reportLines.push(
      `- Runs de campagne : ${campaignScope.campaign.runs.length}`,
    );
    reportLines.push(
      `- Offres créées dans la campagne : ${campaignScope.campaign.totalCreated}`,
    );
    reportLines.push(
      `- Offres mises à jour dans la campagne : ${campaignScope.campaign.totalUpdated}`,
    );
    reportLines.push(
      `- Offres rejetées par pertinence : ${campaignScope.campaign.totalRejectedByRelevance}`,
    );
  } else {
    reportLines.push(`- Mode rapport : ${formatReportScope(sinceDate)}`);
  }

  if (recentHours !== null) {
    reportLines.push(`- Fenêtre analysée : dernières ${recentHours}h`);
  }

  if (activeSearchContext) {
    reportLines.push(
      `- Profil candidat : ${activeSearchContext.candidateProfile.name} — ${activeSearchContext.candidateProfile.headline}`,
    );
    reportLines.push(
      `- Scénario de recherche : ${activeSearchContext.searchScenario.name}`,
    );
    reportLines.push(
      `- Zones ciblées : ${activeSearchContext.searchScenario.locations.join(", ")}`,
    );
    reportLines.push(
      `- Mots-clés scénario : ${activeSearchContext.searchScenario.keywords.join(", ")}`,
    );
  } else {
    reportLines.push("- Profil candidat : aucun profil actif trouvé");
    reportLines.push("- Scénario de recherche : aucun scénario actif trouvé");
  }

  reportLines.push(`- Offres totales en base : ${offersCount}`);
  reportLines.push(`- Offres réelles en base : ${realOffersCount}`);
  reportLines.push(
    `- Offres dans le périmètre du rapport : ${reportScopeOffersCount}`,
  );
  reportLines.push(`- Offres récentes affichées : ${recentOffers.length}`);
  reportLines.push(`- Runs affichés : ${recentRuns.length}`);
  reportLines.push(
    `- Offres candidates à l’analyse IA : ${aiAnalysisQueueOffers.length}`,
  );
  reportLines.push(
    `- Offres dans la file de priorité : ${priorityQueueOffers.length}`,
  );
  reportLines.push(
    `- Offres écartées par heuristique : ${ignoredByHeuristicOffers.length}`,
  );

  reportLines.push("");
  reportLines.push("## Derniers imports");
  reportLines.push("");

  if (recentRuns.length === 0) {
    reportLines.push(
      campaignScope
        ? "Aucun run trouvé pour cette campagne."
        : sinceDate
          ? "Aucun run trouvé dans la fenêtre analysée."
          : "Aucun run récent trouvé.",
    );
  } else {
    for (const run of recentRuns) {
      reportLines.push(
        `- ${run.source} — ${run.status} — ${run.offersCount} offre(s) — ${formatDateForDisplay(run.startedAt)}`,
      );

      if (run.errorMessage) {
        reportLines.push(`  - Erreur : ${run.errorMessage}`);
      }
    }
  }

  reportLines.push("");
  reportLines.push("## Offres récentes à regarder");
  reportLines.push("");

  if (recentOffers.length === 0) {
    reportLines.push(
      campaignScope
        ? "Aucune offre créée ou mise à jour dans cette campagne."
        : sinceDate
          ? "Aucune offre trouvée dans la fenêtre analysée."
          : "Aucune offre trouvée.",
    );
  } else {
    for (const offer of recentOffers) {
      reportLines.push(`### ${offer.title}`);
      reportLines.push("");
      reportLines.push(`- Entreprise : ${offer.company}`);
      reportLines.push(`- Lieu : ${offer.location}`);
      reportLines.push(`- Source : ${offer.source}`);
      reportLines.push(`- Contrat : ${offer.contractType}`);
      reportLines.push(`- Télétravail : ${offer.remote ? "oui" : "non"}`);
      reportLines.push(
        `- Fiche locale : ${buildJobRadarOfferUrl({
          jobOfferId: offer.id,
          appBaseUrl: options.appBaseUrl,
        })}`,
      );
      reportLines.push(`- URL source : ${offer.url}`);
      reportLines.push("");
    }
  }

  reportLines.push("");
  reportLines.push("## File de priorité");
  reportLines.push("");

  if (priorityQueueOffers.length === 0) {
    reportLines.push(
      campaignScope
        ? "Aucune offre prioritaire trouvée dans cette campagne."
        : sinceDate
          ? "Aucune offre prioritaire trouvée dans la fenêtre analysée."
          : "Aucune offre prioritaire trouvée.",
    );
  } else {
    for (const group of priorityGroups) {
      const groupOffers = priorityQueueOffers.filter(
        ({ priority }) => priority.priority === group.priority,
      );

      if (groupOffers.length === 0) {
        continue;
      }

      reportLines.push(`### ${group.title}`);
      reportLines.push("");

      for (const { offer, score, priority } of groupOffers) {
        reportLines.push(`#### ${offer.title}`);
        reportLines.push("");
        reportLines.push(`- Priorité : ${priority.label}`);
        reportLines.push(`- Score : ${score.percentage}% — ${score.label}`);
        reportLines.push(`- Entreprise : ${offer.company}`);
        reportLines.push(`- Lieu : ${offer.location}`);
        reportLines.push(`- Source : ${offer.source}`);
        reportLines.push(`- Contrat : ${offer.contractType}`);
        reportLines.push(`- Télétravail : ${offer.remote ? "oui" : "non"}`);
        reportLines.push(
          `- Fiche locale : ${buildJobRadarOfferUrl({
            jobOfferId: offer.id,
            appBaseUrl: options.appBaseUrl,
          })}`,
        );
        reportLines.push(`- URL source : ${offer.url}`);

        if (priority.reasons.length > 0) {
          reportLines.push("- Raisons de priorité :");

          for (const reason of priority.reasons) {
            reportLines.push(`  - ${reason.label}`);
          }
        }

        reportLines.push("");
      }
    }
  }

  reportLines.push("");
  reportLines.push("## Offres écartées par heuristique");
  reportLines.push("");

  if (ignoredByHeuristicOffers.length === 0) {
    reportLines.push(
      campaignScope
        ? "Aucune offre écartée par les heuristiques dans cette campagne."
        : sinceDate
          ? "Aucune offre écartée par les heuristiques dans la fenêtre analysée."
          : "Aucune offre écartée par les heuristiques.",
    );
  } else {
    for (const { offer, score, priority } of ignoredByHeuristicOffers) {
      reportLines.push(`### ${offer.title}`);
      reportLines.push("");
      reportLines.push(`- Priorité : ${priority.label}`);
      reportLines.push(`- Score : ${score.percentage}% — ${score.label}`);
      reportLines.push(`- Entreprise : ${offer.company}`);
      reportLines.push(`- Lieu : ${offer.location}`);
      reportLines.push(
        `- Fiche locale : ${buildJobRadarOfferUrl({
          jobOfferId: offer.id,
          appBaseUrl: options.appBaseUrl,
        })}`,
      );

      if (priority.reasons.length > 0) {
        reportLines.push("- Raisons d’écartement :");

        for (const reason of priority.reasons) {
          reportLines.push(`  - ${reason.label}`);
        }
      }
      if (offer.analysis) {
        reportLines.push(`- Analyse IA : oui`);
        reportLines.push(`- Résumé IA : ${offer.analysis.summary}`);
        reportLines.push(`- Niveau IA : ${offer.analysis.experienceLevel}`);
        reportLines.push(`- Télétravail IA : ${offer.analysis.remotePolicy}`);
        reportLines.push(
          `- Salaire mentionné IA : ${offer.analysis.salaryMentioned ? "oui" : "non"}`,
        );
        reportLines.push(`- Mode analyse IA : ${offer.analysis.analysisMode}`);
        reportLines.push(`- Modèle IA : ${offer.analysis.modelName}`);
        reportLines.push(`- Tokens IA : ${offer.analysis.totalTokens}`);

        if (offer.analysis.positiveSignals.length > 0) {
          reportLines.push(
            `- Signaux positifs IA : ${offer.analysis.positiveSignals.join(" ; ")}`,
          );
        }

        if (offer.analysis.redFlags.length > 0) {
          reportLines.push(
            `- Points de vigilance IA : ${offer.analysis.redFlags.join(" ; ")}`,
          );
        }
      } else {
        reportLines.push(`- Analyse IA : non`);
      }
      reportLines.push("");
    }
  }

  reportLines.push("");
  reportLines.push("## Points de vigilance qualité");
  reportLines.push("");

  if (lowQualityOffers.length === 0) {
    reportLines.push(
      campaignScope
        ? "Aucune offre avec un score qualité faible dans cette campagne."
        : sinceDate
          ? "Aucune offre avec un score qualité faible dans la fenêtre analysée."
          : "Aucune offre avec un score qualité faible.",
    );
  } else {
    for (const offer of lowQualityOffers) {
      reportLines.push(`### ${offer.title}`);
      reportLines.push("");
      reportLines.push(`- Entreprise : ${offer.company}`);
      reportLines.push(`- Score qualité : ${offer.qualityScore}`);
      reportLines.push(
        `- Fiche locale : ${buildJobRadarOfferUrl({
          jobOfferId: offer.id,
          appBaseUrl: options.appBaseUrl,
        })}`,
      );

      if (offer.qualityIssues.length > 0) {
        reportLines.push("- Problèmes détectés :");

        for (const issue of offer.qualityIssues) {
          reportLines.push(`  - ${issue}`);
        }
      }

      reportLines.push("");
    }
  }

  const resolvedScope: JobRadarReportScope = campaignScope
    ? {
        type: "campaign",
        campaignId: campaignScope.campaign.id,
      }
    : recentHours !== null
      ? {
          type: "recent-hours",
          recentHours,
        }
      : {
          type: "global",
        };

  const filePath = buildJobRadarReportPath({
    reportsDir: options.reportsDir,
    now,
    scope: resolvedScope,
  });

  const filename = path.basename(filePath);
  const content = reportLines.join("\n");

  await fs.mkdir(path.dirname(filePath), {
    recursive: true,
  });

  await fs.writeFile(filePath, content, "utf8");

  const stats = await fs.stat(filePath);

  return {
    filename,
    filePath,
    content,
    modifiedAt: stats.mtime,

    scope: resolvedScope,
    campaignId: campaignScope?.campaign.id ?? null,
    scopedOffersCount: reportScopeOffersCount,
  };
}
