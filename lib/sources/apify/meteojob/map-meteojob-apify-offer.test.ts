import { describe, expect, it } from "vitest";
import { mapMeteojobApifyOffer } from "./map-meteojob-apify-offer";
import type { MeteojobApifyOffer } from "@/types/sources/meteojob-apify";

describe("mapMeteojobApifyOffer", () => {
  it("mappe une offre Meteojob Apify vers ExternalJobOffer", () => {
    const rawOffer: MeteojobApifyOffer = {
      id: "53657159",
      title: "Développeur Fullstack H/F",
      company: {
        name: "ACME Tech",
      },
      locality: "Nancy",
      locations: [
        {
          name: "Nancy",
          admin1_label: "Grand Est",
          country_label: "France",
        },
      ],
      contract_types: ["CDI"],
      job_type: ["FULL_TIME"],
      description: "Vos missions<br>Développer une application React.",
      profile_description: "Votre profil<br>React et TypeScript.",
      company_description: "Entreprise tech basée dans le Grand Est.",
      benefits: "Télétravail partiel",
      publication_date: "2026-05-20T23:10:44.300Z",
      salary: {
        currency: "EUR",
        from: 35000,
        to: 42000,
        period: "ANNUM",
      },
      labels: {
        salary: {
          value: "35 000 € - 42 000 € par an",
        },
        telework: {
          value: "Télétravail partiel",
        },
        experience_level_list: [
          {
            value: "1-2 ans",
          },
        ],
        contract_type_list: [
          {
            value: "CDI",
          },
        ],
        job_type_list: [
          {
            value: "Temps Plein",
          },
        ],
      },
      url: {
        job_offer: "/jobs/53657159",
        job_offer_short: "/jobs/53657159",
        redirect: "https://example.com/apply",
      },
      from_url:
        "https://www.meteojob.com/jobs?what=d%C3%A9veloppeur&where=Grand%20Est&sorting=DATE",
    };

    const offer = mapMeteojobApifyOffer(rawOffer, {
      sourceActor: "apify/meteojob-scraper",
    });

    expect(offer).toMatchObject({
      externalId: "53657159",
      sourceProvider: "apify",
      sourceName: "meteojob",
      sourceActor: "apify/meteojob-scraper",
      title: "Développeur Fullstack H/F",
      company: "ACME Tech",
      location: "Nancy",
      contractType: "CDI",
      sourceUrl: "https://www.meteojob.com/jobs/53657159",
      applyUrl: "https://example.com/apply",
      publishedAt: "2026-05-20T23:10:44.300Z",
      remoteHint: true,
      salaryText: "35 000 € - 42 000 € par an",
      salaryMin: 35000,
      salaryMax: 42000,
      salaryCurrency: "EUR",
      rawExperienceLevel: "1-2 ans",
    });

    expect(offer.description).toContain("Vos missions");
    expect(offer.description).toContain("React et TypeScript");
    expect(offer.sourceTags).toContain("FULL_TIME");
    expect(offer.sourceTags).toContain("Temps Plein");
  });
});