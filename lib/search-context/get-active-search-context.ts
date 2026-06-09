import { prisma } from "@/lib/prisma";

export async function getDefaultCandidateProfile() {
  return prisma.candidateProfile.findFirst({
    where: {
      isDefault: true,
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getDefaultSearchScenario() {
  return prisma.searchScenario.findFirst({
    where: {
      isDefault: true,
      isActive: true,
      candidateProfile: {
        isActive: true,
      },
    },
    include: {
      candidateProfile: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getActiveSearchContext() {
  const searchScenario = await getDefaultSearchScenario();

  if (!searchScenario) {
    return null;
  }

  return {
    candidateProfile: searchScenario.candidateProfile,
    searchScenario,
  };
}