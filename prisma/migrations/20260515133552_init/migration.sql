-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('CDI', 'CDD', 'STAGE', 'ALTERNANCE', 'FREELANCE', 'INCONNU');

-- CreateEnum
CREATE TYPE "ScrapingRunStatus" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "JobOffer" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "contractType" "ContractType" NOT NULL DEFAULT 'INCONNU',
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "skills" TEXT[],
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scrapingRunId" TEXT,

    CONSTRAINT "JobOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapingRun" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "ScrapingRunStatus" NOT NULL DEFAULT 'SUCCESS',
    "offersCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScrapingRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobOffer_url_key" ON "JobOffer"("url");

-- CreateIndex
CREATE INDEX "JobOffer_source_idx" ON "JobOffer"("source");

-- CreateIndex
CREATE INDEX "JobOffer_contractType_idx" ON "JobOffer"("contractType");

-- CreateIndex
CREATE INDEX "JobOffer_scrapedAt_idx" ON "JobOffer"("scrapedAt");

-- CreateIndex
CREATE INDEX "ScrapingRun_source_idx" ON "ScrapingRun"("source");

-- CreateIndex
CREATE INDEX "ScrapingRun_status_idx" ON "ScrapingRun"("status");

-- CreateIndex
CREATE INDEX "ScrapingRun_startedAt_idx" ON "ScrapingRun"("startedAt");

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_scrapingRunId_fkey" FOREIGN KEY ("scrapingRunId") REFERENCES "ScrapingRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
