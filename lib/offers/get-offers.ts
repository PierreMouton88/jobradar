import type { ContractType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { JobOffer } from "@/types/job-offer";
import { mapContractTypeFromDb } from "@/lib/offers/offer-normalization";
import { candidateProfile } from "@/lib/profile/candidate-profile";
import { scoreJobOffer } from "@/lib/scoring/score-job-offer";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

type DateRangeFilter = "1d" | "7d" | "14d" | "30d";
type SourceFilter = "static-html" | "fake-dynamic-jobs" | "indeed" | "linkedin";
type RemoteFilter = "true" | "false";

type ContractTypeFilter =
  | "CDI"
  | "CDD"
  | "Stage"
  | "Alternance"
  | "Freelance"
  | "Inconnu";

type SortFilter = "scrapedAt-desc" | "createdAt-desc";

export type GetOffersParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  remote?: RemoteFilter;
  dateRange?: DateRangeFilter;
  source?: SourceFilter;
  contractType?: ContractTypeFilter;
  sort?: SortFilter;
};

export type GetOffersResult = {
  offers: JobOffer[];
  pagination: {
    page: number;
    pageSize: number;
    totalOffers: number;
    totalPages: number;
  };
};

function normalizePage(value: number | undefined): number {
  if (!value || Number.isNaN(value) || value < 1) {
    return DEFAULT_PAGE;
  }

  return Math.floor(value);
}

function normalizePageSize(value: number | undefined): number {
  if (!value || Number.isNaN(value) || value < 1) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(Math.floor(value), MAX_PAGE_SIZE);
}

function getScrapedAtFilter(
  dateRange: DateRangeFilter | undefined,
): Date | undefined {
  if (!dateRange) {
    return undefined;
  }

  const now = new Date();

  const daysByRange: Record<DateRangeFilter, number> = {
    "1d": 1,
    "7d": 7,
    "14d": 14,
    "30d": 30,
  };

  const date = new Date(now);
  date.setDate(now.getDate() - daysByRange[dateRange]);

  return date;
}

function mapContractTypeFilterToDb(
  contractType: ContractTypeFilter | undefined,
): ContractType | undefined {
  if (!contractType) {
    return undefined;
  }

  const contractTypesByUiValue: Record<ContractTypeFilter, ContractType> = {
    CDI: "CDI",
    CDD: "CDD",
    Stage: "STAGE",
    Alternance: "ALTERNANCE",
    Freelance: "FREELANCE",
    Inconnu: "INCONNU",
  };

  return contractTypesByUiValue[contractType];
}

function getOrderBy(
  sort: SortFilter | undefined,
): Prisma.JobOfferOrderByWithRelationInput {
  switch (sort) {
    case "createdAt-desc":
      return {
        createdAt: "desc",
      };

    case "scrapedAt-desc":
    default:
      return {
        scrapedAt: "desc",
      };
  }
}

function mapDbOfferToJobOffer(
  offer: Prisma.JobOfferGetPayload<{
    include: {
      analysis: true;
    };
  }>,
): JobOffer {
  const contractType = mapContractTypeFromDb(offer.contractType);

  const analysisForScore = offer.analysis
    ? {
        experienceLevel: offer.analysis.experienceLevel as
          | "internship"
          | "junior"
          | "mid"
          | "senior"
          | "unknown",
        remotePolicy: offer.analysis.remotePolicy as
          | "on_site"
          | "hybrid"
          | "full_remote"
          | "unknown",
        salaryMentioned: offer.analysis.salaryMentioned,
        redFlags: offer.analysis.redFlags,
        positiveSignals: offer.analysis.positiveSignals,
      }
    : null;

  return {
    id: offer.id,
    title: offer.title,
    company: offer.company,
    location: offer.location,
    contractType,
    remote: offer.remote,
    skills: offer.skills,
    description: offer.description,
    source: offer.source,
    url: offer.url,
    createdAt: offer.createdAt.toISOString(),
    analysis: offer.analysis
      ? {
          summary: offer.analysis.summary,
          requiredSkills: offer.analysis.requiredSkills,
          niceToHaveSkills: offer.analysis.niceToHaveSkills,
          experienceLevel: offer.analysis.experienceLevel,
          remotePolicy: offer.analysis.remotePolicy,
          salaryMentioned: offer.analysis.salaryMentioned,
          redFlags: offer.analysis.redFlags,
          positiveSignals: offer.analysis.positiveSignals,
          analysisMode: offer.analysis.analysisMode,
          modelName: offer.analysis.modelName,
          inputTokens: offer.analysis.inputTokens,
          outputTokens: offer.analysis.outputTokens,
          totalTokens: offer.analysis.totalTokens,
        }
      : null,
    score: scoreJobOffer(
      {
        skills: offer.skills,
        contractType,
        location: offer.location,
        qualityScore: offer.qualityScore,
        analysis: analysisForScore,
      },
      candidateProfile,
    ),
  };
}

export async function getOffers(
  params: GetOffersParams = {},
): Promise<GetOffersResult> {
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const skip = (page - 1) * pageSize;

  const search = params.search?.trim();
  const scrapedAfter = getScrapedAtFilter(params.dateRange);
  const contractType = mapContractTypeFilterToDb(params.contractType);

  const where: Prisma.JobOfferWhereInput = {
    ...(params.remote
      ? {
          remote: params.remote === "true",
        }
      : {}),

    ...(scrapedAfter
      ? {
          scrapedAt: {
            gte: scrapedAfter,
          },
        }
      : {}),

    ...(params.source
      ? {
          source:
            params.source === "indeed" || params.source === "linkedin"
              ? {
                  contains: `apify:${params.source}:`,
                  mode: "insensitive",
                }
              : params.source,
        }
      : {}),

    ...(contractType
      ? {
          contractType,
        }
      : {}),

    ...(search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              company: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              location: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const [offers, totalOffers] = await Promise.all([
    prisma.jobOffer.findMany({
      where,
      orderBy: getOrderBy(params.sort),
      skip,
      take: pageSize,
      include: {
        analysis: true,
      },
    }),
    prisma.jobOffer.count({
      where,
    }),
  ]);

  return {
    offers: offers.map(mapDbOfferToJobOffer),
    pagination: {
      page,
      pageSize,
      totalOffers,
      totalPages: Math.max(1, Math.ceil(totalOffers / pageSize)),
    },
  };
}

export async function getOfferById(id: string): Promise<JobOffer | null> {
  const offer = await prisma.jobOffer.findUnique({
    where: {
      id,
    },
    include: {
      analysis: true,
    },
  });

  if (!offer) {
    return null;
  }

  return mapDbOfferToJobOffer(offer);
}