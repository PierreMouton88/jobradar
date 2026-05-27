import {
  detectRemote,
  detectSkills,
  normalizeContractTypeForDb,
  mapContractTypeFromDb,
} from "./offer-normalization";

import { describe, expect, it } from "vitest";

describe("offer-normalization", () => {
  describe("normalizeContractTypeForDb", () => {
    it("retourne l'enum Prisma correspondant à un CDI", () => {
      expect(normalizeContractTypeForDb("CDI")).toBe("CDI");
      expect(normalizeContractTypeForDb("Contrat CDI")).toBe("CDI");
    });

    it("retourne l'enum Prisma correspondant à une alternance", () => {
      expect(normalizeContractTypeForDb("Alternance")).toBe("ALTERNANCE");
      expect(normalizeContractTypeForDb("contrat d'apprentissage")).toBe(
        "ALTERNANCE",
      );
    });

    it("retourne INCONNU quand le contrat n'est pas reconnu", () => {
      expect(normalizeContractTypeForDb("Temps plein")).toBe("INCONNU");
      expect(normalizeContractTypeForDb("")).toBe("INCONNU");
    });
  });

  describe("mapContractTypeFromDb", () => {
    it("convertit les enums Prisma vers les libellés UI", () => {
      expect(mapContractTypeFromDb("CDI")).toBe("CDI");
      expect(mapContractTypeFromDb("STAGE")).toBe("Stage");
      expect(mapContractTypeFromDb("ALTERNANCE")).toBe("Alternance");
      expect(mapContractTypeFromDb("INCONNU")).toBe("Inconnu");
    });
  });

  describe("detectRemote", () => {
    it("détecte le télétravail", () => {
      expect(detectRemote("Poste en télétravail partiel")).toBe(true);
      expect(detectRemote("Remote possible deux jours par semaine")).toBe(true);
      expect(detectRemote("Travail à distance accepté")).toBe(true);
    });

    it("retourne false si aucun signal remote n'est trouvé", () => {
      expect(detectRemote("Poste basé à Lyon en présentiel")).toBe(false);
    });
  });

  describe("detectSkills", () => {
    it("détecte les compétences techniques connues", () => {
      expect(
        detectSkills("Projet React avec TypeScript, Node.js et PostgreSQL"),
      ).toEqual(
        expect.arrayContaining([
          "React",
          "TypeScript",
          "Node.js",
          "PostgreSQL",
        ]),
      );
    });

    it("ne duplique pas les compétences détectées", () => {
      const skills = detectSkills("React React react");

      expect(skills.filter((skill) => skill === "React")).toHaveLength(1);
    });
  });
});
