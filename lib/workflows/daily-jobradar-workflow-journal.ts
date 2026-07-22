import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type {
  DailyJobRadarWorkflowMode,
  DailyJobRadarWorkflowResult,
  DailyJobRadarWorkflowStatus,
  DailyJobRadarWorkflowStepResult,
} from "@/lib/workflows/run-daily-jobradar-workflow";

export type DailyJobRadarWorkflowTrigger =
  | "MANUAL"
  | "SCHEDULER";

export type DailyJobRadarWorkflowJournalStep = Pick<
  DailyJobRadarWorkflowStepResult,
  "id" | "status" | "message" | "errorMessage"
>;

export type DailyJobRadarWorkflowJournalEntry = {
  schemaVersion: 1;
  runId: string;
  entryType: "WORKFLOW_RESULT" | "UNHANDLED_ERROR";
  trigger: DailyJobRadarWorkflowTrigger;

  recordedAt: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;

  mode: DailyJobRadarWorkflowMode;
  status: DailyJobRadarWorkflowStatus;

  campaignId: string | null;
  jobOfferCount: number;
  reportPath: string | null;

  process: {
    pid: number;
    hostname: string;
  };

  steps: DailyJobRadarWorkflowJournalStep[];
  fatalError?: string;
};

export type BuildWorkflowJournalEntryOptions = {
  result: DailyJobRadarWorkflowResult;
  trigger?: DailyJobRadarWorkflowTrigger;
  runId?: string;
  recordedAt?: Date;
  pid?: number;
  hostname?: string;
};

export type BuildWorkflowFailureJournalEntryOptions = {
  error: unknown;
  startedAt: Date;
  finishedAt?: Date;
  execute: boolean;

  trigger?: DailyJobRadarWorkflowTrigger;
  campaignId?: string | null;
  runId?: string;
  recordedAt?: Date;
  pid?: number;
  hostname?: string;
};

function getDurationMs(
  startedAt: Date,
  finishedAt: Date,
): number {
  return Math.max(
    0,
    finishedAt.getTime() -
      startedAt.getTime(),
  );
}

function getErrorMessage(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : String(error);
}

function getProcessMetadata(input: {
  pid?: number;
  hostname?: string;
}) {
  return {
    pid: input.pid ?? process.pid,
    hostname:
      input.hostname ?? os.hostname(),
  };
}

export function getDailyJobRadarWorkflowJournalFilePath(
  runtimeDir =
    process.env.JOBRADAR_RUNTIME_DIR ??
    path.join(process.cwd(), "runtime"),
): string {
  return path.join(
    runtimeDir,
    "daily-jobradar-workflow-runs.jsonl",
  );
}

export function buildDailyJobRadarWorkflowJournalEntry(
  options: BuildWorkflowJournalEntryOptions,
): DailyJobRadarWorkflowJournalEntry {
  const recordedAt =
    options.recordedAt ?? new Date();

  return {
    schemaVersion: 1,
    runId:
      options.runId ?? crypto.randomUUID(),
    entryType: "WORKFLOW_RESULT",
    trigger:
      options.trigger ?? "MANUAL",

    recordedAt: recordedAt.toISOString(),
    startedAt:
      options.result.startedAt.toISOString(),
    finishedAt:
      options.result.finishedAt.toISOString(),
    durationMs: getDurationMs(
      options.result.startedAt,
      options.result.finishedAt,
    ),

    mode: options.result.mode,
    status: options.result.status,

    campaignId:
      options.result.campaignId,
    jobOfferCount:
      options.result.jobOfferIds.length,
    reportPath:
      options.result.report?.filePath ?? null,

    process: getProcessMetadata(options),

    steps: options.result.steps.map(
      (step) => ({
        id: step.id,
        status: step.status,
        message: step.message,
        errorMessage:
          step.errorMessage,
      }),
    ),
  };
}

export function buildDailyJobRadarWorkflowFailureJournalEntry(
  options: BuildWorkflowFailureJournalEntryOptions,
): DailyJobRadarWorkflowJournalEntry {
  const finishedAt =
    options.finishedAt ?? new Date();

  const recordedAt =
    options.recordedAt ?? finishedAt;

  return {
    schemaVersion: 1,
    runId:
      options.runId ?? crypto.randomUUID(),
    entryType: "UNHANDLED_ERROR",
    trigger:
      options.trigger ?? "MANUAL",

    recordedAt: recordedAt.toISOString(),
    startedAt:
      options.startedAt.toISOString(),
    finishedAt:
      finishedAt.toISOString(),
    durationMs: getDurationMs(
      options.startedAt,
      finishedAt,
    ),

    mode: options.execute
      ? "EXECUTE"
      : "DRY_RUN",

    status: "FAILED",

    campaignId:
      options.campaignId ?? null,
    jobOfferCount: 0,
    reportPath: null,

    process: getProcessMetadata(options),

    steps: [],
    fatalError:
      getErrorMessage(options.error),
  };
}

export async function appendDailyJobRadarWorkflowJournalEntry(
  input: {
    journalFilePath: string;
    entry: DailyJobRadarWorkflowJournalEntry;
  },
): Promise<void> {
  await fs.mkdir(
    path.dirname(input.journalFilePath),
    {
      recursive: true,
    },
  );

  const line =
    `${JSON.stringify(input.entry)}\n`;

  await fs.appendFile(
    input.journalFilePath,
    line,
    "utf8",
  );
}