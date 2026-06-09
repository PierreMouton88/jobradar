-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "targetRoles" TEXT[],
    "strongSkills" TEXT[],
    "learningSkills" TEXT[],
    "preferredContracts" TEXT[],
    "preferredRemote" TEXT NOT NULL,
    "preferredLocations" TEXT[],
    "positiveSignals" TEXT[],
    "negativeSignals" TEXT[],
    "notes" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchScenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "candidateProfileId" TEXT NOT NULL,
    "targetRoles" TEXT[],
    "keywords" TEXT[],
    "locations" TEXT[],
    "remotePolicies" TEXT[],
    "contractTypes" TEXT[],
    "sourceProviders" TEXT[],
    "sourceNames" TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchScenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateProfile_isDefault_idx" ON "CandidateProfile"("isDefault");

-- CreateIndex
CREATE INDEX "CandidateProfile_isActive_idx" ON "CandidateProfile"("isActive");

-- CreateIndex
CREATE INDEX "SearchScenario_candidateProfileId_idx" ON "SearchScenario"("candidateProfileId");

-- CreateIndex
CREATE INDEX "SearchScenario_isDefault_idx" ON "SearchScenario"("isDefault");

-- CreateIndex
CREATE INDEX "SearchScenario_isActive_idx" ON "SearchScenario"("isActive");

-- AddForeignKey
ALTER TABLE "SearchScenario" ADD CONSTRAINT "SearchScenario_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
