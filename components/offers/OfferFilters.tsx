"use client";

import Link from "next/link";
import { useState } from "react";

type PriorityFilter =
  | "very_promising"
  | "interesting"
  | "needs_ai_analysis"
  | "watch"
  | "low_priority"
  | "probably_ignore";

type OfferFiltersProps = {
  search?: string;
  remote?: "true" | "false";
  dateRange?: "1d" | "7d" | "14d" | "30d";
  source?:
    | "static-html"
    | "fake-dynamic-jobs"
    | "indeed"
    | "linkedin"
    | "meteojob";
  contractType?:
    | "CDI"
    | "CDD"
    | "Stage"
    | "Alternance"
    | "Freelance"
    | "Inconnu";
  sort?: "scrapedAt-desc" | "createdAt-desc" | "priority-desc";
  priority?: PriorityFilter;
};

const inputClassName =
  "mt-1 w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500";

const selectClassName =
  "mt-1 w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500";

const labelClassName = "block text-sm font-medium text-gray-300";

function countActiveFilters(
  search?: string,
  remote?: string,
  dateRange?: string,
  source?: string,
  contractType?: string,
  priority?: string,
): number {
  return [search, remote, dateRange, source, contractType, priority].filter(
    Boolean,
  ).length;
}

export function OfferFilters({
  search,
  remote,
  dateRange,
  source,
  contractType,
  sort,
  priority,
}: OfferFiltersProps) {
  const activeCount = countActiveFilters(
    search,
    remote,
    dateRange,
    source,
    contractType,
    priority,
  );

  const [open, setOpen] = useState(activeCount > 0);

  return (
    <section className="my-4 rounded-xl border border-gray-800 bg-gray-950 p-4 shadow-sm sm:my-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-50">Filtres</h2>
          {activeCount > 0 && (
            <span className="rounded-full bg-blue-900/60 px-2 py-0.5 text-xs font-medium text-blue-300">
              {activeCount} actif{activeCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/offers"
            className="hidden rounded-md border border-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-900 sm:inline-flex"
          >
            Réinitialiser
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-900 sm:hidden"
            aria-expanded={open}
          >
            {open ? "Masquer" : "Afficher"}
            <svg
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2 4l4 4 4-4" />
            </svg>
          </button>
        </div>
      </div>

      <div className={open ? "block" : "hidden sm:block"}>
        <p className="mt-1 text-sm text-gray-500 sm:mt-0">
          Recherche, source, contrat, télétravail, date d&apos;import et tri.
        </p>

        <form action="/offers" method="GET" className="mt-4">
          {priority ? (
            <input type="hidden" name="priority" value={priority} />
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="sm:col-span-2">
              <label htmlFor="search" className={labelClassName}>
                Recherche
              </label>
              <input
                id="search"
                name="search"
                type="text"
                defaultValue={search ?? ""}
                placeholder="React, NestJS, entreprise, ville..."
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="source" className={labelClassName}>
                Source
              </label>
              <select
                id="source"
                name="source"
                defaultValue={source ?? ""}
                className={selectClassName}
              >
                <option value="">Toutes</option>
                <option value="indeed">Indeed / Apify</option>
                <option value="linkedin">LinkedIn / Apify</option>
                <option value="meteojob">Meteojob / Apify</option>
                <option value="static-html">Static HTML</option>
                <option value="fake-dynamic-jobs">Fake dynamic jobs</option>
              </select>
            </div>

            <div>
              <label htmlFor="contractType" className={labelClassName}>
                Contrat
              </label>
              <select
                id="contractType"
                name="contractType"
                defaultValue={contractType ?? ""}
                className={selectClassName}
              >
                <option value="">Tous</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Alternance">Alternance</option>
                <option value="Stage">Stage</option>
                <option value="Freelance">Freelance</option>
                <option value="Inconnu">Inconnu</option>
              </select>
            </div>

            <div>
              <label htmlFor="remote" className={labelClassName}>
                Télétravail
              </label>
              <select
                id="remote"
                name="remote"
                defaultValue={remote ?? ""}
                className={selectClassName}
              >
                <option value="">Tous</option>
                <option value="true">Avec remote</option>
                <option value="false">Sans remote</option>
              </select>
            </div>

            <div>
              <label htmlFor="dateRange" className={labelClassName}>
                Date d&apos;import
              </label>
              <select
                id="dateRange"
                name="dateRange"
                defaultValue={dateRange ?? ""}
                className={selectClassName}
              >
                <option value="">Toutes</option>
                <option value="1d">Dernières 24h</option>
                <option value="7d">7 derniers jours</option>
                <option value="14d">14 derniers jours</option>
                <option value="30d">30 derniers jours</option>
              </select>
            </div>

            <div>
              <label htmlFor="sort" className={labelClassName}>
                Tri
              </label>
              <select
                id="sort"
                name="sort"
                defaultValue={sort ?? "scrapedAt-desc"}
                className={selectClassName}
              >
                <option value="scrapedAt-desc">Import le plus récent</option>
                <option value="createdAt-desc">Création la plus récente</option>
                <option value="priority-desc">
                  Priorité puis meilleur score
                </option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Le score affiche la compatibilité avec le profil. La priorité
              combine score, analyse IA et points de vigilance.
            </p>

            <div className="flex gap-2">
              <Link
                href="/offers"
                className="flex-1 rounded-md border border-gray-700 px-4 py-2.5 text-center text-sm text-gray-200 hover:bg-gray-900 sm:hidden"
              >
                Réinitialiser
              </Link>
              <button
                type="submit"
                className="flex-1 rounded-md bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-950 hover:bg-white sm:flex-none sm:py-2"
              >
                Appliquer
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}