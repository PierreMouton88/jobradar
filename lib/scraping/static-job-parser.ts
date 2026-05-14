import * as cheerio from "cheerio";

export type ScrapedJobOffer = {
  title: string;
  company: string;
  location: string;
  contractType: string;
  description: string;
  url: string;
};
function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
function normalizeUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return "";
  }
}
function isValidOffer(offer: ScrapedJobOffer): boolean {
  return Boolean(offer.title && offer.company && offer.url);
}
export function parseStaticJobOffers(
  html: string,
  baseUrl: string,
): ScrapedJobOffer[] {
  const $ = cheerio.load(html);

  const offers: ScrapedJobOffer[] = [];

  $(".job-card").each((_, element) => {
    const title = cleanText($(element).find(".job-title").text());
    const company = cleanText($(element).find(".job-company").text());
    const location = cleanText($(element).find(".job-location").text());
    const contractType = cleanText($(element).find(".job-contract").text());
    const href = $(element).find(".job-link").attr("href") ?? "";
    const description = cleanText($(element).find(".job-description").text());
    const url = normalizeUrl(href, baseUrl);

    const offer: ScrapedJobOffer = {
      title,
      company,
      location,
      contractType,
      description,
      url,
    };

    if (isValidOffer(offer)) {
      offers.push(offer);
    }
  });

  return offers;
}
