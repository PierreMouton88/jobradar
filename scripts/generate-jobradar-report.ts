import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { mapCandidateProfileToScoringProfile } from "@/lib/search-context/map-candidate-profile-to-scoring-profile";
import { scoreJobOffer } from "@/lib/scoring/score-job-offer";
import { getActiveSearchContext } from "@/lib/search-context/get-active-search-context";
import { prioritizeJobOffer } from "@/lib/scoring/prioritize-job-offer";

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

const REAL_SOURCE_FILTER = {
  NOT: [
    { source: { contains: "static-html" } },
    { source: { contains: "fake-dynamic-jobs" } },
    { source: { contains: "jobradar.local" } },
  ],
};

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

function hasPromisingKeywords(offer: {
  title: string;
  description: string;
  skills: string[];
}): boolean {
  const text = [offer.title, offer.description, offer.skills.join(" ")]
    .join(" ")
    .toLowerCase();

  const keywords = [
    "react",
    "typescript",
    "javascript",
    "node",
    "node.js",
    "nestjs",
    "next.js",
    "fullstack",
    "full-stack",
    "backend",
    "back-end",
    "api",
    "prisma",
    "postgresql",
    "docker",
  ];

  return keywords.some((keyword) => text.includes(keyword));
}

async function main() {
  const now = new Date();

  const activeSearchContext = await getActiveSearchContext();
  const scoringProfile = activeSearchContext
    ? mapCandidateProfileToScoringProfile(activeSearchContext.candidateProfile)
    : null;

  const [
    offersCount,
    realOffersCount,
    recentOffers,
    recentRuns,
    lowQualityOffers,
    candidateOffers,
    unanalyzedOffers,
  ] = await Promise.all([
    prisma.jobOffer.count(),

    prisma.jobOffer.count({
      where: REAL_SOURCE_FILTER,
    }),

    prisma.jobOffer.findMany({
      where: REAL_SOURCE_FILTER,
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),

    prisma.scrapingRun.findMany({
      orderBy: {
        startedAt: "desc",
      },
      take: 5,
    }),

    prisma.jobOffer.findMany({
      where: {
        AND: [
          REAL_SOURCE_FILTER,
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
      where: REAL_SOURCE_FILTER,
      include: {
        analysis: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    }),

    prisma.jobOffer.findMany({
      where: {
        AND: [
          REAL_SOURCE_FILTER,
          {
            analysis: null,
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    }),
  ]);

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
    .toSorted((a, b) => b.score.percentage - a.score.percentage)
    .slice(0, 15);

  const ignoredByHeuristicOffers = scoredAndPrioritizedOffers
    .filter(({ priority }) => priority.priority === "probably_ignore")
    .toSorted((a, b) => b.score.percentage - a.score.percentage)
    .slice(0, 5);

  const offersToAnalyze = unanalyzedOffers
    .filter((offer) =>
      hasPromisingKeywords({
        title: offer.title,
        description: offer.description,
        skills: offer.skills,
      }),
    )
    .slice(0, 10);

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
  reportLines.push("- Mode rapport : veille réelle, sources de test exclues");

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
  reportLines.push(`- Offres récentes affichées : ${recentOffers.length}`);
  reportLines.push(`- Runs récents affichés : ${recentRuns.length}`);
  reportLines.push(
    `- Offres candidates à l’analyse IA : ${offersToAnalyze.length}`,
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
    reportLines.push("Aucun run récent trouvé.");
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
    reportLines.push("Aucune offre trouvée.");
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
        `- Fiche locale : http://localhost:3000/offers/${offer.id}`,
      );
      reportLines.push(`- URL source : ${offer.url}`);
      reportLines.push("");
    }
  }

  reportLines.push("");
  reportLines.push("## File de priorité");
  reportLines.push("");

  if (priorityQueueOffers.length === 0) {
    reportLines.push("Aucune offre prioritaire trouvée.");
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
          `- Fiche locale : http://localhost:3000/offers/${offer.id}`,
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
    reportLines.push("Aucune offre écartée par les heuristiques.");
  } else {
    for (const { offer, score, priority } of ignoredByHeuristicOffers) {
      reportLines.push(`### ${offer.title}`);
      reportLines.push("");
      reportLines.push(`- Priorité : ${priority.label}`);
      reportLines.push(`- Score : ${score.percentage}% — ${score.label}`);
      reportLines.push(`- Entreprise : ${offer.company}`);
      reportLines.push(`- Lieu : ${offer.location}`);
      reportLines.push(
        `- Fiche locale : http://localhost:3000/offers/${offer.id}`,
      );

      if (priority.reasons.length > 0) {
        reportLines.push("- Raisons d’écartement :");

        for (const reason of priority.reasons) {
          reportLines.push(`  - ${reason.label}`);
        }
      }

      reportLines.push("");
    }
  }

  reportLines.push("");
  reportLines.push("## Points de vigilance qualité");
  reportLines.push("");

  if (lowQualityOffers.length === 0) {
    reportLines.push("Aucune offre avec un score qualité faible.");
  } else {
    for (const offer of lowQualityOffers) {
      reportLines.push(`### ${offer.title}`);
      reportLines.push("");
      reportLines.push(`- Entreprise : ${offer.company}`);
      reportLines.push(`- Score qualité : ${offer.qualityScore}`);
      reportLines.push(
        `- Fiche locale : http://localhost:3000/offers/${offer.id}`,
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

  const reportsDir = path.join(process.cwd(), "reports");
  await fs.mkdir(reportsDir, { recursive: true });

  const reportPath = path.join(
    reportsDir,
    `jobradar-report-${formatDateForFilename(now)}.md`,
  );

  await fs.writeFile(reportPath, reportLines.join("\n"), "utf8");

  console.log(`Report generated: ${reportPath}`);
}

main()
  .catch((error) => {
    console.error("Failed to generate report:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });