-- AlterTable
ALTER TABLE "JobAnalysis" ADD COLUMN     "analysisMode" TEXT NOT NULL DEFAULT 'fake',
ADD COLUMN     "inputTokens" INTEGER,
ADD COLUMN     "modelName" TEXT,
ADD COLUMN     "outputTokens" INTEGER,
ADD COLUMN     "totalTokens" INTEGER;

-- CreateIndex
CREATE INDEX "JobAnalysis_analysisMode_idx" ON "JobAnalysis"("analysisMode");
