import { describe, expect, it } from "vitest";

import {
  cleanOptionalText,
  cleanScrapedOffer,
  cleanText,
  normalizeUrl,
} from "./offer-cleaning";

import type { StoredScrapedJobOffer } from "./read-scraped-offers";

describe("offer-cleaning", () => {
  describe("cleanText", () => {
    it("supprime les espaces inutiles", () => {
      expect(cleanText("  Développeur   React \n junior  ")).toBe(
        "Développeur React junior",
      );
    });
  });

  describe("cleanOptionalText", () => {
    it("retourne une chaîne vide pour une valeur absente", () => {
      expect(cleanOptionalText(null)).toBe("");
      expect(cleanOptionalText(undefined)).toBe("");
      expect(cleanOptionalText("")).toBe("");
    });

    it("nettoie une chaîne présente", () => {
      expect(cleanOptionalText("  Hello   world  ")).toBe("Hello world");
    });
  });

  describe("normalizeUrl", () => {
    it("supprime les paramètres UTM, le hash et le slash final", () => {
      expect(
        normalizeUrl(
          " https://example.com/jobs/react-dev/?utm_source=linkedin&utm_campaign=test#details ",
        ),
      ).toBe("https://example.com/jobs/react-dev");
    });

    it("résout une URL relative avec une base", () => {
      expect(normalizeUrl("/jobs/react-dev?utm_medium=email", "https://example.com")).toBe(
        "https://example.com/jobs/react-dev",
      );
    });

    it("retourne la valeur nettoyée si l'URL est invalide", () => {
      expect(normalizeUrl("  not a url  ")).toBe("not a url");
    });
  });

  describe("cleanScrapedOffer", () => {
    it("nettoie les champs texte d'une offre scrapée", () => {
      const offer: StoredScrapedJobOffer = {
        title: "  Développeur   React  ",
        company: "  Atelier   Nova ",
        location: "  Paris \n  ",
        contractType: "  CDI ",
        description: "  Poste   junior avec React  ",
        url: " https://example.com/jobs/react-dev/?utm_source=test#section ",
        source: "  static-html ",
        scrapedAt: "2026-05-27T10:00:00.000Z",
      };

      expect(cleanScrapedOffer(offer)).toEqual({
        title: "Développeur React",
        company: "Atelier Nova",
        location: "Paris",
        contractType: "CDI",
        description: "Poste junior avec React",
        url: "https://example.com/jobs/react-dev",
        source: "static-html",
        scrapedAt: "2026-05-27T10:00:00.000Z",
      });
    });
  });
});