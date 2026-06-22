export type JobSearchCriteria = {
  targetRoles: string[];
  keywords: string[];
  locations: string[];
  remotePolicies: string[];
  contractTypes: string[];
  sourceProviders: string[];
  sourceNames: string[];
};

export type SearchScenarioLike = {
  targetRoles: string[];
  keywords: string[];
  locations: string[];
  remotePolicies: string[];
  contractTypes: string[];
  sourceProviders: string[];
  sourceNames: string[];
};

function cleanStringArray(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  );
}

export function mapSearchScenarioToJobSearchCriteria(
  searchScenario: SearchScenarioLike,
): JobSearchCriteria {
  return {
    targetRoles: cleanStringArray(searchScenario.targetRoles),
    keywords: cleanStringArray(searchScenario.keywords),
    locations: cleanStringArray(searchScenario.locations),
    remotePolicies: cleanStringArray(searchScenario.remotePolicies),
    contractTypes: cleanStringArray(searchScenario.contractTypes),
    sourceProviders: cleanStringArray(searchScenario.sourceProviders),
    sourceNames: cleanStringArray(searchScenario.sourceNames),
  };
}

export function buildSearchText(criteria: JobSearchCriteria): string {
  return cleanStringArray([...criteria.targetRoles, ...criteria.keywords]).join(
    " ",
  );
}
export type BuildCompactSearchTextOptions = {
  maxTargetRoles?: number;
  maxKeywords?: number;
  fallback?: string;
};

export function buildCompactSearchText(
  criteria: JobSearchCriteria,
  options: BuildCompactSearchTextOptions = {},
): string {
  const maxTargetRoles = options.maxTargetRoles ?? 1;
  const maxKeywords = options.maxKeywords ?? 5;
  const fallback = options.fallback ?? "Développeur";

  const selectedTargetRoles = criteria.targetRoles.slice(0, maxTargetRoles);
  const selectedTargetRolesText = selectedTargetRoles.join(" ").toLowerCase();

  const selectedKeywords = criteria.keywords
    .filter(
      (keyword) =>
        !selectedTargetRolesText.includes(keyword.toLowerCase()),
    )
    .slice(0, maxKeywords);

  const searchText = cleanStringArray([
    ...selectedTargetRoles,
    ...selectedKeywords,
  ]).join(" ");

  return searchText || fallback;
}