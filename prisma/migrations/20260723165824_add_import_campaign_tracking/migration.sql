-- CreateEnum
CREATE TYPE "ImportCampaignStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportCampaignRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportCampaignOfferAction" AS ENUM ('CREATED', 'UPDATED', 'REJECTED_BY_RELEVANCE', 'PREVIEW_ERROR', 'IMPORT_ERROR');

-- CreateTable
CREATE TABLE "ImportCampaign" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'apify',
    "status" "ImportCampaignStatus" NOT NULL DEFAULT 'RUNNING',
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "selectedSources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "selectedLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "searchScenarioId" TEXT,
    "searchScenarioName" TEXT,
    "candidateProfileId" TEXT,
    "candidateName" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "totalRawItems" INTEGER NOT NULL DEFAULT 0,
    "totalMappedOffers" INTEGER NOT NULL DEFAULT 0,
    "totalPreparedOffers" INTEGER NOT NULL DEFAULT 0,
    "totalUniqueOffers" INTEGER NOT NULL DEFAULT 0,
    "totalAcceptedByRelevance" INTEGER NOT NULL DEFAULT 0,
    "totalRejectedByRelevance" INTEGER NOT NULL DEFAULT 0,
    "totalCreated" INTEGER NOT NULL DEFAULT 0,
    "totalUpdated" INTEGER NOT NULL DEFAULT 0,
    "totalDuplicatesSkipped" INTEGER NOT NULL DEFAULT 0,
    "totalErrors" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportCampaignRun" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "actorId" TEXT,
    "displayName" TEXT,
    "location" TEXT,
    "limit" INTEGER,
    "sourceLabel" TEXT,
    "status" "ImportCampaignRunStatus" NOT NULL DEFAULT 'RUNNING',
    "rawItems" INTEGER NOT NULL DEFAULT 0,
    "mappedOffers" INTEGER NOT NULL DEFAULT 0,
    "preparedOffers" INTEGER NOT NULL DEFAULT 0,
    "uniqueOffers" INTEGER NOT NULL DEFAULT 0,
    "duplicatesSkipped" INTEGER NOT NULL DEFAULT 0,
    "previewErrors" INTEGER NOT NULL DEFAULT 0,
    "relevanceFilterEnabled" BOOLEAN NOT NULL DEFAULT false,
    "relevanceFilterMinScore" INTEGER,
    "acceptedByRelevance" INTEGER NOT NULL DEFAULT 0,
    "rejectedByRelevance" INTEGER NOT NULL DEFAULT 0,
    "relevanceRejectionReasonCounts" JSONB,
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "scrapingRunId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportCampaignRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportCampaignOffer" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "campaignRunId" TEXT,
    "jobOfferId" TEXT,
    "action" "ImportCampaignOfferAction" NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT,
    "title" TEXT,
    "company" TEXT,
    "location" TEXT,
    "url" TEXT,
    "relevanceScore" INTEGER,
    "relevanceReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportCampaignOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportCampaign_status_idx" ON "ImportCampaign"("status");

-- CreateIndex
CREATE INDEX "ImportCampaign_dryRun_idx" ON "ImportCampaign"("dryRun");

-- CreateIndex
CREATE INDEX "ImportCampaign_startedAt_idx" ON "ImportCampaign"("startedAt");

-- CreateIndex
CREATE INDEX "ImportCampaign_sourceType_idx" ON "ImportCampaign"("sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "ImportCampaignRun_scrapingRunId_key" ON "ImportCampaignRun"("scrapingRunId");

-- CreateIndex
CREATE INDEX "ImportCampaignRun_campaignId_idx" ON "ImportCampaignRun"("campaignId");

-- CreateIndex
CREATE INDEX "ImportCampaignRun_source_idx" ON "ImportCampaignRun"("source");

-- CreateIndex
CREATE INDEX "ImportCampaignRun_status_idx" ON "ImportCampaignRun"("status");

-- CreateIndex
CREATE INDEX "ImportCampaignRun_startedAt_idx" ON "ImportCampaignRun"("startedAt");

-- CreateIndex
CREATE INDEX "ImportCampaignOffer_campaignId_idx" ON "ImportCampaignOffer"("campaignId");

-- CreateIndex
CREATE INDEX "ImportCampaignOffer_campaignRunId_idx" ON "ImportCampaignOffer"("campaignRunId");

-- CreateIndex
CREATE INDEX "ImportCampaignOffer_jobOfferId_idx" ON "ImportCampaignOffer"("jobOfferId");

-- CreateIndex
CREATE INDEX "ImportCampaignOffer_action_idx" ON "ImportCampaignOffer"("action");

-- CreateIndex
CREATE INDEX "ImportCampaignOffer_source_idx" ON "ImportCampaignOffer"("source");

-- CreateIndex
CREATE INDEX "ImportCampaignOffer_url_idx" ON "ImportCampaignOffer"("url");

-- AddForeignKey
ALTER TABLE "ImportCampaignRun" ADD CONSTRAINT "ImportCampaignRun_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ImportCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportCampaignRun" ADD CONSTRAINT "ImportCampaignRun_scrapingRunId_fkey" FOREIGN KEY ("scrapingRunId") REFERENCES "ScrapingRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportCampaignOffer" ADD CONSTRAINT "ImportCampaignOffer_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ImportCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportCampaignOffer" ADD CONSTRAINT "ImportCampaignOffer_campaignRunId_fkey" FOREIGN KEY ("campaignRunId") REFERENCES "ImportCampaignRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportCampaignOffer" ADD CONSTRAINT "ImportCampaignOffer_jobOfferId_fkey" FOREIGN KEY ("jobOfferId") REFERENCES "JobOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
