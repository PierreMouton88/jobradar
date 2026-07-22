import "dotenv/config";

import {
  runDailyJobRadarWorkflow,
  type DailyJobRadarWorkflowResult,
  type RunDailyJobRadarWorkflowDependencies,
} from "@/lib/workflows/run-daily-jobradar-workflow";
import { getDailyJobRadarWorkflowConfig } from "@/lib/workflows/daily-jobradar-workflow-config";
import {
  acquireDailyJobRadarWorkflowLock,
  getDailyJobRadarWorkflowLockFilePath,
  type DailyJobRadarWorkflowLock,
} from "@/lib/workflows/daily-jobradar-workflow-lock";
import {
  appendDailyJobRadarWorkflowJournalEntry,
  buildDailyJobRadarWorkflowFailureJournalEntry,
  buildDailyJobRadarWorkflowJournalEntry,
  getDailyJobRadarWorkflowJournalFilePath,
  type DailyJobRadarWorkflowTrigger,
} from "@/lib/workflows/daily-jobradar-workflow-journal";

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function getArgumentValue(name: string): string | null {
  const prefix = `${name}=`;

  const inlineArgument = process.argv.find((argument) =>
    argument.startsWith(prefix),
  );

  if (inlineArgument) {
    return inlineArgument.slice(prefix.length);
  }

  const argumentIndex = process.argv.indexOf(name);

  if (argumentIndex === -1) {
    return null;
  }

  return process.argv[argumentIndex + 1] ?? null;
}

function parsePositiveInteger(
  name: string,
  fallback: number,
): number {
  const rawValue = getArgumentValue(name);

  if (rawValue === null) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue <= 0
  ) {
    throw new Error(
      `${name} must be a positive integer.`,
    );
  }

  return parsedValue;
}

function parseCampaignId(): string | null {
  const rawValue = getArgumentValue("--campaign-id");

  if (rawValue === null) {
    return null;
  }

  const campaignId = rawValue.trim();

  if (!campaignId) {
    throw new Error(
      "--campaign-id must contain a non-empty value.",
    );
  }

  return campaignId;
}

function parseTrigger(): DailyJobRadarWorkflowTrigger {
  const rawValue =
    getArgumentValue("--trigger");

  if (
    rawValue === null ||
    rawValue.toLowerCase() === "manual"
  ) {
    return "MANUAL";
  }

  if (
    rawValue.toLowerCase() === "scheduler"
  ) {
    return "SCHEDULER";
  }

  throw new Error(
    "--trigger must be manual or scheduler.",
  );
}

function printResult(
  result: DailyJobRadarWorkflowResult,
): void {
  console.log("");
  console.log("JobRadar IA — Workflow quotidien");
  console.log("================================");
  console.log(`Mode : ${result.mode}`);
  console.log(`Statut : ${result.status}`);
  console.log(
    `Campagne : ${result.campaignId ?? "aucune"}`,
  );
  console.log(
    `Offres du batch : ${result.jobOfferIds.length}`,
  );
  console.log("");

  console.log("Étapes");
  console.log("------");

  for (const step of result.steps) {
    console.log(
      `- [${step.status}] ${step.id}`,
    );
    console.log(`  ${step.message}`);

    if (step.errorMessage) {
      console.log(
        `  Erreur : ${step.errorMessage}`,
      );
    }
  }

  console.log("");

  if (result.report) {
    console.log(
      `Rapport : ${result.report.filePath}`,
    );
    console.log("");
  }
}

async function tryAppendJournalEntry(
  entry: Parameters<
    typeof appendDailyJobRadarWorkflowJournalEntry
  >[0]["entry"],
): Promise<void> {
  try {
    await appendDailyJobRadarWorkflowJournalEntry({
      journalFilePath:
        getDailyJobRadarWorkflowJournalFilePath(),
      entry,
    });
  } catch (error) {
    /*
     * Une erreur de journal ne doit pas transformer
     * une exécution réussie en échec et provoquer
     * une éventuelle relance avec doubles appels.
     */
    console.error("");
    console.error(
      "Avertissement : impossible d’écrire le journal du workflow.",
    );
    console.error(error);
    console.error("");
  }
}

function applyExitCode(
  result: DailyJobRadarWorkflowResult,
): void {
  if (result.status === "FAILED") {
    process.exitCode = 1;
    return;
  }

  if (result.status === "PARTIAL") {
    process.exitCode = 2;
  }
}

async function main() {
  const startedAt = new Date();
  const execute = hasFlag("--execute");
  const trigger = parseTrigger();
  const campaignId = parseCampaignId();

  const config =
    getDailyJobRadarWorkflowConfig();

  // suite existante...

  let dependencies:
    | RunDailyJobRadarWorkflowDependencies
    | undefined;

  let disconnect:
    | (() => Promise<void>)
    | undefined;

  let workflowLock:
  | DailyJobRadarWorkflowLock
  | undefined;

  /*
   * Le module serveur n’est chargé que si une exécution réelle
   * est demandée et que le workflow global est activé.
   */
  if (execute && config.enabled) {
    workflowLock =
  await acquireDailyJobRadarWorkflowLock({
    lockFilePath:
      getDailyJobRadarWorkflowLockFilePath(),
  });
    const serverDependencies =
      await import(
        "@/lib/workflows/daily-jobradar-workflow-dependencies"
      );

    dependencies =
      serverDependencies
        .DAILY_JOBRADAR_WORKFLOW_DEPENDENCIES;

    disconnect =
      serverDependencies
        .disconnectDailyJobRadarWorkflowDependencies;
  }

  try {
  const result =
    await runDailyJobRadarWorkflow(
      {
        execute,
        config,
        now: startedAt,
        campaignId,
        recentHours:
          parsePositiveInteger(
            "--recent-hours",
            24,
          ),
      },
      dependencies,
    );

  printResult(result);

  await tryAppendJournalEntry(
    buildDailyJobRadarWorkflowJournalEntry({
      result,
      trigger,
    }),
  );

  applyExitCode(result);
} catch (error) {
  await tryAppendJournalEntry(
    buildDailyJobRadarWorkflowFailureJournalEntry({
      error,
      startedAt,
      finishedAt: new Date(),
      execute,
      trigger,
      campaignId,
    }),
  );

  throw error;
} finally {
  try {
    await disconnect?.();
  } finally {
    await workflowLock?.release();
  }
}
}

main().catch((error) => {
  console.error("");
  console.error(
    "Erreur pendant le workflow quotidien :",
  );
  console.error(error);
  console.error("");

  process.exitCode = 1;
});