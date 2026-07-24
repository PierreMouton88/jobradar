import type { LatestJobRadarReport } from "./read-latest-jobradar-report";

export type JobRadarReportEmailPreview = {
  subject: string;
  body: string;
  text: string;
  html: string;
  sourceReportPath: string;
  sourceReportFilename: string;
  campaignReportUrl: string | null;
};

export type BuildJobRadarReportEmailPreviewOptions = {
  appBaseUrl?: string | null;
  campaignId?: string | null;
};

type PriorityOfferDigest = {
  sectionTitle: string;
  title: string;
  priority?: string;
  score?: string;
  company?: string;
  location?: string;
  localUrl?: string;
  sourceUrl?: string;

  aiAnalysis?: string;
  aiSummary?: string;
  aiExperienceLevel?: string;
  aiRemotePolicy?: string;
  aiSalaryMentioned?: string;
  aiMode?: string;
  aiModel?: string;
  aiTokens?: string;
  aiPositiveSignals?: string;
  aiRedFlags?: string;

  reasons: string[];
};

type PrioritySectionDigest = {
  title: string;
  offers: PriorityOfferDigest[];
};

type SummaryItem = {
  label: string;
  value: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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

    if (line.trim().length > 0) {
      sectionLines.push(line.trimEnd());
    }
  }

  return sectionLines;
}

function normalizeCommaSeparatedSummaryLine(line: string): string {
  const separatorIndex = line.indexOf(":");

  if (separatorIndex === -1) {
    return line;
  }

  const label = line.slice(0, separatorIndex + 1);
  const value = line.slice(separatorIndex + 1);

  const uniqueItems = Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

  return `${label} ${uniqueItems.join(", ")}`;
}

function buildCompactSummaryLines(summaryLines: string[]): string[] {
  const usefulPrefixes = [
    "- Mode rapport :",
    "- Profil candidat :",
    "- Scénario de recherche :",
    "- Zones ciblées :",
    "- Offres totales en base :",
    "- Offres réelles en base :",
    "- Offres candidates à l’analyse IA :",
    "- Offres dans la file de priorité :",
    "- Offres écartées par heuristique :",
  ];

  const compactLines = summaryLines.filter((line) =>
    usefulPrefixes.some((prefix) => line.startsWith(prefix)),
  );

  return compactLines.map((line) => {
    if (line.startsWith("- Zones ciblées :")) {
      return normalizeCommaSeparatedSummaryLine(line);
    }

    return line;
  });
}

function parseSummaryItems(lines: string[]): SummaryItem[] {
  return lines
    .map((line) => line.replace(/^-\s*/, ""))
    .map((line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex === -1) {
        return null;
      }

      return {
        label: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim(),
      };
    })
    .filter((item): item is SummaryItem => item !== null);
}

function getSummaryValue(items: SummaryItem[], label: string): string | null {
  return items.find((item) => item.label === label)?.value ?? null;
}

function normalizeAppBaseUrl(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  return normalizedValue.replace(/\/+$/, "");
}

function extractCampaignIdFromSummary(
  summaryItems: SummaryItem[],
): string | null {
  const reportMode = getSummaryValue(summaryItems, "Mode rapport");

  if (!reportMode) {
    return null;
  }

  const campaignIdMatch = reportMode.match(/\b(c[a-z0-9]{20,})\b/i);

  return campaignIdMatch?.[1] ?? null;
}

function buildCampaignReportUrl(input: {
  appBaseUrl?: string | null;
  campaignId?: string | null;
  summaryItems: SummaryItem[];
}): string | null {
  const appBaseUrl = normalizeAppBaseUrl(input.appBaseUrl);

  const campaignId =
    input.campaignId?.trim() ||
    extractCampaignIdFromSummary(input.summaryItems);

  if (!appBaseUrl || !campaignId) {
    return null;
  }

  return `${appBaseUrl}/imports/${encodeURIComponent(campaignId)}`;
}

function parsePrioritySections(lines: string[]): PrioritySectionDigest[] {
  const sections: PrioritySectionDigest[] = [];

  let currentSection: PrioritySectionDigest | null = null;
  let currentOffer: PriorityOfferDigest | null = null;
  let isReadingReasons = false;

  function pushCurrentOffer() {
    if (!currentSection || !currentOffer) {
      return;
    }

    currentSection.offers.push(currentOffer);
    currentOffer = null;
    isReadingReasons = false;
  }

  for (const line of lines) {
    if (line.startsWith("### ")) {
      pushCurrentOffer();

      currentSection = {
        title: line.replace(/^###\s+/, "").trim(),
        offers: [],
      };

      sections.push(currentSection);
      continue;
    }

    if (line.startsWith("#### ")) {
      pushCurrentOffer();

      currentOffer = {
        sectionTitle: currentSection?.title ?? "Sans catégorie",
        title: line.replace(/^####\s+/, "").trim(),
        reasons: [],
      };

      isReadingReasons = false;
      continue;
    }

    if (!currentOffer) {
      continue;
    }

    const trimmedLine = line.trim();

    if (trimmedLine === "- Raisons de priorité :") {
      isReadingReasons = true;
      continue;
    }

    if (isReadingReasons && trimmedLine.startsWith("- ")) {
      currentOffer.reasons.push(trimmedLine.replace(/^-\s+/, "").trim());
      continue;
    }

    const fieldMatch = trimmedLine.match(/^- ([^:]+)\s*:\s*(.+)$/);

    if (!fieldMatch) {
      continue;
    }

    const [, rawKey, rawValue] = fieldMatch;
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "priorité") {
      currentOffer.priority = value;
      continue;
    }

    if (key === "score") {
      currentOffer.score = value;
      continue;
    }

    if (key === "entreprise") {
      currentOffer.company = value;
      continue;
    }

    if (key === "lieu") {
      currentOffer.location = value;
      continue;
    }

    if (key === "fiche locale") {
      currentOffer.localUrl = value;
      continue;
    }

    if (key === "url source") {
      currentOffer.sourceUrl = value;
      continue;
    }

    if (key === "analyse ia") {
      currentOffer.aiAnalysis = value;
      continue;
    }

    if (key === "résumé ia") {
      currentOffer.aiSummary = value;
      continue;
    }

    if (key === "niveau ia") {
      currentOffer.aiExperienceLevel = value;
      continue;
    }

    if (key === "télétravail ia") {
      currentOffer.aiRemotePolicy = value;
      continue;
    }

    if (key === "salaire mentionné ia") {
      currentOffer.aiSalaryMentioned = value;
      continue;
    }

    if (key === "mode analyse ia") {
      currentOffer.aiMode = value;
      continue;
    }

    if (key === "modèle ia") {
      currentOffer.aiModel = value;
      continue;
    }

    if (key === "tokens ia") {
      currentOffer.aiTokens = value;
      continue;
    }

    if (key === "signaux positifs ia") {
      currentOffer.aiPositiveSignals = value;
      continue;
    }

    if (key === "points de vigilance ia") {
      currentOffer.aiRedFlags = value;
      continue;
    }
  }

  pushCurrentOffer();

  return sections;
}

function getOffersFromSections(
  sections: PrioritySectionDigest[],
  sectionTitles: string[],
  maxOffers: number,
): PriorityOfferDigest[] {
  const normalizedSectionTitles = sectionTitles.map((title) =>
    title.toLowerCase(),
  );

  return sections
    .filter((section) =>
      normalizedSectionTitles.some((title) =>
        section.title.toLowerCase().includes(title),
      ),
    )
    .flatMap((section) => section.offers)
    .slice(0, maxOffers);
}

function formatOfferDigest(
  offer: PriorityOfferDigest,
  index: number,
): string[] {
  const metaParts = [
    offer.score,
    offer.priority ? `Priorité : ${offer.priority}` : null,
    offer.company,
    offer.location,
  ].filter(Boolean);

  const lines = [`${index}. ${offer.title}`];

  if (metaParts.length > 0) {
    lines.push(`   ${metaParts.join(" · ")}`);
  }

  if (offer.localUrl) {
    lines.push(`   Fiche locale : ${offer.localUrl}`);
  }

  if (offer.sourceUrl) {
    lines.push(`   URL source : ${offer.sourceUrl}`);
  }
  if (offer.aiSummary) {
    lines.push(`   Résumé IA : ${offer.aiSummary}`);
  }

  if (offer.aiExperienceLevel || offer.aiRemotePolicy) {
    lines.push(
      `   IA : niveau=${offer.aiExperienceLevel ?? "—"} · télétravail=${
        offer.aiRemotePolicy ?? "—"
      }`,
    );
  }

  if (offer.aiPositiveSignals) {
    lines.push(`   Signaux IA : ${offer.aiPositiveSignals}`);
  }

  if (offer.aiRedFlags) {
    lines.push(`   Vigilances IA : ${offer.aiRedFlags}`);
  }

  const usefulReasons = offer.reasons.slice(0, 2);

  if (usefulReasons.length > 0) {
    lines.push(`   Pourquoi : ${usefulReasons.join(" ; ")}`);
  }

  return lines;
}

function formatOfferList(
  offers: PriorityOfferDigest[],
  emptyMessage: string,
): string[] {
  if (offers.length === 0) {
    return [emptyMessage];
  }

  return offers.flatMap((offer, index) => [
    ...formatOfferDigest(offer, index + 1),
    "",
  ]);
}

function limitLines(lines: string[], maxLines: number): string[] {
  if (lines.length <= maxLines) {
    return lines;
  }

  return [
    ...lines.slice(0, maxLines),
    "",
    `… ${lines.length - maxLines} ligne(s) masquée(s) dans ce digest.`,
  ];
}

function getBadgeStyle(priority?: string): string {
  const normalizedPriority = priority?.toLowerCase() ?? "";

  if (normalizedPriority.includes("très")) {
    return "background:#dcfce7;color:#166534;border:1px solid #bbf7d0;";
  }

  if (normalizedPriority.includes("intéressante")) {
    return "background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe;";
  }

  if (normalizedPriority.includes("analyser")) {
    return "background:#fef3c7;color:#92400e;border:1px solid #fde68a;";
  }

  if (normalizedPriority.includes("surveiller")) {
    return "background:#f5f3ff;color:#6d28d9;border:1px solid #ddd6fe;";
  }

  return "background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;";
}

function buildStatCardHtml(label: string, value: string | null): string {
  return `
    <td style="padding:8px;width:25%;vertical-align:top;">
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;min-height:78px;">
        <div style="font-size:12px;line-height:18px;color:#64748b;margin-bottom:6px;">
          ${escapeHtml(label)}
        </div>
        <div style="font-size:22px;line-height:28px;font-weight:700;color:#0f172a;">
          ${escapeHtml(value ?? "—")}
        </div>
      </div>
    </td>
  `;
}

function buildSummaryHtml(summaryItems: SummaryItem[]): string {
  const mode = getSummaryValue(summaryItems, "Mode rapport");
  const profile = getSummaryValue(summaryItems, "Profil candidat");
  const scenario = getSummaryValue(summaryItems, "Scénario de recherche");
  const locations = getSummaryValue(summaryItems, "Zones ciblées");

  const realOffers = getSummaryValue(summaryItems, "Offres réelles en base");
  const aiCandidates = getSummaryValue(
    summaryItems,
    "Offres candidates à l’analyse IA",
  );
  const priorityQueue = getSummaryValue(
    summaryItems,
    "Offres dans la file de priorité",
  );
  const ignoredOffers = getSummaryValue(
    summaryItems,
    "Offres écartées par heuristique",
  );

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 18px;">
      <tr>
        ${buildStatCardHtml("Offres réelles", realOffers)}
        ${buildStatCardHtml("À analyser IA", aiCandidates)}
        ${buildStatCardHtml("File de priorité", priorityQueue)}
        ${buildStatCardHtml("Écartées", ignoredOffers)}
      </tr>
    </table>

    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin-bottom:22px;">
      <p style="margin:0 0 8px;font-size:14px;line-height:21px;color:#334155;">
        <strong style="color:#0f172a;">Mode :</strong> ${escapeHtml(mode ?? "—")}
      </p>
      <p style="margin:0 0 8px;font-size:14px;line-height:21px;color:#334155;">
        <strong style="color:#0f172a;">Profil :</strong> ${escapeHtml(profile ?? "—")}
      </p>
      <p style="margin:0 0 8px;font-size:14px;line-height:21px;color:#334155;">
        <strong style="color:#0f172a;">Scénario :</strong> ${escapeHtml(scenario ?? "—")}
      </p>
      <p style="margin:0;font-size:14px;line-height:21px;color:#334155;">
        <strong style="color:#0f172a;">Zones :</strong> ${escapeHtml(locations ?? "—")}
      </p>
    </div>
  `;
}

function buildOfferCardHtml(offer: PriorityOfferDigest, index: number): string {
  const metaParts = [offer.company, offer.location, offer.score].filter(
    (part): part is string => Boolean(part),
  );

  const reasons = offer.reasons.slice(0, 2);

  const reasonsHtml =
    reasons.length > 0
      ? `
        <ul style="margin:12px 0 0;padding-left:18px;color:#475569;font-size:14px;line-height:21px;">
          ${reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
        </ul>
              ${
                offer.aiSummary
                  ? `
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin-top:14px;">
              <div style="font-size:12px;line-height:18px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px;">
                Analyse IA
              </div>
              <p style="margin:0 0 8px;font-size:14px;line-height:21px;color:#334155;">
                ${escapeHtml(offer.aiSummary)}
              </p>
              <p style="margin:0 0 6px;font-size:13px;line-height:19px;color:#475569;">
                <strong>Niveau :</strong> ${escapeHtml(
                  offer.aiExperienceLevel ?? "—",
                )}
                · <strong>Télétravail :</strong> ${escapeHtml(
                  offer.aiRemotePolicy ?? "—",
                )}
                · <strong>Tokens :</strong> ${escapeHtml(offer.aiTokens ?? "—")}
              </p>
              ${
                offer.aiPositiveSignals
                  ? `<p style="margin:0 0 6px;font-size:13px;line-height:19px;color:#166534;"><strong>Signaux positifs :</strong> ${escapeHtml(
                      offer.aiPositiveSignals,
                    )}</p>`
                  : ""
              }
              ${
                offer.aiRedFlags
                  ? `<p style="margin:0;font-size:13px;line-height:19px;color:#991b1b;"><strong>Vigilances :</strong> ${escapeHtml(
                      offer.aiRedFlags,
                    )}</p>`
                  : ""
              }
            </div>
          `
                  : ""
              }
      `
      : "";

  const localLinkHtml = offer.localUrl
    ? `
      <a href="${escapeHtml(offer.localUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:10px;padding:9px 12px;font-size:13px;font-weight:600;margin-right:8px;">
        Fiche locale
      </a>
    `
    : "";

  const sourceLinkHtml = offer.sourceUrl
    ? `
      <a href="${escapeHtml(offer.sourceUrl)}" style="display:inline-block;background:#ffffff;color:#0f172a;text-decoration:none;border-radius:10px;padding:8px 11px;font-size:13px;font-weight:600;border:1px solid #cbd5e1;">
        Source
      </a>
    `
    : "";

  return `
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:18px;margin:0 0 14px;">
      <div style="font-size:12px;line-height:18px;color:#64748b;margin-bottom:8px;">
        Offre ${index}
      </div>

      <h3 style="margin:0 0 8px;font-size:17px;line-height:24px;color:#0f172a;">
        ${escapeHtml(offer.title)}
      </h3>

      <div style="font-size:14px;line-height:21px;color:#475569;margin-bottom:12px;">
        ${metaParts.map((part) => escapeHtml(part)).join(" · ")}
      </div>

      ${
        offer.priority
          ? `<span style="display:inline-block;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:700;${getBadgeStyle(
              offer.priority,
            )}">
              ${escapeHtml(offer.priority)}
            </span>`
          : ""
      }

      ${reasonsHtml}

      ${
        localLinkHtml || sourceLinkHtml
          ? `
            <div style="margin-top:16px;">
              ${localLinkHtml}
              ${sourceLinkHtml}
            </div>
          `
          : ""
      }
    </div>
  `;
}

function buildOfferSectionHtml(
  title: string,
  description: string,
  offers: PriorityOfferDigest[],
  emptyMessage: string,
): string {
  const content =
    offers.length > 0
      ? offers
          .map((offer, index) => buildOfferCardHtml(offer, index + 1))
          .join("")
      : `
        <div style="background:#ffffff;border:1px dashed #cbd5e1;border-radius:14px;padding:16px;color:#64748b;font-size:14px;line-height:21px;">
          ${escapeHtml(emptyMessage)}
        </div>
      `;

  return `
    <div style="margin-bottom:26px;">
      <h2 style="margin:0 0 6px;font-size:20px;line-height:28px;color:#0f172a;">
        ${escapeHtml(title)}
      </h2>
      <p style="margin:0 0 14px;font-size:14px;line-height:21px;color:#64748b;">
        ${escapeHtml(description)}
      </p>
      ${content}
    </div>
  `;
}

function buildQualityHtml(qualityLines: string[]): string {
  const limitedLines = limitLines(qualityLines, 8);

  if (limitedLines.length === 0) {
    return `
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;color:#64748b;font-size:14px;line-height:21px;">
        Aucun point de vigilance qualité trouvé dans le rapport.
      </div>
    `;
  }

  return `
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;">
      <ul style="margin:0;padding-left:18px;color:#475569;font-size:14px;line-height:22px;">
        ${limitedLines
          .map((line) => `<li>${escapeHtml(line.replace(/^-\s*/, ""))}</li>`)
          .join("")}
      </ul>
    </div>
  `;
}

function buildCompleteReportHtml(input: {
  campaignReportUrl: string | null;
  reportFilename: string;
}): string {
  if (!input.campaignReportUrl) {
    return `
      <p style="margin:0 0 10px;font-size:14px;line-height:21px;color:#334155;">
        <strong>Rapport complet :</strong>
        reports/${escapeHtml(input.reportFilename)}
      </p>
    `;
  }

  return `
    <div style="margin:0 0 16px;">
      <a
        href="${escapeHtml(input.campaignReportUrl)}"
        target="_blank"
        style="
          display:inline-block;
          background:#4f46e5;
          color:#ffffff;
          text-decoration:none;
          border-radius:10px;
          padding:12px 18px;
          font-size:14px;
          line-height:20px;
          font-weight:700;
        "
      >
        Voir le rapport complet
      </a>
    </div>

    <p style="margin:0 0 10px;font-size:13px;line-height:20px;color:#64748b;">
      Ouvre le détail persistant de la campagne dans JobRadar IA.
    </p>

    <p style="margin:0 0 10px;font-size:12px;line-height:18px;color:#94a3b8;">
      Rapport source : ${escapeHtml(input.reportFilename)}
    </p>
  `;
}

function buildHtmlEmail(input: {
  reportDate: string;
  summaryItems: SummaryItem[];
  topPriorityOffers: PriorityOfferDigest[];
  aiAnalysisOffers: PriorityOfferDigest[];
  qualityLines: string[];
  reportFilename: string;
  campaignReportUrl: string | null;
}): string {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>JobRadar IA — Rapport de veille </title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      Digest JobRadar IA du ${escapeHtml(input.reportDate)} — offres prioritaires, candidates IA et points de vigilance.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;max-width:760px;">
            <tr>
              <td style="background:#0f172a;border-radius:22px 22px 0 0;padding:28px;">
                <div style="font-size:13px;line-height:18px;color:#93c5fd;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">
                  JobRadar IA
                </div>
                <h1 style="margin:0 0 8px;font-size:28px;line-height:36px;color:#ffffff;">
                  Rapport de veille
                </h1>
                <p style="margin:0;font-size:15px;line-height:23px;color:#cbd5e1;">
                  Rapport du ${escapeHtml(input.reportDate)}
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:#f8fafc;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:24px;">
                ${buildSummaryHtml(input.summaryItems)}

                ${buildOfferSectionHtml(
                  "À regarder en priorité",
                  "Les offres les plus utiles à consulter en premier dans la file de veille.",
                  input.topPriorityOffers,
                  "Aucune offre prioritaire trouvée dans le rapport.",
                )}

                ${buildOfferSectionHtml(
                  "À analyser avec IA",
                  "Les offres qui semblent intéressantes mais qui doivent encore passer par l’analyse IA contrôlée.",
                  input.aiAnalysisOffers,
                  "Aucune offre candidate à l’analyse IA trouvée dans le rapport.",
                )}

                <div style="margin-bottom:26px;">
                  <h2 style="margin:0 0 6px;font-size:20px;line-height:28px;color:#0f172a;">
                    Points de vigilance qualité
                  </h2>
                  <p style="margin:0 0 14px;font-size:14px;line-height:21px;color:#64748b;">
                    Résumé court des alertes utiles avant d’exploiter le rapport.
                  </p>
                  ${buildQualityHtml(input.qualityLines)}
                </div>
              </td>
            </tr>

            <tr>
              <td style="background:#ffffff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 22px 22px;padding:22px 24px;">
                ${buildCompleteReportHtml({
                  campaignReportUrl: input.campaignReportUrl,
                  reportFilename: input.reportFilename,
                })}
                <p style="margin:0;font-size:13px;line-height:20px;color:#64748b;">
                  Aucune candidature n’a été envoyée. Aucun contact externe n’a été effectué.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildJobRadarReportEmailPreview(
  report: LatestJobRadarReport,
  options: BuildJobRadarReportEmailPreviewOptions = {},
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

  const prioritySections = parsePrioritySections(priorityLines);

  const topPriorityOffers = getOffersFromSections(
    prioritySections,
    ["très prometteuses", "intéressantes", "à surveiller"],
    5,
  );
  const aiAnalysisOffers = getOffersFromSections(
    prioritySections,
    ["à analyser avec ia"],
    5,
  );

  const compactSummaryLines = buildCompactSummaryLines(summaryLines);
  const summaryItems = parseSummaryItems(compactSummaryLines);
  const campaignReportUrl = buildCampaignReportUrl({
  appBaseUrl: options.appBaseUrl,
  campaignId: options.campaignId,
  summaryItems,
});
  const subject = `JobRadar IA — Digest de veille du ${reportDate}`;

  const textLines = [
    "Bonjour,",
    "",
    `Voici le digest du rapport de veille JobRadar IA du ${reportDate}.`,
    "",
    "Résumé",
    "------",
    ...(compactSummaryLines.length > 0
      ? compactSummaryLines
      : ["Aucun résumé trouvé dans le rapport."]),
    "",
    "À regarder en priorité",
    "---------------------",
    ...formatOfferList(
      topPriorityOffers,
      "Aucune offre prioritaire trouvée dans le rapport.",
    ),
    "À analyser avec IA",
    "------------------",
    ...formatOfferList(
      aiAnalysisOffers,
      "Aucune offre candidate à l’analyse IA trouvée dans le rapport.",
    ),
    "Points de vigilance qualité",
    "---------------------------",
    ...(qualityLines.length > 0
      ? limitLines(qualityLines, 8)
      : ["Aucun point de vigilance qualité trouvé dans le rapport."]),
    "",
    "Rapport complet",
    "---------------",
    ...(campaignReportUrl
      ? [`Ouvrir le rapport : ${campaignReportUrl}`]
      : [`Fichier local : reports/${report.filename}`]),
    "",
    "Aucune candidature n’a été envoyée.",
    "Aucun contact externe n’a été effectué.",
  ];

  const text = textLines.join("\n");

const html = buildHtmlEmail({
  reportDate,
  summaryItems,
  topPriorityOffers,
  aiAnalysisOffers,
  qualityLines,
  reportFilename: report.filename,
  campaignReportUrl,
});

return {
  subject,
  body: text,
  text,
  html,
  sourceReportPath: report.filePath,
  sourceReportFilename: report.filename,
  campaignReportUrl,
};
}
