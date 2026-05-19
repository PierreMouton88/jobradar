-- CreateTable
CREATE TABLE "JobAnalysis" (
    "id" TEXT NOT NULL,
    "jobOfferId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "requiredSkills" TEXT[],
    "niceToHaveSkills" TEXT[],
    "experienceLevel" TEXT NOT NULL,
    "remotePolicy" TEXT NOT NULL,
    "salaryMentioned" BOOLEAN NOT NULL,
    "redFlags" TEXT[],
    "positiveSignals" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobAnalysis_jobOfferId_key" ON "JobAnalysis"("jobOfferId");

-- CreateIndex
CREATE INDEX "JobAnalysis_experienceLevel_idx" ON "JobAnalysis"("experienceLevel");

-- CreateIndex
CREATE INDEX "JobAnalysis_remotePolicy_idx" ON "JobAnalysis"("remotePolicy");

-- AddForeignKey
ALTER TABLE "JobAnalysis" ADD CONSTRAINT "JobAnalysis_jobOfferId_fkey" FOREIGN KEY ("jobOfferId") REFERENCES "JobOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
