import {
  ImportCampaignOfferAction,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { runApifyImportCampaign } from "@/lib/imports/run-apify-import-campaign-core";
import { executeCampaignRagSync } from "@/lib/rag/execute-campaign-rag-sync";
import { getAiAnalysisCandidates } from "@/lib/ai/get-ai-analysis-candidates";
import { executeAiAnalysisCandidates } from "@/lib/ai/execute-ai-analysis-candidates";
import { getDefaultCandidateProfile } from "@/lib/search-context/get-active-search-context";
import { mapCandidateProfileToScoringProfile } from "@/lib/search-context/map-candidate-profile-to-scoring-profile";
import { generateJobRadarReport } from "@/lib/reports/generate-jobradar-report";
import { buildJobRadarReportEmailPreview } from "@/lib/reports/build-jobradar-report-email-preview";
import { getEmailSmtpConfig } from "@/lib/distribution/email-smtp-config";
import { sendEmailWithSmtp } from "@/lib/distribution/send-email-with-smtp";
import type { RunDailyJobRadarWorkflowDependencies } from "@/lib/workflows/run-daily-jobradar-workflow";

export const DAILY_JOBRADAR_WORKFLOW_DEPENDENCIES: RunDailyJobRadarWorkflowDependencies =
  {
    runImport: async ({
      maxLocations,
      maxOffersPerPlan,
    }) => {
      const report =
        await runApifyImportCampaign({
          dryRun: false,
          maxLocations,
          limitPerPlan: maxOffersPerPlan,
        });

      return {
        campaignId: report.campaignId,
      };
    },

    getCampaignJobOfferIds: async (
      campaignId,
    ) => {
      const campaignOffers =
        await prisma.importCampaignOffer.findMany({
          where: {
            campaignId,
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
        });

      return Array.from(
        new Set(
          campaignOffers
            .map((offer) => offer.jobOfferId)
            .filter(
              (
                jobOfferId,
              ): jobOfferId is string =>
                jobOfferId !== null,
            ),
        ),
      );
    },

    runRag: async ({
      campaignId,
      maxDocuments,
      maxEmbeddings,
    }) => {
      const result =
        await executeCampaignRagSync({
          campaignId,
          execute: true,
          maxDocuments,
          maxEmbeddings,
        });

      return {
        errors: result.summary.errors,
        successfulDocuments:
          result.summary.successfulDocuments,
      };
    },

    runAi: async ({
      jobOfferIds,
      maxAnalyses,
    }) => {
      const candidateProfile =
        await getDefaultCandidateProfile();

      if (!candidateProfile) {
        throw new Error(
          "Aucun profil candidat actif trouvé.",
        );
      }

      const scoringProfile =
        mapCandidateProfileToScoringProfile(
          candidateProfile,
        );

      const candidates =
        await getAiAnalysisCandidates({
          profile: scoringProfile,
          limit: maxAnalyses,
          jobOfferIds,
        });

      const result =
        await executeAiAnalysisCandidates({
          candidates,
          maxAnalyses,
          execute: true,
        });

      return {
        failedAnalyses:
          result.summary.failedAnalyses,
        successfulAnalyses:
          result.summary.successfulAnalyses,
        totalTokens:
          result.summary.totalTokens,
      };
    },

    generateReport: async ({
      now,
      campaignId,
      recentHours,
    }) => {
      return generateJobRadarReport({
        now,
        appBaseUrl:
          process.env.JOBRADAR_APP_BASE_URL,

        scope: campaignId
          ? {
              type: "campaign",
              campaignId,
            }
          : {
              type: "recent-hours",
              recentHours,
            },
      });
    },

    sendReportEmail: async ({
      report,
      campaignId,
    }) => {
      const preview =
        buildJobRadarReportEmailPreview(
          report,
          {
            appBaseUrl:
              process.env
                .JOBRADAR_APP_BASE_URL,
            campaignId,
          },
        );

      const smtpConfig =
        getEmailSmtpConfig();

      const result =
        await sendEmailWithSmtp(
          {
            subject: preview.subject,
            text: preview.text,
            html: preview.html,
          },
          smtpConfig,
        );

      return {
        messageId: result.messageId,
      };
    },
  };

  export async function disconnectDailyJobRadarWorkflowDependencies() {
  await prisma.$disconnect();
}