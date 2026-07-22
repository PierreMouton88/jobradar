import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import type { GeneratedJobRadarReport } from "@/lib/reports/generate-jobradar-report";
import type { DailyJobRadarWorkflowResult } from "@/lib/workflows/run-daily-jobradar-workflow";
import {
  appendDailyJobRadarWorkflowJournalEntry,
  buildDailyJobRadarWorkflowFailureJournalEntry,
  buildDailyJobRadarWorkflowJournalEntry,
} from "@/lib/workflows/daily-jobradar-workflow-journal";

const temporaryDirectories: string[] = [];

async function createJournalFilePath() {
  const temporaryDirectory =
    await fs.mkdtemp(
      path.join(
        os.tmpdir(),
        "jobradar-journal-",
      ),
    );

  temporaryDirectories.push(
    temporaryDirectory,
  );

  return path.join(
    temporaryDirectory,
    "runtime",
    "workflow-runs.jsonl",
  );
}

function createReport(): GeneratedJobRadarReport {
  return {
    filename:
      "jobradar-report-2026-07-21-campaign-1.md",
    filePath:
      "/reports/jobradar-report-2026-07-21-campaign-1.md",
    content:
      "# Rapport JobRadar — 2026-07-21",
    modifiedAt:
      new Date("2026-07-21T08:05:00.000Z"),

    scope: {
      type: "campaign",
      campaignId: "campaign-1",
    },

    campaignId: "campaign-1",
    scopedOffersCount: 2,
  };
}

function createWorkflowResult(): DailyJobRadarWorkflowResult {
  return {
    mode: "EXECUTE",
    status: "PARTIAL",

    startedAt:
      new Date("2026-07-21T08:00:00.000Z"),
    finishedAt:
      new Date("2026-07-21T08:05:00.000Z"),

    campaignId: "campaign-1",
    jobOfferIds: [
      "offer-1",
      "offer-2",
    ],

    report: createReport(),

    steps: [
      {
        id: "APIFY_IMPORT",
        status: "SUCCESS",
        message:
          "Campagne créée : campaign-1.",
      },
      {
        id: "RAG_SYNC",
        status: "PARTIAL",
        message:
          "1 document synchronisé, 1 erreur.",
        errorMessage:
          "OpenAI unavailable",
      },
    ],
  };
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(
      (temporaryDirectory) =>
        fs.rm(temporaryDirectory, {
          recursive: true,
          force: true,
        }),
    ),
  );
});

describe("daily workflow journal", () => {
  it("construit une entrée compacte depuis le résultat du workflow", () => {
    const entry =
      buildDailyJobRadarWorkflowJournalEntry({
        result: createWorkflowResult(),
        trigger: "SCHEDULER",
        runId: "run-1",
        recordedAt:
          new Date(
            "2026-07-21T08:05:01.000Z",
          ),
        pid: 123,
        hostname: "jobradar-worker",
      });

    expect(entry).toMatchObject({
      schemaVersion: 1,
      runId: "run-1",
      entryType: "WORKFLOW_RESULT",
      trigger: "SCHEDULER",

      durationMs: 300_000,
      mode: "EXECUTE",
      status: "PARTIAL",

      campaignId: "campaign-1",
      jobOfferCount: 2,
      reportPath:
        "/reports/jobradar-report-2026-07-21-campaign-1.md",

      process: {
        pid: 123,
        hostname: "jobradar-worker",
      },
    });

    expect(entry.steps).toHaveLength(2);

    expect(entry.steps[1]).toMatchObject({
      id: "RAG_SYNC",
      status: "PARTIAL",
      errorMessage:
        "OpenAI unavailable",
    });

    expect(entry).not.toHaveProperty(
      "report.content",
    );
  });

  it("construit une entrée pour une erreur non gérée", () => {
    const entry =
      buildDailyJobRadarWorkflowFailureJournalEntry({
        error:
          new Error("Database unavailable"),
        startedAt:
          new Date(
            "2026-07-21T08:00:00.000Z",
          ),
        finishedAt:
          new Date(
            "2026-07-21T08:00:10.000Z",
          ),
        execute: true,
        campaignId: "campaign-1",
        runId: "run-error",
        pid: 456,
        hostname: "worker-error",
      });

    expect(entry).toMatchObject({
      runId: "run-error",
      entryType: "UNHANDLED_ERROR",
      mode: "EXECUTE",
      status: "FAILED",
      durationMs: 10_000,
      campaignId: "campaign-1",
      fatalError:
        "Database unavailable",
    });

    expect(entry.steps).toEqual([]);
  });

  it("crée le dossier et ajoute une ligne JSON valide", async () => {
    const journalFilePath =
      await createJournalFilePath();

    const entry =
      buildDailyJobRadarWorkflowJournalEntry({
        result: createWorkflowResult(),
        runId: "run-1",
      });

    await appendDailyJobRadarWorkflowJournalEntry({
      journalFilePath,
      entry,
    });

    const lines = (
      await fs.readFile(
        journalFilePath,
        "utf8",
      )
    )
      .trim()
      .split(/\r?\n/);

    expect(lines).toHaveLength(1);

    expect(JSON.parse(lines[0])).toMatchObject({
      runId: "run-1",
      status: "PARTIAL",
    });
  });

  it("conserve une ligne distincte pour chaque exécution", async () => {
    const journalFilePath =
      await createJournalFilePath();

    const firstEntry =
      buildDailyJobRadarWorkflowJournalEntry({
        result: createWorkflowResult(),
        runId: "run-1",
      });

    const secondEntry =
      buildDailyJobRadarWorkflowFailureJournalEntry({
        error:
          new Error("Unexpected failure"),
        startedAt:
          new Date(
            "2026-07-21T09:00:00.000Z",
          ),
        finishedAt:
          new Date(
            "2026-07-21T09:00:01.000Z",
          ),
        execute: true,
        runId: "run-2",
      });

    await appendDailyJobRadarWorkflowJournalEntry({
      journalFilePath,
      entry: firstEntry,
    });

    await appendDailyJobRadarWorkflowJournalEntry({
      journalFilePath,
      entry: secondEntry,
    });

    const parsedLines = (
      await fs.readFile(
        journalFilePath,
        "utf8",
      )
    )
      .trim()
      .split(/\r?\n/)
      .map((line) => JSON.parse(line));

    expect(parsedLines).toHaveLength(2);

    expect(
      parsedLines.map((line) => line.runId),
    ).toEqual([
      "run-1",
      "run-2",
    ]);
  });
});