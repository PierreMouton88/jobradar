import { prisma } from "../lib/prisma";
import { readScrapedOffers } from "../lib/offers/read-scraped-offers";
import type { ContractType } from "@prisma/client";

function normalizeContractTypeForDb(value: string): ContractType {
  const normalizedValue = value.toLowerCase();

  if (normalizedValue.includes("cdi")) {
    return "CDI";
  }

  if (normalizedValue.includes("cdd")) {
    return "CDD";
  }

  if (normalizedValue.includes("stage")) {
    return "STAGE";
  }

  if (
    normalizedValue.includes("alternance") ||
    normalizedValue.includes("apprentissage")
  ) {
    return "ALTERNANCE";
  }

  if (
    normalizedValue.includes("freelance") ||
    normalizedValue.includes("indépendant") ||
    normalizedValue.includes("independant")
  ) {
    return "FREELANCE";
  }

  return "INCONNU";
}

function detectRemote(location: string): boolean {
  const normalizedLocation = location.toLowerCase();

  return (
    normalizedLocation.includes("remote") ||
    normalizedLocation.includes("télétravail") ||
    normalizedLocation.includes("teletravail")
  );
}

function detectSkills(text: string): string[] {
  const knownSkills = [
    "React",
    "Next.js",
    "TypeScript",
    "JavaScript",
    "Node.js",
    "NestJS",
    "PostgreSQL",
    "Prisma",
    "Tailwind",
    "Docker",
    "Git",
  ];

  const normalizedText = text.toLowerCase();

  return knownSkills.filter((skill) =>
    normalizedText.includes(skill.toLowerCase())
  );
}

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
  }

  await prisma.scrapingRun.update({
    where: {
      id: scrapingRun.id,
    },
    data: {
      finishedAt: new Date(),
    },
  });

  console.log(`${scrapedOffers.length} offres importées en base.`);
}

main()
  .catch(async (error) => {
    console.error("Erreur pendant l'import des offres :", error);

    await prisma.scrapingRun.create({
      data: {
        source: "json-import",
        status: "FAILED",
        offersCount: 0,
        startedAt: new Date(),
        finishedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Erreur inconnue",
      },
    });

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });