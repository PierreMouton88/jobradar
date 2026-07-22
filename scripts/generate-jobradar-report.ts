import "dotenv/config";

import { prisma } from "@/lib/prisma";
import {
  generateJobRadarReport,
  type GenerateJobRadarReportOptions,
} from "@/lib/reports/generate-jobradar-report";

function getCliOptionValue(
  optionName: string,
): string | null {
  const prefix = `${optionName}=`;

  const inlineArgument = process.argv.find((argument) =>
    argument.startsWith(prefix),
  );

  if (inlineArgument) {
    return inlineArgument.slice(prefix.length);
  }

  const optionIndex = process.argv.indexOf(optionName);

  if (optionIndex === -1) {
    return null;
  }

  return process.argv[optionIndex + 1] ?? null;
}

function parseRecentHours(): number | null {
  const rawValue = getCliOptionValue("--recent-hours");

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number(rawValue);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue <= 0
  ) {
    throw new Error(
      `Invalid --recent-hours value: "${rawValue}". Expected a positive number.`,
    );
  }

  return parsedValue;
}

function parseCampaignId(): string | null {
  const rawValue = getCliOptionValue("--campaign-id");

  if (!rawValue) {
    return null;
  }

  const campaignId = rawValue.trim();

  if (!campaignId) {
    throw new Error(
      "Invalid --campaign-id value: expected a non-empty value.",
    );
  }

  return campaignId;
}

function buildOptions(): GenerateJobRadarReportOptions {
  const campaignId = parseCampaignId();

  if (campaignId) {
    return {
      scope: {
        type: "campaign",
        campaignId,
      },
      appBaseUrl:
        process.env.JOBRADAR_APP_BASE_URL,
    };
  }

  const recentHours = parseRecentHours();

  if (recentHours !== null) {
    return {
      scope: {
        type: "recent-hours",
        recentHours,
      },
      appBaseUrl:
        process.env.JOBRADAR_APP_BASE_URL,
    };
  }

  return {
    scope: {
      type: "global",
    },
    appBaseUrl:
      process.env.JOBRADAR_APP_BASE_URL,
  };
}

async function main() {
  const report = await generateJobRadarReport(
    buildOptions(),
  );

  console.log(`Report generated: ${report.filePath}`);

  if (report.scope.type === "campaign") {
    console.log(
      `Report scope: campaign ${report.scope.campaignId}`,
    );
    console.log(
      `Scoped offers: ${report.scopedOffersCount}`,
    );
    return;
  }

  if (report.scope.type === "recent-hours") {
    console.log(
      `Report scope: last ${report.scope.recentHours}h`,
    );
    console.log(
      `Scoped offers: ${report.scopedOffersCount}`,
    );
  }
}

main()
  .catch((error) => {
    console.error(
      "Failed to generate report:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });