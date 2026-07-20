import "dotenv/config";

import { spawn } from "node:child_process";
import {
  ImportCampaignOfferAction,
  ImportCampaignStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAiAnalysisCandidates } from "@/lib/ai/get-ai-analysis-candidates";
import { analyzeAndSaveJobOffer } from "@/lib/ai/analyze-and-save-job-offer";
import { getDefaultCandidateProfile } from "@/lib/search-context/get-active-search-context";
import { mapCandidateProfileToScoringProfile } from "@/lib/search-context/map-candidate-profile-to-scoring-profile";
import { mapDbOfferToScorableOffer } from "@/lib/scoring/map-db-offer-to-scorable-offer";
import { scoreJobOffer } from "@/lib/scoring/score-job-offer";
import { prioritizeJobOffer } from "@/lib/scoring/prioritize-job-offer";
import { readLatestJobRadarReport } from "@/lib/reports/read-latest-jobradar-report";
import { buildJobRadarReportEmailPreview } from "@/lib/reports/build-jobradar-report-email-preview";
import { getEmailSmtpConfig } from "@/lib/distribution/email-smtp-config";
import { sendEmailWithSmtp } from "@/lib/distribution/send-email-with-smtp";

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
    new Set(values.filter((value): value is string => typeof value === "string")),
  );
}

function runTsxScript(scriptPath: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("tsx", [scriptPath, ...args], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${scriptPath} exited with code ${code}`));
    });
  });
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
    campaign.offers.map((campaignOffer) => campaignOffer.jobOfferId),
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

async function generateScopedReport(scope: DailyReportScope) {
  if (scope.type === "campaign") {
    await runTsxScript("scripts/generate-jobradar-report.ts", [
      `--campaign-id=${scope.campaignId}`,
    ]);
    return;
  }

  await runTsxScript("scripts/generate-jobradar-report.ts", [
    `--recent-hours=${scope.recentHours}`,
  ]);
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

  if (scope.jobOfferIds.length === 0) {
    return [];
  }

const batchOffersWithoutAnalysis = await prisma.jobOffer.findMany({
  where: {
    id: {
      in: scope.jobOfferIds,
    },
    analysis: null,
  },
  include: {
    analysis: true,
  },
});

  return batchOffersWithoutAnalysis
    .map((offer) => {
      const scorableOffer = mapDbOfferToScorableOffer(offer);
      const score = scoreJobOffer(scorableOffer, profile);
      const priority = prioritizeJobOffer(scorableOffer, score);

      return {
        offer: {
          id: offer.id,
          title: offer.title,
          company: offer.company,
          url: offer.url,
        },
        score,
        priority,
      };
    })
    .filter(({ priority }) => priority.priority === "needs_ai_analysis")
    .sort((a, b) => b.score.percentage - a.score.percentage)
    .slice(0, maxAi);
}

async function sendLatestReportEmail(
  scope: DailyReportScope,
) {  const report = await readLatestJobRadarReport();

  if (!report) {
    throw new Error(
      "Aucun rapport JobRadar trouvé. La génération du rapport a probablement échoué.",
    );
  }

const preview = buildJobRadarReportEmailPreview(
  report,
  {
    appBaseUrl:
      process.env.JOBRADAR_APP_BASE_URL,

    campaignId:
      scope.type === "campaign"
        ? scope.campaignId
        : null,
  },
);
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

  if (!options.runAi) {
    console.log("Aucun appel IA effectué.");
    console.log("Ajoute --run-ai pour lancer les analyses IA réelles.");
    console.log("");
  } else {
    console.log("Lancement des analyses IA contrôlées...");
    console.log("");

    for (const candidate of candidates) {
      console.log(`Analyse : ${candidate.offer.title ?? candidate.offer.id}`);

      const result = await analyzeAndSaveJobOffer(candidate.offer.id);

      console.log(
        `✓ Analyse sauvegardée — mode=${result.analysisMode}, tokens=${result.totalTokens}`,
      );
    }

    console.log("");
    console.log(`Analyses terminées : ${candidates.length}`);
    console.log("");
  }

  console.log("Génération du rapport scoped...");
  console.log("");

  await generateScopedReport(scope);

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

await sendLatestReportEmail(scope);
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