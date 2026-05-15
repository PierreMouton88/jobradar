import { prisma } from "@/lib/prisma";
import type { JobOffer } from "@/types/job-offer";
import { mapContractTypeFromDb } from "@/lib/offers/offer-normalization";

export async function getOffers(): Promise<JobOffer[]> {
  const offers = await prisma.jobOffer.findMany({
    orderBy: {
      scrapedAt: "desc",
    },
  });

  return offers.map((offer) => ({
    id: offer.id,
    title: offer.title,
    company: offer.company,
    location: offer.location,
    contractType: mapContractTypeFromDb(offer.contractType),
    remote: offer.remote,
    skills: offer.skills,
    description: offer.description,
    source: offer.source,
    url: offer.url,
    createdAt: offer.createdAt.toISOString(),
  }));
}

export async function getOfferById(id: string): Promise<JobOffer | null> {
  const offer = await prisma.jobOffer.findUnique({
    where: {
      id,
    },
  });

  if (!offer) {
    return null;
  }

  return {
    id: offer.id,
    title: offer.title,
    company: offer.company,
    location: offer.location,
    contractType: mapContractTypeFromDb(offer.contractType),
    remote: offer.remote,
    skills: offer.skills,
    description: offer.description,
    source: offer.source,
    url: offer.url,
    createdAt: offer.createdAt.toISOString(),
  };
}