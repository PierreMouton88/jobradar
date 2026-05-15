import { prisma } from "../lib/prisma";
import { readScrapedOffers } from "../lib/offers/read-scraped-offers";
import {
  detectRemote,
  detectSkills,
  normalizeContractTypeForDb,
} from "../lib/offers/offer-normalization";

async function main() {
  const startedAt = new Date();
  const scrapedOffers = await readScrapedOffers();

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
    const fullText = `${offer.title} ${offer.company} ${offer.description}`;

    await prisma.jobOffer.upsert({
      where: {
        url: offer.url,
      },
      create: {
        title: offer.title,
        company: offer.company,
        location: offer.location,
        contractType: normalizeContractTypeForDb(offer.contractType),
        remote: detectRemote(offer.location),
        skills: detectSkills(fullText),
        description: offer.description,
        source: offer.source,
        url: offer.url,
        scrapedAt: new Date(offer.scrapedAt),
        scrapingRunId: scrapingRun.id,
      },
      update: {
        title: offer.title,
        company: offer.company,
        location: offer.location,
        contractType: normalizeContractTypeForDb(offer.contractType),
        remote: detectRemote(offer.location),
        skills: detectSkills(fullText),
        description: offer.description,
        source: offer.source,
        scrapedAt: new Date(offer.scrapedAt),
        scrapingRunId: scrapingRun.id,
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
        loggingError
      );
    }

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });