import "dotenv/config";

import { getDailyJobRadarWorkflowConfig } from "@/lib/workflows/daily-jobradar-workflow-config";

import type { DailyJobRadarWorkflowTrigger } from "@/lib/workflows/daily-jobradar-workflow-journal";

import type { DailyJobRadarWorkflowResult } from "@/lib/workflows/run-daily-jobradar-workflow";

import { runDailyJobRadarWorkflowWithRuntime } from "@/lib/workflows/run-daily-jobradar-workflow-with-runtime";

function getCliOptionValue(optionName: string): string | null {
  const inlinePrefix = `${optionName}=`;

  const inlineArgument = process.argv.find((argument) =>
    argument.startsWith(inlinePrefix),
  );

  if (inlineArgument) {
    return inlineArgument.slice(inlinePrefix.length);
  }

  const optionIndex = process.argv.indexOf(optionName);

  if (optionIndex === -1) {
    return null;
  }

  return process.argv[optionIndex + 1] ?? null;
}

function hasFlag(flagName: string): boolean {
  return process.argv.includes(flagName);
}

function parsePositiveInteger(
  optionName: string,
  defaultValue: number,
): number {
  const rawValue = getCliOptionValue(optionName);

  if (rawValue === null) {
    return defaultValue;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(
      `Invalid ${optionName} value: "${rawValue}". Expected a positive integer.`,
    );
  }

  return parsedValue;
}

function parseCampaignId(): string | null {
  const rawValue = getCliOptionValue("--campaign-id");

  if (rawValue === null) {
    return null;
  }

  const campaignId = rawValue.trim();

  if (campaignId.length === 0) {
    throw new Error(
      'Invalid --campaign-id value: expected a non-empty campaign ID.',
    );
  }

  return campaignId;
}

function parseTrigger(): DailyJobRadarWorkflowTrigger {
  const rawValue = getCliOptionValue("--trigger");

  if (rawValue === null) {
    return "MANUAL";
  }

  const trigger = rawValue.trim().toLowerCase();

  if (trigger === "manual") {
    return "MANUAL";
  }

  if (trigger === "scheduler") {
    return "SCHEDULER";
  }

  throw new Error(
    `Invalid --trigger value: "${rawValue}". Expected "manual" or "scheduler".`,
  );
}

function printResult(result: DailyJobRadarWorkflowResult): void {
  console.log("");
  console.log("JobRadar IA — Workflow quotidien");
  console.log("================================");
  console.log(`Mode : ${result.mode}`);
  console.log(`Statut : ${result.status}`);
  console.log(`Campagne : ${result.campaignId ?? "aucune"}`);
  console.log(`Offres du batch : ${result.jobOfferIds.length}`);
  console.log("");

  console.log("Étapes");
  console.log("------");

  for (const step of result.steps) {
    console.log(`- [${step.status}] ${step.id}`);
    console.log(`  ${step.message}`);

    if (step.errorMessage) {
      console.log(`  Erreur : ${step.errorMessage}`);
    }
  }

  if (result.report) {
    console.log("");
    console.log(`Rapport : ${result.report.filePath}`);
  }

  console.log("");
}

function applyExitCode(result: DailyJobRadarWorkflowResult): void {
  if (result.status === "FAILED") {
    process.exitCode = 1;
    return;
  }

  if (result.status === "PARTIAL") {
    process.exitCode = 2;
  }
}

async function main(): Promise<void> {
  const startedAt = new Date();

  const execute = hasFlag("--execute");
  const trigger = parseTrigger();
  const campaignId = parseCampaignId();

  const config = getDailyJobRadarWorkflowConfig();

  const result = await runDailyJobRadarWorkflowWithRuntime({
    execute,
    config,
    trigger,
    now: startedAt,
    campaignId,
    recentHours: parsePositiveInteger("--recent-hours", 24),
  });

  printResult(result);
  applyExitCode(result);
}

main().catch((error: unknown) => {
  console.error("");
  console.error("Erreur pendant le workflow quotidien :");
  console.error(error);
  console.error("");

  process.exitCode = 1;
});