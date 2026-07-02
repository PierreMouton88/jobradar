import { prisma } from "@/lib/prisma";
import { getActiveSearchContext } from "@/lib/search-context/get-active-search-context";
import type { PreparedExternalJobOffer } from "@/lib/offers/import-external-job-offers";
import {
  DEFAULT_EXTERNAL_OFFER_RELEVANCE_MIN_SCORE,
  scoreExternalOfferRelevance,
} from "@/lib/imports/external-offer-relevance-filter";
import { mapCandidateProfileToScoringProfile } from "@/lib/search-context/map-candidate-profile-to-scoring-profile";

type CleanupArgs = {
  apply: boolean;
  minScore: number;
  limit: number | null;
  allSources: boolean;
  sourcePrefix: string;
};

function parseArgs(): CleanupArgs {
  const args = process.argv.slice(2);

  const apply = args.includes("--apply");
  const allSources = args.includes("--all-sources");

  const minScoreArg = args.find((arg) => arg.startsWith("--min-score="));
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const sourcePrefixArg = args.find((arg) => arg.startsWith("--source-prefix="));

  const minScore = minScoreArg
    ? Number(minScoreArg.replace("--min-score=", ""))
    : DEFAULT_EXTERNAL_OFFER_RELEVANCE_MIN_SCORE;

  const limit = limitArg ? Number(limitArg.replace("--limit=", "")) : null;

  return {
    apply,
    minScore: Number.isFinite(minScore)
      ? minScore
      : DEFAULT_EXTERNAL_OFFER_RELEVANCE_MIN_SCORE,
    limit: limit !== null && Number.isFinite(limit) ? limit : null,
    allSources,
    sourcePrefix: sourcePrefixArg
      ? sourcePrefixArg.replace("--source-prefix=", "")
      : "apify:",
  };
}

function parseSource(source: string): {
  sourceProvider: string;
  sourceName: string;
  sourceActor: string | null;
} {
  const [sourceProvider = "db", sourceName = "jobOffer", ...rest] =
    source.split(":");

  return {
    sourceProvider,
    sourceName,
    sourceActor: rest.length > 0 ? rest.join(":") : null,
  };
}

function mapDbOfferToPreparedExternalOffer(offer: {
  id: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  remote: boolean;
  skills: string[];
  description: string;
  source: string;
  url: string;
  scrapedAt: Date;
  analysis: {
    experienceLevel: string;
  } | null;
}): PreparedExternalJobOffer {
  const sourceParts = parseSource(offer.source);

  return {
    externalId: offer.id,
    sourceProvider: sourceParts.sourceProvider,
    sourceName: sourceParts.sourceName,
    sourceActor: sourceParts.sourceActor,

    title: offer.title,
    company: offer.company,
    location: offer.location,
    contractType: offer.contractType,
    normalizedContractType:
      offer.contractType as PreparedExternalJobOffer["normalizedContractType"],
    description: offer.description,

    sourceUrl: offer.url,
    normalizedSourceUrl: offer.url,
    applyUrl: null,

    publishedAt: offer.scrapedAt.toISOString(),
    remoteHint: offer.remote,
    detectedRemote: offer.remote,

    salaryText: null,
    sourceTags: [],
    rawSkills: offer.skills,
    detectedSkills: offer.skills,
    rawExperienceLevel: offer.analysis?.experienceLevel ?? null,

    rawData: {
      dbOfferId: offer.id,
      cleanupSource: "jobOffer",
    },
  };
}

function countReasons(items: Array<{ reasons: string[] }>) {
  const counts = new Map<string, number>();

  for (const item of items) {
    for (const reason of item.reasons) {
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}

async function main() {
  const args = parseArgs();

  const activeSearchContext = await getActiveSearchContext();

  if (!activeSearchContext) {
    throw new Error("Aucun contexte de recherche actif trouvé.");
  }

  const profile = mapCandidateProfileToScoringProfile(
    activeSearchContext.candidateProfile,
  );

  const offers = await prisma.jobOffer.findMany({
    where: args.allSources
      ? undefined
      : {
          source: {
            startsWith: args.sourcePrefix,
          },
        },
    include: {
      analysis: {
        select: {
          experienceLevel: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: args.limit ?? undefined,
  });

  const rejected = offers
    .map((offer) => {
      const preparedOffer = mapDbOfferToPreparedExternalOffer(offer);
      const decision = scoreExternalOfferRelevance(
        preparedOffer,
        profile,
        args.minScore,
        profile.preferredLocations,
      );

      return {
        offer,
        decision,
      };
    })
    .filter((item) => !item.decision.accepted);

  const reasonCounts = countReasons(
    rejected.map((item) => ({
      reasons:
        item.decision.negativeReasons.length > 0
          ? item.decision.negativeReasons
          : item.decision.reasons,
    })),
  );

  console.log("JobRadar IA — Nettoyage offres peu pertinentes");
  console.log("---------------------------------------------");
  console.log(`Mode : ${args.apply ? "apply" : "dry-run"}`);
  console.log(`Seuil : ${args.minScore}`);
  console.log(
    `Sources : ${
      args.allSources ? "toutes" : `source startsWith "${args.sourcePrefix}"`
    }`,
  );
  console.log(`Offres inspectées : ${offers.length}`);
  console.log(`Offres à supprimer : ${rejected.length}`);

  if (reasonCounts.length > 0) {
    console.log("");
    console.log("Principales raisons :");

    for (const reasonCount of reasonCounts.slice(0, 10)) {
      console.log(`- ${reasonCount.reason}: ${reasonCount.count}`);
    }
  }

  if (rejected.length > 0) {
    console.log("");
    console.log("Aperçu des suppressions :");

    for (const item of rejected.slice(0, 20)) {
      console.log(
        `- [${item.decision.score}] ${item.offer.title} — ${item.offer.company} — ${item.offer.location}`,
      );
    }
  }

  if (!args.apply) {
    console.log("");
    console.log("Dry-run uniquement. Relance avec --apply pour supprimer.");
    return;
  }

  const idsToDelete = rejected.map((item) => item.offer.id);

  if (idsToDelete.length === 0) {
    console.log("");
    console.log("Aucune offre à supprimer.");
    return;
  }

  await prisma.$transaction([
    prisma.jobAnalysis.deleteMany({
      where: {
        jobOfferId: {
          in: idsToDelete,
        },
      },
    }),

    prisma.jobOfferEmbedding.deleteMany({
      where: {
        jobOfferId: {
          in: idsToDelete,
        },
      },
    }),

    prisma.jobOffer.deleteMany({
      where: {
        id: {
          in: idsToDelete,
        },
      },
    }),
  ]);

  console.log("");
  console.log(`${idsToDelete.length} offre(s) supprimée(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });