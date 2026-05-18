import type { StoredScrapedJobOffer } from "@/lib/offers/read-scraped-offers";

export type OfferQualityIssue =
  | "missing_title"
  | "missing_company"
  | "missing_location"
  | "missing_url"
  | "short_description"
  | "unknown_contract_type"
  | "no_detected_skills";

export type OfferQualityReport = {
  issues: OfferQualityIssue[];
  score: number;
};

export function analyzeOfferQuality(
  offer: StoredScrapedJobOffer,
  detectedSkills: string[]
): OfferQualityReport {
  const issues: OfferQualityIssue[] = [];

  if (!offer.title) {
    issues.push("missing_title");
  }

  if (!offer.company) {
    issues.push("missing_company");
  }

  if (!offer.location) {
    issues.push("missing_location");
  }

  if (!offer.url) {
    issues.push("missing_url");
  }

  if (offer.description.length < 40) {
    issues.push("short_description");
  }

  if (offer.contractType.toLowerCase().includes("inconnu")) {
    issues.push("unknown_contract_type");
  }

  if (detectedSkills.length === 0) {
    issues.push("no_detected_skills");
  }

  const score = Math.max(0, 100 - issues.length * 15);

  return {
    issues,
    score,
  };
}