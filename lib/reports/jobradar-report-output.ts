import path from "node:path";

const DEFAULT_APP_BASE_URL = "http://localhost:3000";

export type JobRadarReportScope =
  | {
      type: "global";
    }
  | {
      type: "recent-hours";
      recentHours: number;
    }
  | {
      type: "campaign";
      campaignId: string;
    };

function normalizeAppBaseUrl(
  appBaseUrl: string | null | undefined,
): string {
  const normalizedValue = appBaseUrl?.trim();

  if (!normalizedValue) {
    return DEFAULT_APP_BASE_URL;
  }

  return normalizedValue.replace(/\/+$/, "");
}

function sanitizeFilenamePart(value: string): string {
  const sanitizedValue = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!sanitizedValue) {
    throw new Error(
      "Impossible de construire le nom du rapport avec un identifiant vide.",
    );
  }

  return sanitizedValue;
}

export function buildJobRadarOfferUrl(input: {
  jobOfferId: string;
  appBaseUrl?: string | null;
}): string {
  const appBaseUrl = normalizeAppBaseUrl(input.appBaseUrl);

  return `${appBaseUrl}/offers/${encodeURIComponent(input.jobOfferId)}`;
}

export function buildJobRadarCampaignUrl(input: {
  campaignId: string;
  appBaseUrl?: string | null;
}): string {
  const appBaseUrl = normalizeAppBaseUrl(input.appBaseUrl);

  return `${appBaseUrl}/imports/${encodeURIComponent(input.campaignId)}`;
}

export function buildJobRadarReportFilename(input: {
  now: Date;
  scope: JobRadarReportScope;
}): string {
  const datePart = input.now.toISOString().slice(0, 10);

  if (input.scope.type === "campaign") {
    const campaignPart = sanitizeFilenamePart(
      input.scope.campaignId,
    );

    return `jobradar-report-${datePart}-${campaignPart}.md`;
  }

  if (input.scope.type === "recent-hours") {
    return `jobradar-report-${datePart}-recent-${input.scope.recentHours}h.md`;
  }

  return `jobradar-report-${datePart}.md`;
}

export function buildJobRadarReportPath(input: {
  reportsDir?: string;
  now: Date;
  scope: JobRadarReportScope;
}): string {
  const reportsDir =
    input.reportsDir ?? path.join(process.cwd(), "reports");

  const filename = buildJobRadarReportFilename({
    now: input.now,
    scope: input.scope,
  });

  return path.join(reportsDir, filename);
}