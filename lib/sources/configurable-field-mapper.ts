import type {
  ExternalJobOffer,
  ExternalJobSourceProvider,
  ExternalMappingContext,
} from "../../types/external-job-offer";

export type ExternalOfferFieldMappingConfig = {
  sourceProvider: ExternalJobSourceProvider;
  sourceName: string;

  fields: {
    externalId: string;
    title: string;
    company: string;
    location: string;
    contractType: string;
    description: string;
    sourceUrl: string;

    applyUrl?: string;
    publishedAt?: string;
    remoteHint?: string;
    salaryText?: string;
    rawExperienceLevel?: string;
  };
};

function readValueAtPath(rawItem: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((currentValue, pathPart) => {
    if (
      typeof currentValue === "object" &&
      currentValue !== null &&
      pathPart in currentValue
    ) {
      return (currentValue as Record<string, unknown>)[pathPart];
    }

    return undefined;
  }, rawItem);
}

function normalizeStringValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string")
  ) {
    const joinedValue = value.join(", ");

    if (joinedValue.trim().length > 0) {
      return joinedValue;
    }
  }

  return null;
}

function readRequiredStringField(
  rawItem: Record<string, unknown>,
  fieldName: string,
  targetFieldName: string,
): string {
  const value = readValueAtPath(rawItem, fieldName);
  const normalizedValue = normalizeStringValue(value);

  if (normalizedValue) {
    return normalizedValue;
  }

  throw new Error(
    `Champ obligatoire manquant ou invalide pour "${targetFieldName}" depuis "${fieldName}".`,
  );
}

function readOptionalStringField(
  rawItem: Record<string, unknown>,
  fieldName?: string,
): string | null {
  if (!fieldName) {
    return null;
  }

  const value = readValueAtPath(rawItem, fieldName);

  return normalizeStringValue(value);
}

function readOptionalBooleanField(
  rawItem: Record<string, unknown>,
  fieldName?: string,
): boolean | null {
  if (!fieldName) {
    return null;
  }

  const value = readValueAtPath(rawItem, fieldName);

  if (typeof value === "boolean") {
    return value;
  }

  return null;
}

export function mapExternalOfferWithConfig(
  rawItem: Record<string, unknown>,
  config: ExternalOfferFieldMappingConfig,
  context: ExternalMappingContext = {},
): ExternalJobOffer {
  return {
    externalId: readRequiredStringField(
      rawItem,
      config.fields.externalId,
      "externalId",
    ),
    sourceProvider: config.sourceProvider,
    sourceName: config.sourceName,
    sourceActor: context.sourceActor ?? null,

    title: readRequiredStringField(rawItem, config.fields.title, "title"),
    company: readRequiredStringField(rawItem, config.fields.company, "company"),
    location: readRequiredStringField(
      rawItem,
      config.fields.location,
      "location",
    ),
    contractType: readRequiredStringField(
      rawItem,
      config.fields.contractType,
      "contractType",
    ),
    description: readRequiredStringField(
      rawItem,
      config.fields.description,
      "description",
    ),

    sourceUrl: readRequiredStringField(
      rawItem,
      config.fields.sourceUrl,
      "sourceUrl",
    ),
    applyUrl: readOptionalStringField(rawItem, config.fields.applyUrl),

    publishedAt: readOptionalStringField(rawItem, config.fields.publishedAt),
    remoteHint: readOptionalBooleanField(rawItem, config.fields.remoteHint),

    salaryText: readOptionalStringField(rawItem, config.fields.salaryText),
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,

    rawSkills: [],
    rawExperienceLevel: readOptionalStringField(
      rawItem,
      config.fields.rawExperienceLevel,
    ),

    rawData: rawItem,
  };
}
