import type { StoredScrapedJobOffer } from "@/lib/offers/read-scraped-offers";

export function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function cleanOptionalText(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return cleanText(value);
}
export function normalizeUrl(value: string, baseUrl?: string): string {
  const cleanedUrl = cleanText(value);

  if (!cleanedUrl) {
    return "";
  }

  try {
    const url = baseUrl ? new URL(cleanedUrl, baseUrl) : new URL(cleanedUrl);

    url.hash = "";

    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ];

    for (const param of trackingParams) {
      url.searchParams.delete(param);
    }

    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }

    return url.toString();
  } catch {
    return cleanedUrl;
  }
}

export function cleanScrapedOffer(
  offer: StoredScrapedJobOffer
): StoredScrapedJobOffer {
  return {
    ...offer,
    title: cleanText(offer.title),
    company: cleanText(offer.company),
    location: cleanText(offer.location),
    contractType: cleanText(offer.contractType),
    description: cleanText(offer.description),
    url: normalizeUrl(offer.url),
    source: cleanText(offer.source),
  };
}