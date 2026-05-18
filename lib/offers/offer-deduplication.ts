import type { StoredScrapedJobOffer } from "@/lib/offers/read-scraped-offers";

export function deduplicateOffers(
  offers: StoredScrapedJobOffer[]
): StoredScrapedJobOffer[] {
  const seenUrls = new Set<string>();
  const seenKeys = new Set<string>();
  const uniqueOffers: StoredScrapedJobOffer[] = [];

  for (const offer of offers) {
    const deduplicationKey = buildOfferDeduplicationKey(offer);

    const hasSameUrl = seenUrls.has(offer.url);
    const hasSameBusinessKey = seenKeys.has(deduplicationKey);

    if (hasSameUrl || hasSameBusinessKey) {
      continue;
    }

    seenUrls.add(offer.url);
    seenKeys.add(deduplicationKey);
    uniqueOffers.push(offer);
  }

  return deduplicateOffersWithReport(offers).uniqueOffers;
}

function normalizeForDeduplication(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildOfferDeduplicationKey(
  offer: StoredScrapedJobOffer
): string {
  const title = normalizeForDeduplication(offer.title);
  const company = normalizeForDeduplication(offer.company);
  const location = normalizeForDeduplication(offer.location);

  return `${title}::${company}::${location}`;
}


export type DeduplicationReason = "same_url" | "same_business_key";

export type DeduplicationDuplicate = {
  offer: StoredScrapedJobOffer;
  reason: DeduplicationReason;
};

export type DeduplicationResult = {
  uniqueOffers: StoredScrapedJobOffer[];
  duplicates: DeduplicationDuplicate[];
};


export function deduplicateOffersWithReport(
  offers: StoredScrapedJobOffer[]
): DeduplicationResult {
  const seenUrls = new Set<string>();
  const seenKeys = new Set<string>();
  const uniqueOffers: StoredScrapedJobOffer[] = [];
  const duplicates: DeduplicationDuplicate[] = [];

  for (const offer of offers) {
    const deduplicationKey = buildOfferDeduplicationKey(offer);

    const hasSameUrl = seenUrls.has(offer.url);
    const hasSameBusinessKey = seenKeys.has(deduplicationKey);

    if (hasSameUrl) {
      duplicates.push({
        offer,
        reason: "same_url",
      });
      continue;
    }

    if (hasSameBusinessKey) {
      duplicates.push({
        offer,
        reason: "same_business_key",
      });
      continue;
    }

    seenUrls.add(offer.url);
    seenKeys.add(deduplicationKey);
    uniqueOffers.push(offer);
  }

  return {
    uniqueOffers,
    duplicates,
  };
}