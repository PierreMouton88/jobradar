import { readScrapedOffers } from "./read-scraped-offers";
import type { ContractType, JobOffer } from "@/types/job-offer";

function normalizeContractType(value: string): ContractType {
  const normalizedValue = value.trim().toLowerCase();

  switch (normalizedValue) {
    case "cdi":
      return "CDI";

    case "cdd":
      return "CDD";

    case "stage":
      return "Stage";

    case "alternance":
      return "Alternance";

    case "freelance":
      return "Freelance";

    default:
      return "Inconnu";
  }
}

function createOfferIdFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);

    const pathnameParts = parsedUrl.pathname.split("/").filter(Boolean);

    const lastPart = pathnameParts.at(-1);

    return lastPart ?? encodeURIComponent(url);
  } catch {
    return encodeURIComponent(url);
  }
}

function detectRemote(location: string): boolean {
  const normalizedLocation = location.trim().toLowerCase();

  return (
    normalizedLocation.includes("remote") ||
    normalizedLocation.includes("télétravail") ||
    normalizedLocation.includes("teletravail")
  );
}

function detectSkills(text: string): string[] {
  const normalizedText = text.toLowerCase();

  const skillsDictionary = [
    "React",
    "TypeScript",
    "JavaScript",
    "Next.js",
    "Node.js",
    "NestJS",
    "HTML",
    "CSS",
    "Tailwind",
    "PostgreSQL",
    "Prisma",
    "Docker",
    "Git",
  ];

  return skillsDictionary.filter((skill) =>
    normalizedText.includes(skill.toLowerCase()),
  );
}
export async function getOffers(): Promise<JobOffer[]> {
  const scrapedOffers = await readScrapedOffers();

  return scrapedOffers.map((offer) => ({
    id: createOfferIdFromUrl(offer.url),
    title: offer.title,
    company: offer.company,
    location: offer.location,
    contractType: normalizeContractType(offer.contractType),
    remote: detectRemote(offer.location),
    skills: detectSkills(`${offer.title} ${offer.description}`),
    description: offer.description,
    source: offer.source,
    createdAt: offer.scrapedAt,
    url: offer.url,
  }));
}

export async function getOfferById(id: string): Promise<JobOffer | undefined> {
  const offers = await getOffers();

  return offers.find((offer) => offer.id === id);
}
