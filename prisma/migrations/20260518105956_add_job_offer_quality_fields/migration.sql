-- AlterTable
ALTER TABLE "JobOffer" ADD COLUMN     "qualityIssues" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "qualityScore" INTEGER NOT NULL DEFAULT 100;
