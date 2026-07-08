import type { LatestJobRadarReport } from "./read-latest-jobradar-report";

export type JobRadarReportEmailPreview = {
  subject: string;
  body: string;
  sourceReportPath: string;
  sourceReportFilename: string;
};

function getReportDate(content: string): string {
  const firstTitle = content
    .split(/\r?\n/)
    .find((line) => line.startsWith("# "));

  const match = firstTitle?.match(/^# Rapport JobRadar — (.+)$/);

  return match?.[1] ?? "date inconnue";
}

function extractMarkdownSection(content: string, title: string): string[] {
  const lines = content.split(/\r?\n/);
  const heading = `## ${title}`;

  const startIndex = lines.findIndex((line) => line.trim() === heading);

  if (startIndex === -1) {
    return [];
  }

  const sectionLines: string[] = [];

  for (const line of lines.slice(startIndex + 1)) {
    if (line.startsWith("## ")) {
      break;
    }

    sectionLines.push(line);
  }

  return sectionLines
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);
}

function limitLines(lines: string[], maxLines: number): string[] {
  if (lines.length <= maxLines) {
    return lines;
  }

  return [
    ...lines.slice(0, maxLines),
    "",
    `… ${lines.length - maxLines} ligne(s) masquée(s) dans cette preview.`,
  ];
}

export function buildJobRadarReportEmailPreview(
  report: LatestJobRadarReport,
): JobRadarReportEmailPreview {
  const reportDate = getReportDate(report.content);

  const summaryLines = extractMarkdownSection(report.content, "Résumé");
  const priorityLines = extractMarkdownSection(
    report.content,
    "File de priorité",
  );
  const qualityLines = extractMarkdownSection(
    report.content,
    "Points de vigilance qualité",
  );

  const subject = `JobRadar IA — Rapport de veille du ${reportDate}`;

  const bodyLines = [
    "Bonjour,",
    "",
    `Voici la preview du rapport de veille JobRadar IA du ${reportDate}.`,
    "",
    "Résumé",
    "------",
    ...(summaryLines.length > 0
      ? limitLines(summaryLines, 20)
      : ["Aucun résumé trouvé dans le rapport."]),
    "",
    "File de priorité",
    "----------------",
    ...(priorityLines.length > 0
      ? limitLines(priorityLines, 45)
      : ["Aucune file de priorité trouvée dans le rapport."]),
    "",
    "Points de vigilance qualité",
    "---------------------------",
    ...(qualityLines.length > 0
      ? limitLines(qualityLines, 20)
      : ["Aucun point de vigilance qualité trouvé dans le rapport."]),
    "",
    "Rapport complet",
    "---------------",
    `Fichier local : ${report.filePath}`,
    "",
    "Aucune candidature n’a été envoyée.",
    "Aucun contact externe n’a été effectué.",
  ];

  return {
    subject,
    body: bodyLines.join("\n"),
    sourceReportPath: report.filePath,
    sourceReportFilename: report.filename,
  };
}