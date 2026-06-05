import Link from "next/link";
import { getOffers } from "@/lib/offers/get-offers";
import { OfferFilters } from "@/components/offers/OfferFilters";
import { OfferList } from "@/components/offers/OfferList";

type OffersPageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    remote?: string;
    dateRange?: string;
    source?: string;
    contractType?: string;
    sort?: string;
  }>;
};

function parsePage(value: string | undefined): number {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function parseRemote(value: string | undefined): "true" | "false" | undefined {
  if (value === "true" || value === "false") {
    return value;
  }

  return undefined;
}

function parseDateRange(
  value: string | undefined,
): "1d" | "7d" | "14d" | "30d" | undefined {
  if (
    value === "1d" ||
    value === "7d" ||
    value === "14d" ||
    value === "30d"
  ) {
    return value;
  }

  return undefined;
}

function parseSource(
  value: string | undefined,
): "static-html" | "fake-dynamic-jobs" | "indeed" | "linkedin" | undefined {
  if (
    value === "static-html" ||
    value === "fake-dynamic-jobs" ||
    value === "indeed" ||
    value === "linkedin"
  ) {
    return value;
  }

  return undefined;
}

function parseContractType(
  value: string | undefined,
):
  | "CDI"
  | "CDD"
  | "Stage"
  | "Alternance"
  | "Freelance"
  | "Inconnu"
  | undefined {
  if (
    value === "CDI" ||
    value === "CDD" ||
    value === "Stage" ||
    value === "Alternance" ||
    value === "Freelance" ||
    value === "Inconnu"
  ) {
    return value;
  }

  return undefined;
}

function parseSort(
  value: string | undefined,
): "scrapedAt-desc" | "createdAt-desc" | undefined {
  if (value === "scrapedAt-desc" || value === "createdAt-desc") {
    return value;
  }

  return undefined;
}

function buildOffersPageHref(
  currentParams: {
    search?: string;
    remote?: string;
    dateRange?: string;
    source?: string;
    contractType?: string;
    sort?: string;
  },
  page: number,
): string {
  const params = new URLSearchParams();

  params.set("page", String(page));

  if (currentParams.search) {
    params.set("search", currentParams.search);
  }

  if (currentParams.remote) {
    params.set("remote", currentParams.remote);
  }

  if (currentParams.dateRange) {
    params.set("dateRange", currentParams.dateRange);
  }

  if (currentParams.source) {
    params.set("source", currentParams.source);
  }

  if (currentParams.contractType) {
    params.set("contractType", currentParams.contractType);
  }

  if (currentParams.sort) {
    params.set("sort", currentParams.sort);
  }

  return `/offers?${params.toString()}`;
}

export default async function OffersPage({ searchParams }: OffersPageProps) {
  const params = await searchParams;

  const remote = parseRemote(params.remote);
  const dateRange = parseDateRange(params.dateRange);
  const source = parseSource(params.source);
  const contractType = parseContractType(params.contractType);
  const sort = parseSort(params.sort);

  const { offers, pagination } = await getOffers({
    page: parsePage(params.page),
    pageSize: 10,
    search: params.search,
    remote,
    dateRange,
    source,
    contractType,
    sort,
  });

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-50 sm:text-3xl">Offres d’emploi</h1>
        <p className="mt-2 text-sm text-gray-400">
          {pagination.totalOffers} offre(s) trouvée(s) — page {pagination.page} /{" "}
          {pagination.totalPages}
        </p>
      </div>

      <OfferFilters
        search={params.search}
        remote={remote}
        dateRange={dateRange}
        source={source}
        contractType={contractType}
        sort={sort}
      />

      <OfferList offers={offers} />

      <div className="mt-8 flex items-center justify-between border-t border-gray-800 pt-4">
        {pagination.page > 1 ? (
          <Link
            href={buildOffersPageHref(params, pagination.page - 1)}
            className="rounded border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-900"
          >
            ← Précédent
          </Link>
        ) : (
          <span className="rounded border border-gray-800 px-4 py-2 text-sm text-gray-600">
            ← Précédent
          </span>
        )}

        <span className="text-sm text-gray-400">
          Page {pagination.page} sur {pagination.totalPages}
        </span>

        {pagination.page < pagination.totalPages ? (
          <Link
            href={buildOffersPageHref(params, pagination.page + 1)}
            className="rounded border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-900"
          >
            Suivant →
          </Link>
        ) : (
          <span className="rounded border border-gray-800 px-4 py-2 text-sm text-gray-600">
            Suivant →
          </span>
        )}
      </div>
    </main>
  );
}