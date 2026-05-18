import { prisma } from "../lib/prisma";
import { readScrapedOffersWithReport } from "@/lib/offers/read-scraped-offers";
import {
  detectRemote,
  detectSkills,
  normalizeContractTypeForDb,
} from "../lib/offers/offer-normalization";
import { analyzeOfferQuality } from "@/lib/offers/offer-quality";

function countIssuesByType(
  qualityReports: { issues: string[] }[],
): Record<string, number> {
  return qualityReports.reduce<Record<string, number>>((acc, report) => {
    for (const issue of report.issues) {
      acc[issue] = (acc[issue] ?? 0) + 1;
    }

    return acc;
  }, {});
}

async function main() {
  const startedAt = new Date();
  const scrapedOffersReport = await readScrapedOffersWithReport();
  const scrapedOffers = scrapedOffersReport.offers;

  const qualityReports = scrapedOffers.map((offer) => {
    const detectedSkills = detectSkills(`${offer.title} ${offer.description}`);

    return analyzeOfferQuality(offer, detectedSkills);
  });

  const averageQualityScore =
    qualityReports.length === 0
      ? 0
      : Math.round(
          qualityReports.reduce((sum, report) => sum + report.score, 0) /
            qualityReports.length,
        );

  const offersWithIssuesCount = qualityReports.filter(
    (report) => report.issues.length > 0,
  ).length;

  const issuesByType = countIssuesByType(qualityReports);

  console.log("Lecture des offres scrapées :");
console.log(`- ${scrapedOffersReport.rawCount} offres brutes lues`);
console.log(`- ${scrapedOffersReport.cleanedCount} offres nettoyées`);
console.log(`- ${scrapedOffersReport.uniqueCount} offres uniques`);
console.log(`- ${scrapedOffersReport.duplicateCount} doublons ignorés`);

console.log("Qualité des offres :");
console.log(`- score moyen : ${averageQualityScore}/100`);
console.log(`- ${offersWithIssuesCount} offres avec anomalies`);

for (const [issue, count] of Object.entries(issuesByType)) {
  console.log(`  - ${issue}: ${count}`);
}

console.log("Déduplication :");

for (const [reason, count] of Object.entries(
  scrapedOffersReport.duplicatesByReason,
)) {
  console.log(`- ${reason}: ${count}`);
}

  const scrapingRun = await prisma.scrapingRun.create({
    data: {
      source: "json-import",
      status: "SUCCESS",
      offersCount: scrapedOffers.length,
      startedAt,
    },
  });

  let importedCount = 0;

  for (const offer of scrapedOffers) {
  const skills = detectSkills(`${offer.title} ${offer.description}`);
  const remote = detectRemote(`${offer.location} ${offer.description}`);
  const contractType = normalizeContractTypeForDb(offer.contractType);
  const qualityReport = analyzeOfferQuality(offer, skills);

  await prisma.jobOffer.upsert({
    where: {
      url: offer.url,
    },
    create: {
      title: offer.title,
      company: offer.company,
      location: offer.location,
      contractType,
      remote,
      skills,
      description: offer.description,
      source: offer.source,
      url: offer.url,
      scrapedAt: new Date(offer.scrapedAt),
      scrapingRunId: scrapingRun.id,
      qualityScore: qualityReport.score,
      qualityIssues: qualityReport.issues,
    },
    update: {
      title: offer.title,
      company: offer.company,
      location: offer.location,
      contractType,
      remote,
      skills,
      description: offer.description,
      source: offer.source,
      scrapedAt: new Date(offer.scrapedAt),
      scrapingRunId: scrapingRun.id,
      qualityScore: qualityReport.score,
      qualityIssues: qualityReport.issues,
    },
  });

  importedCount++;
}

  await prisma.scrapingRun.update({
    where: {
      id: scrapingRun.id,
    },
    data: {
      offersCount: importedCount,
      finishedAt: new Date(),
    },
  });

  console.log(`${importedCount} offres importées en base.`);
}

main()
  .catch(async (error) => {
    console.error("Erreur pendant l'import des offres :", error);

    try {
      await prisma.scrapingRun.create({
        data: {
          source: "json-import",
          status: "FAILED",
          offersCount: 0,
          startedAt: new Date(),
          finishedAt: new Date(),
          errorMessage:
            error instanceof Error ? error.message : "Erreur inconnue",
        },
      });
    } catch (loggingError) {
      console.error(
        "Impossible d'enregistrer l'échec dans ScrapingRun :",
        loggingError,
      );
    }

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
