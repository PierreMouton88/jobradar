import type { ContractType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { JobOffer } from "@/types/job-offer";
import { mapContractTypeFromDb } from "@/lib/offers/offer-normalization";
import { candidateProfile } from "@/lib/profile/candidate-profile";
import { scoreJobOffer } from "@/lib/scoring/score-job-offer";
import {
  prioritizeJobOffer,
  type OfferPriorityLevel,
} from "@/lib/scoring/prioritize-job-offer";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

type DateRangeFilter = "1d" | "7d" | "14d" | "30d";
type SourceFilter =
  | "static-html"
  | "fake-dynamic-jobs"
  | "indeed"
  | "linkedin"
  | "meteojob";
type RemoteFilter = "true" | "false";

type ContractTypeFilter =
  | "CDI"
  | "CDD"
  | "Stage"
  | "Alternance"
  | "Freelance"
  | "Inconnu";

type SortFilter = "scrapedAt-desc" | "createdAt-desc" | "priority-desc";
type PriorityFilter = OfferPriorityLevel;

export type GetOffersParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  remote?: RemoteFilter;
  dateRange?: DateRangeFilter;
  source?: SourceFilter;
  contractType?: ContractTypeFilter;
  sort?: SortFilter;
  priority?: PriorityFilter;
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

    case "priority-desc":
      return {
        scrapedAt: "desc",
      };

    case "scrapedAt-desc":
    default:
      return {
        scrapedAt: "desc",
      };
  }
}

function getPriorityRank(priority: OfferPriorityLevel): number {
  const ranks: Record<OfferPriorityLevel, number> = {
    very_promising: 1,
    interesting: 2,
    needs_ai_analysis: 3,
    watch: 4,
    low_priority: 5,
    probably_ignore: 6,
  };

  return ranks[priority];
}

function getOfferScorePercentage(offer: JobOffer): number {
  return offer.score?.percentage ?? 0;
}

function sortOffersForUi(
  offers: JobOffer[],
  sort: SortFilter | undefined,
): JobOffer[] {
  if (sort !== "priority-desc") {
    return offers;
  }

  return [...offers].sort((a, b) => {
    const priorityDiff =
      getPriorityRank(a.priority.priority) -
      getPriorityRank(b.priority.priority);
    
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

const scoreDiff = getOfferScorePercentage(b) - getOfferScorePercentage(a);

    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function filterOffersByPriority(
  offers: JobOffer[],
  priority: PriorityFilter | undefined,
): JobOffer[] {
  if (!priority) {
    return offers;
  }

  return offers.filter((offer) => offer.priority.priority === priority);
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

  const scorableOffer = {
    title: offer.title,
    description: offer.description,
    skills: offer.skills,
    contractType,
    location: offer.location,
    qualityScore: offer.qualityScore,
    analysis: analysisForScore,
  };

  const score = scoreJobOffer(scorableOffer, candidateProfile);
  const priority = prioritizeJobOffer(scorableOffer, score);

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
    score,
    priority,
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
            params.source === "indeed" ||
            params.source === "linkedin" ||
            params.source === "meteojob"
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

  const shouldUseComputedPagination =
    Boolean(params.priority) || params.sort === "priority-desc";

  if (shouldUseComputedPagination) {
    const offers = await prisma.jobOffer.findMany({
      where,
      orderBy: getOrderBy(params.sort),
      include: {
        analysis: true,
      },
    });

    const mappedOffers = offers.map(mapDbOfferToJobOffer);
    const filteredOffers = filterOffersByPriority(mappedOffers, params.priority);
    const sortedOffers = sortOffersForUi(filteredOffers, params.sort);
    const paginatedOffers = sortedOffers.slice(skip, skip + pageSize);

    return {
      offers: paginatedOffers,
      pagination: {
        page,
        pageSize,
        totalOffers: filteredOffers.length,
        totalPages: Math.max(1, Math.ceil(filteredOffers.length / pageSize)),
      },
    };
  }

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