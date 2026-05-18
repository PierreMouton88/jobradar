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
  contractType: PrismaContractType,
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

export function detectRemote(text: string): boolean {
  const normalizedText = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const negativePatterns = [
    "pas de teletravail",
    "sans teletravail",
    "presentiel uniquement",
    "sur site uniquement",
    "full presentiel",
    "100 presentiel",
  ];

  for (const pattern of negativePatterns) {
    if (normalizedText.includes(pattern)) {
      return false;
    }
  }

  const positivePatterns = [
    "remote",
    "full remote",
    "teletravail",
    "hybride",
    "hybrid",
    "a distance",
    "travail a distance",
    "remote friendly",
  ];

  return positivePatterns.some((pattern) =>
    normalizedText.includes(pattern)
  );
}

const skillDictionary = [
  {
    label: "React",
    patterns: ["react", "react.js", "reactjs"],
  },
  {
    label: "Next.js",
    patterns: ["next.js", "nextjs", "next js"],
  },
  {
    label: "TypeScript",
    patterns: ["typescript", "type script", "ts"],
  },
  {
    label: "JavaScript",
    patterns: ["javascript", "java script", "js"],
  },
  {
    label: "Node.js",
    patterns: ["node.js", "nodejs", "node"],
  },
  {
    label: "NestJS",
    patterns: ["nestjs", "nest.js", "nest js"],
  },
  {
    label: "PostgreSQL",
    patterns: ["postgresql", "postgres", "postgre"],
  },
  {
    label: "Prisma",
    patterns: ["prisma"],
  },
  {
    label: "Tailwind",
    patterns: ["tailwind", "tailwind css"],
  },
  {
    label: "Docker",
    patterns: ["docker", "docker compose"],
  },
  {
    label: "Git",
    patterns: ["git", "github", "gitlab"],
  },
] as const;

function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function detectSkills(text: string): string[] {
  const normalizedText = normalizeForSearch(text);
  const detectedSkills = new Set<string>();

  for (const skill of skillDictionary) {
    for (const pattern of skill.patterns) {
      const normalizedPattern = normalizeForSearch(pattern);
      const escapedPattern = escapeRegex(normalizedPattern);

      const regex = new RegExp(`(^|\\s)${escapedPattern}(\\s|$)`, "i");

      if (regex.test(normalizedText)) {
        detectedSkills.add(skill.label);
        break;
      }
    }
  }
  return Array.from(detectedSkills);
}
