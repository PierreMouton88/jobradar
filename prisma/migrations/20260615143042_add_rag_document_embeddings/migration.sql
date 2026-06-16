-- CreateTable
CREATE TABLE "RagDocumentEmbedding" (
  "id" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "embedding" vector(1536) NOT NULL,
  "modelName" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RagDocumentEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RagDocumentEmbedding_sourceType_idx" ON "RagDocumentEmbedding"("sourceType");

-- CreateIndex
CREATE INDEX "RagDocumentEmbedding_sourceId_idx" ON "RagDocumentEmbedding"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "RagDocumentEmbedding_sourceType_sourceId_key" ON "RagDocumentEmbedding"("sourceType", "sourceId");
