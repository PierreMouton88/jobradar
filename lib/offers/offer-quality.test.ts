import { describe, expect, it } from "vitest";

import {
  buildOfferDeduplicationKey,
  deduplicateOffers,
  deduplicateOffersWithReport,
} from "./offer-deduplication";

import type { StoredScrapedJobOffer } from "./read-scraped-offers";

function createOffer(
  overrides: Partial<StoredScrapedJobOffer> = {},
): StoredScrapedJobOffer {
  return {
    title: "Développeur React",
    company: "Atelier Nova",
    location: "Paris",
    contractType: "CDI",
    description: "Une description suffisamment longue pour représenter une offre.",
    url: "https://example.com/jobs/react-dev",
    source: "test",
    scrapedAt: "2026-05-27T10:00:00.000Z",
    ...overrides,
  };
}

describe("offer-deduplication", () => {
  describe("buildOfferDeduplicationKey", () => {
    it("normalise le titre, l'entreprise et la localisation", () => {
      const offer = createOffer({
        title: "  Développeur   Réact  ",
        company: "  Atelier   Nova ",
        location: " Île-de-France ",
      });

      expect(buildOfferDeduplicationKey(offer)).toBe(
        "developpeur react::atelier nova::ile de france",
      );
    });
  });

  describe("deduplicateOffers", () => {
    it("supprime les doublons ayant la même URL", () => {
      const firstOffer = createOffer();
      const duplicateOffer = createOffer({
        title: "Autre titre",
        url: "https://example.com/jobs/react-dev",
      });

      expect(deduplicateOffers([firstOffer, duplicateOffer])).toEqual([
        firstOffer,
      ]);
    });

    it("supprime les doublons ayant la même clé métier", () => {
      const firstOffer = createOffer({
        url: "https://example.com/jobs/react-dev-1",
      });

      const duplicateOffer = createOffer({
        title: "developpeur react",
        company: "atelier nova",
        location: "paris",
        url: "https://example.com/jobs/react-dev-2",
      });

      expect(deduplicateOffers([firstOffer, duplicateOffer])).toEqual([
        firstOffer,
      ]);
    });

    it("conserve les offres différentes", () => {
      const firstOffer = createOffer({
        title: "Développeur React",
        url: "https://example.com/jobs/react-dev",
      });

      const secondOffer = createOffer({
        title: "Développeur Node.js",
        url: "https://example.com/jobs/node-dev",
      });

      expect(deduplicateOffers([firstOffer, secondOffer])).toEqual([
        firstOffer,
        secondOffer,
      ]);
    });
  });

  describe("deduplicateOffersWithReport", () => {
    it("retourne les offres uniques et les doublons avec leur raison", () => {
      const firstOffer = createOffer();

      const sameUrlDuplicate = createOffer({
        title: "Autre titre",
        url: "https://example.com/jobs/react-dev",
      });

      const sameBusinessKeyDuplicate = createOffer({
        url: "https://example.com/jobs/react-dev-2",
      });

      const result = deduplicateOffersWithReport([
        firstOffer,
        sameUrlDuplicate,
        sameBusinessKeyDuplicate,
      ]);

      expect(result.uniqueOffers).toEqual([firstOffer]);
      expect(result.duplicates).toEqual([
        {
          offer: sameUrlDuplicate,
          reason: "same_url",
        },
        {
          offer: sameBusinessKeyDuplicate,
          reason: "same_business_key",
        },
      ]);
    });
  });
});