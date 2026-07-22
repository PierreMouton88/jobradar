import "dotenv/config";

import {
  ImportCampaignStatus,
  ImportCampaignOfferAction,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAiAnalysisCandidates } from "@/lib/ai/get-ai-analysis-candidates";
import { getDefaultCandidateProfile } from "@/lib/search-context/get-active-search-context";
import { mapCandidateProfileToScoringProfile } from "@/lib/search-context/map-candidate-profile-to-scoring-profile";

import { buildJobRadarReportEmailPreview } from "@/lib/reports/build-jobradar-report-email-preview";
import { getEmailSmtpConfig } from "@/lib/distribution/email-smtp-config";
import { sendEmailWithSmtp } from "@/lib/distribution/send-email-with-smtp";
import {
  generateJobRadarReport,
  type GeneratedJobRadarReport,
} from "@/lib/reports/generate-jobradar-report";
import { executeAiAnalysisCandidates } from "@/lib/ai/execute-ai-analysis-candidates";

type CliOptions = {
  recentHours: number;
  maxAi: number;
  runAi: boolean;
  send: boolean;
  latestCampaign: boolean;
};

type DailyReportScope =
  | {
      type: "recent-hours";
      recentHours: number;
      sinceDate: Date;
    }
  | {
      type: "campaign";
      campaignId: string;
      startedAt: Date;
      jobOfferIds: string[];
      jobOfferIdSet: Set<string>;
    };

type DailyAiAnalysisCandidate = {
  offer: {
    id: string;
    title?: string;
    company?: string | null;
    url?: string | null;
  };
  score: {
    percentage: number;
  };
  priority: {
    label: string;
    priority: string;
    reasons: Array<{
      type: string;
      label: string;
    }>;
  };
};

function getCliOptionValue(optionName: string): string | null {
  const prefix = `${optionName}=`;

  const inlineArg = process.argv.find((arg) => arg.startsWith(prefix));

  if (inlineArg) {
    return inlineArg.slice(prefix.length);
  }

  const optionIndex = process.argv.indexOf(optionName);

  if (optionIndex !== -1) {
    return process.argv[optionIndex + 1] ?? null;
  }

  return null;
}

function parsePositiveIntegerOption(
  optionName: string,
  defaultValue: number,
): number {
  const rawValue = getCliOptionValue(optionName);

  if (!rawValue) {
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

function parseCliOptions(): CliOptions {
  return {
    recentHours: parsePositiveIntegerOption("--recent-hours", 24),
    maxAi: parsePositiveIntegerOption("--max-ai", 5),
    runAi: process.argv.includes("--run-ai"),
    send: process.argv.includes("--send"),
    latestCampaign: process.argv.includes("--latest-campaign"),
  };
}

function getSinceDate(now: Date, recentHours: number): Date {
  return new Date(now.getTime() - recentHours * 60 * 60 * 1000);
}

function estimateRunTokens(candidatesCount: number) {
  const estimatedTokensPerOffer = 1500;

  return {
    estimatedTokensPerOffer,
    estimatedTotalTokens: candidatesCount * estimatedTokensPerOffer,
  };
}

function uniqueStrings(values: Array<string | null>): string[] {
  return Array.from(
    new Set(
      values.filter((value): value is string => typeof value === "string"),
    ),
  );
}

async function getLatestCampaignScope(): Promise<DailyReportScope> {
  const campaign = await prisma.importCampaign.findFirst({
    where: {
      dryRun: false,
      status: {
        in: [ImportCampaignStatus.SUCCESS, ImportCampaignStatus.PARTIAL],
      },
    },
    orderBy: {
      startedAt: "desc",
    },
    include: {
      offers: {
        where: {
          jobOfferId: {
            not: null,
          },
          action: {
            in: [
              ImportCampaignOfferAction.CREATED,
              ImportCampaignOfferAction.UPDATED,
            ],
          },
        },
        select: {
          jobOfferId: true,
        },
      },
    },
  });

  if (!campaign) {
    throw new Error(
      "Aucune campagne d’import SUCCESS/PARTIAL trouvée. Lance d’abord une campagne depuis /imports ou utilise le mode --recent-hours.",
    );
  }

  const jobOfferIds = uniqueStrings(
    campaign.offers.map((campaignOffer: { jobOfferId: string | null }) =>
      campaignOffer.jobOfferId,
    ),
  );

  return {
    type: "campaign",
    campaignId: campaign.id,
    startedAt: campaign.startedAt,
    jobOfferIds,
    jobOfferIdSet: new Set(jobOfferIds),
  };
}

async function buildDailyReportScope(
  options: CliOptions,
  now: Date,
): Promise<DailyReportScope> {
  if (options.latestCampaign) {
    return getLatestCampaignScope();
  }

  const sinceDate = getSinceDate(now, options.recentHours);

  return {
    type: "recent-hours",
    recentHours: options.recentHours,
    sinceDate,
  };
}

function printSelectedCandidates(
  candidates: DailyAiAnalysisCandidate[],
  scope: DailyReportScope,
) {
  if (candidates.length === 0) {
    console.log(
      scope.type === "campaign"
        ? "Aucune candidate IA trouvée dans la dernière campagne."
        : "Aucune candidate IA trouvée dans la fenêtre analysée.",
    );
    console.log("");
    return;
  }

  console.log("Offres candidates IA sélectionnées :");
  console.log("");

  candidates.forEach((candidate, index) => {
    console.log(`${index + 1}. ${candidate.offer.title ?? "Titre inconnu"}`);
    console.log(
      `   Entreprise : ${candidate.offer.company ?? "Non renseignée"}`,
    );
    console.log(`   Score : ${candidate.score.percentage}%`);
    console.log(
      `   Priorité : ${candidate.priority.label} (${candidate.priority.priority})`,
    );
    console.log(`   URL : ${candidate.offer.url ?? "Non renseignée"}`);

    if (candidate.priority.reasons.length > 0) {
      console.log("   Raisons :");

      candidate.priority.reasons.forEach((reason) => {
        console.log(`   - [${reason.type}] ${reason.label}`);
      });
    }

    console.log("");
  });
}

async function getScopedAiCandidates(
  scope: DailyReportScope,
  profile: Parameters<typeof getAiAnalysisCandidates>[0]["profile"],
  maxAi: number,
): Promise<DailyAiAnalysisCandidate[]> {
  if (scope.type === "recent-hours") {
    return getAiAnalysisCandidates({
      profile,
      limit: maxAi,
      sinceDate: scope.sinceDate,
    });
  }

  return getAiAnalysisCandidates({
    profile,
    limit: maxAi,
    jobOfferIds: scope.jobOfferIds,
  });
}

async function sendGeneratedReportEmail(
  report: GeneratedJobRadarReport,
  scope: DailyReportScope,
) {
  const preview = buildJobRadarReportEmailPreview(report, {
    appBaseUrl: process.env.JOBRADAR_APP_BASE_URL,

    campaignId: scope.type === "campaign" ? scope.campaignId : null,
  });

  const config = getEmailSmtpConfig();

  const result = await sendEmailWithSmtp(
    {
      subject: preview.subject,
      text: preview.text,
      html: preview.html,
    },
    config,
  );

  console.log("Email transmis au serveur SMTP.");
  console.log(`Rapport source : ${report.filePath}`);
  console.log(`Message ID : ${result.messageId}`);
  console.log(`Acceptés : ${result.accepted.join(", ") || "aucun"}`);
  console.log(`Rejetés : ${result.rejected.join(", ") || "aucun"}`);
  console.log("");
}

async function main() {
  const options = parseCliOptions();
  const now = new Date();
  const scope = await buildDailyReportScope(options, now);

  console.log("");
  console.log("JobRadar IA — Daily report");
  console.log("-----------------------------------");

  if (scope.type === "campaign") {
    console.log(`Périmètre : dernière campagne d’import (${scope.campaignId})`);
    console.log(`Offres liées au batch : ${scope.jobOfferIds.length}`);
  } else {
    console.log(`Fenêtre : dernières ${scope.recentHours}h`);
  }

  console.log(`Max analyses IA : ${options.maxAi}`);
  console.log(`Analyse IA réelle : ${options.runAi ? "oui" : "non"}`);
  console.log(`Envoi email réel : ${options.send ? "oui" : "non"}`);
  console.log("");

  const profile = await getDefaultCandidateProfile();

  if (!profile) {
    throw new Error(
      "Aucun profil candidat actif trouvé. Lance le seed ou vérifie la table CandidateProfile.",
    );
  }

  const scoringProfile = mapCandidateProfileToScoringProfile(profile);

  const candidates = await getScopedAiCandidates(
    scope,
    scoringProfile,
    options.maxAi,
  );

  printSelectedCandidates(candidates, scope);

  const estimatedRun = estimateRunTokens(candidates.length);

  console.log("Estimation indicative avant analyse :");
  console.log(`~${estimatedRun.estimatedTokensPerOffer} tokens par offre`);
  console.log(`~${estimatedRun.estimatedTotalTokens} tokens au total`);
  console.log("");

  const aiExecution = await executeAiAnalysisCandidates({
    candidates,
    maxAnalyses: options.maxAi,
    execute: options.runAi,
  });

  if (aiExecution.mode === "DRY_RUN") {
    console.log("Aucun appel IA effectué.");
    console.log("Ajoute --run-ai pour lancer les analyses IA réelles.");
    console.log("");
  } else {
    console.log("Résultat des analyses IA :");
    console.log("");

    for (const item of aiExecution.items) {
      if (item.status === "SUCCESS") {
        console.log(
          `✓ ${item.title} — mode=${item.analysisMode}, tokens=${item.totalTokens}`,
        );

        continue;
      }

      console.error(`✗ ${item.title} — ${item.errorMessage}`);
    }

    console.log("");
    console.log(
      `Analyses réussies : ${aiExecution.summary.successfulAnalyses}`,
    );
    console.log(`Analyses en erreur : ${aiExecution.summary.failedAnalyses}`);
    console.log(`Tokens consommés : ${aiExecution.summary.totalTokens}`);
    console.log("");
  }

  console.log("Génération du rapport scoped...");
  console.log("");

  const report = await generateJobRadarReport({
    now,

    scope:
      scope.type === "campaign"
        ? {
            type: "campaign",
            campaignId: scope.campaignId,
          }
        : {
            type: "recent-hours",
            recentHours: scope.recentHours,
          },

    appBaseUrl: process.env.JOBRADAR_APP_BASE_URL,
  });

  console.log(`Rapport généré : ${report.filePath}`);
  console.log(`Offres dans le périmètre : ${report.scopedOffersCount}`);
  console.log("");
  if (!options.send) {
    console.log("Aucun email envoyé.");
    console.log("Ajoute --send pour envoyer réellement le digest.");
    console.log("");
    console.log("Tu peux prévisualiser le digest avec :");
    console.log("");
    console.log("  npm run report:email:preview");
    console.log("");
    return;
  }

  console.log("Envoi du digest email...");
  console.log("");

  await sendGeneratedReportEmail(report, scope);
}

main()
  .catch((error) => {
    console.error("");
    console.error("Erreur pendant le daily report :");
    console.error(error);
    console.error("");

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
