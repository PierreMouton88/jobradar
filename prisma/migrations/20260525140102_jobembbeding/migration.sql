-- CreateTable
CREATE TABLE "JobOfferEmbedding" (
    "id" TEXT NOT NULL,
    "jobOfferId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "modelName" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobOfferEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobOfferEmbedding_jobOfferId_key" ON "JobOfferEmbedding"("jobOfferId");

-- CreateIndex
CREATE INDEX "JobOfferEmbedding_jobOfferId_idx" ON "JobOfferEmbedding"("jobOfferId");

-- AddForeignKey
ALTER TABLE "JobOfferEmbedding" ADD CONSTRAINT "JobOfferEmbedding_jobOfferId_fkey" FOREIGN KEY ("jobOfferId") REFERENCES "JobOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
