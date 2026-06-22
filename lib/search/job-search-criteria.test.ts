import { describe, expect, it } from "vitest";
import {
    buildCompactSearchText,
  buildSearchText,
  mapSearchScenarioToJobSearchCriteria,
} from "./job-search-criteria";

describe("mapSearchScenarioToJobSearchCriteria", () => {
  it("nettoie les tableaux du scénario de recherche", () => {
    const criteria = mapSearchScenarioToJobSearchCriteria({
      targetRoles: [" Développeur fullstack ", "Développeur fullstack", ""],
      keywords: ["React", " TypeScript ", "React"],
      locations: ["Nancy", "", " Metz "],
      remotePolicies: ["hybrid", "hybrid"],
      contractTypes: ["CDI", "CDD", "CDI"],
      sourceProviders: ["apify", "apify"],
      sourceNames: ["indeed", "linkedin", "indeed"],
    });

    expect(criteria).toEqual({
      targetRoles: ["Développeur fullstack"],
      keywords: ["React", "TypeScript"],
      locations: ["Nancy", "Metz"],
      remotePolicies: ["hybrid"],
      contractTypes: ["CDI", "CDD"],
      sourceProviders: ["apify"],
      sourceNames: ["indeed", "linkedin"],
    });
  });
});

describe("buildSearchText", () => {
  it("combine les rôles ciblés et les mots-clés en texte de recherche", () => {
    const searchText = buildSearchText({
      targetRoles: ["Développeur fullstack"],
      keywords: ["React", "TypeScript", "Node.js"],
      locations: ["Nancy"],
      remotePolicies: ["hybrid"],
      contractTypes: ["CDI"],
      sourceProviders: ["apify"],
      sourceNames: ["indeed"],
    });

    expect(searchText).toBe("Développeur fullstack React TypeScript Node.js");
  });
});

describe("buildCompactSearchText", () => {
  it("construit une recherche compacte à partir du rôle principal et des mots-clés", () => {
    const searchText = buildCompactSearchText({
      targetRoles: [
        "Développeur Fullstack",
        "Développeur React",
        "Développeur Node.js",
      ],
      keywords: [
        "React",
        "TypeScript",
        "JavaScript",
        "Node.js",
        "NestJS",
        "Fullstack",
        "Backend",
      ],
      locations: ["Grand Est"],
      remotePolicies: ["hybrid"],
      contractTypes: ["CDI"],
      sourceProviders: ["apify"],
      sourceNames: ["indeed"],
    });

    expect(searchText).toBe(
      "Développeur Fullstack React TypeScript JavaScript Node.js NestJS",
    );
  });

  it("retourne un fallback si aucun rôle ni mot-clé exploitable n'est disponible", () => {
    const searchText = buildCompactSearchText({
      targetRoles: [],
      keywords: [],
      locations: [],
      remotePolicies: [],
      contractTypes: [],
      sourceProviders: [],
      sourceNames: [],
    });

    expect(searchText).toBe("Développeur");
  });
});