import * as fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";

export type LatestJobRadarReport = {
  filename: string;
  filePath: string;
  content: string;
  modifiedAt: Date;
};

const REPORT_FILENAME_REGEX = /^jobradar-report-\d{4}-\d{2}-\d{2}\.md$/;

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

export async function readLatestJobRadarReport(
  reportsDir = path.join(process.cwd(), "reports"),
): Promise<LatestJobRadarReport | null> {
  let entries: Dirent[];

  try {
    entries = await fs.readdir(reportsDir, {
      withFileTypes: true,
    });
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }

  const reportFiles = await Promise.all(
    entries
      .filter(
        (entry) =>
          entry.isFile() && REPORT_FILENAME_REGEX.test(entry.name),
      )
      .map(async (entry) => {
        const filePath = path.join(reportsDir, entry.name);
        const stats = await fs.stat(filePath);

        return {
          filename: entry.name,
          filePath,
          modifiedAt: stats.mtime,
        };
      }),
  );

  const latestReport = [...reportFiles].sort(
    (a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime(),
  )[0];

  if (!latestReport) {
    return null;
  }

  const content = await fs.readFile(latestReport.filePath, "utf8");

  return {
    ...latestReport,
    content,
  };
}