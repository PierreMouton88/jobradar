import type { ContractType as PrismaContractType } from "@prisma/client";
import type { ContractType as UiContractType } from "@/types/job-offer";

export function normalizeContractTypeForDb(value: string): PrismaContractType {
  const normalizedValue = value.toLowerCase();

  if (normalizedValue.includes("cdi")) {
    return "CDI";
  }

  if (normalizedValue.includes("cdd")) {
    return "CDD";
  }

  if (normalizedValue.includes("stage")) {
    return "STAGE";
  }

  if (
    normalizedValue.includes("alternance") ||
    normalizedValue.includes("apprentissage")
  ) {
    return "ALTERNANCE";
  }

  if (
    normalizedValue.includes("freelance") ||
    normalizedValue.includes("indépendant") ||
    normalizedValue.includes("independant")
  ) {
    return "FREELANCE";
  }

  return "INCONNU";
}

export function mapContractTypeFromDb(
  contractType: PrismaContractType
): UiContractType {
  switch (contractType) {
    case "CDI":
      return "CDI";
    case "CDD":
      return "CDD";
    case "STAGE":
      return "Stage";
    case "ALTERNANCE":
      return "Alternance";
    case "FREELANCE":
      return "Freelance";
    case "INCONNU":
    default:
      return "Inconnu";
  }
}

export function detectRemote(location: string): boolean {
  const normalizedLocation = location.toLowerCase();

  return (
    normalizedLocation.includes("remote") ||
    normalizedLocation.includes("télétravail") ||
    normalizedLocation.includes("teletravail")
  );
}

export function detectSkills(text: string): string[] {
  const knownSkills = [
    "React",
    "Next.js",
    "TypeScript",
    "JavaScript",
    "Node.js",
    "NestJS",
    "PostgreSQL",
    "Prisma",
    "Tailwind",
    "Docker",
    "Git",
  ];

  const normalizedText = text.toLowerCase();

  return knownSkills.filter((skill) =>
    normalizedText.includes(skill.toLowerCase())
  );
}