"use client";

import { useState } from "react";
import { runImportCampaignAction } from "./actions";
import type { ApifyImportCampaignReport } from "@/lib/imports/run-apify-import-campaign";
import type { SupportedApifyActorSource } from "@/lib/sources/apify/apify-actor-adapter";

type ImportCampaignSourceOption = {
  source: SupportedApifyActorSource;
  label: string;
};

type ImportCampaignButtonProps = {
  sources: ImportCampaignSourceOption[];
  locations: string[];
};

export function ImportCampaignButton({
  sources,
  locations,
}: ImportCampaignButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<ApifyImportCampaignReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customLocation, setCustomLocation] = useState("");

  const [selectedSources, setSelectedSources] = useState<
    SupportedApifyActorSource[]
  >(sources.map((source) => source.source));

  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    locations.slice(0, 3),
  );

  const displayedLocations = Array.from(
    new Set([...locations, ...selectedLocations]),
  );

  const canOpenModal = sources.length > 0 && displayedLocations.length > 0;
  const canRunCampaign =
    selectedSources.length > 0 && selectedLocations.length > 0 && !isRunning;

  function toggleSource(source: SupportedApifyActorSource) {
    setSelectedSources((currentSources) => {
      if (currentSources.includes(source)) {
        return currentSources.filter(
          (currentSource) => currentSource !== source,
        );
      }

      return [...currentSources, source];
    });
  }

  function toggleLocation(location: string) {
    setSelectedLocations((currentLocations) => {
      if (currentLocations.includes(location)) {
        return currentLocations.filter(
          (currentLocation) => currentLocation !== location,
        );
      }

      return [...currentLocations, location];
    });
  }

  function addCustomLocation() {
    const trimmedLocation = customLocation.trim();

    if (trimmedLocation.length === 0) {
      return;
    }

    setSelectedLocations((currentLocations) => {
      if (currentLocations.includes(trimmedLocation)) {
        return currentLocations;
      }

      return [...currentLocations, trimmedLocation];
    });

    setCustomLocation("");
  }

  async function handleRunCampaign() {
    if (selectedSources.length === 0) {
      setError("Sélectionne au moins une source avant de lancer la campagne.");
      return;
    }

    if (selectedLocations.length === 0) {
      setError(
        "Sélectionne au moins une localisation avant de lancer la campagne.",
      );
      return;
    }

    setIsRunning(true);
    setError(null);
    setReport(null);

    try {
      const nextReport = await runImportCampaignAction({
        sources: selectedSources,
        locations: selectedLocations,
      });

      setReport(nextReport);
      setIsModalOpen(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Erreur inconnue pendant la campagne d'import.",
      );
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">
              Campagne d&apos;import
            </h2>
            <span className="rounded-full border border-blue-800 bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-300">
              Apify
            </span>
          </div>

          <p className="mt-2 max-w-3xl text-sm text-gray-400">
            Lance les Actors Apify configurés pour le scénario actif, récupère
            les datasets, mappe les offres puis les importe en base PostgreSQL.
          </p>

          <p className="mt-1 text-sm text-gray-400">
            Sources et localisations sélectionnables, limite de 20 résultats par
            plan, préfiltre profil actif avant import réel en base.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={isRunning || !canOpenModal}
          className="flex shrink-0 items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRunning ? (
            <>
              <Spinner />
              Import en cours…
            </>
          ) : (
            "Lancer la campagne"
          )}
        </button>
      </div>

      {!canOpenModal ? (
        <div className="mt-4 rounded-lg border border-amber-800 bg-amber-900/30 p-4 text-sm text-amber-300">
          Aucun scénario actif exploitable ou aucune source disponible.
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-lg border border-red-800 bg-red-900/30 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {report ? <ImportCampaignReportView report={report} /> : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              Confirmer la campagne d&apos;import
            </h3>

            <div className="mt-2 space-y-1 text-sm text-gray-400">
              <p>
                Cette action va lancer les Actors Apify sélectionnés pour les
                localisations choisies.
              </p>
              <p>
                Les offres récupérées seront importées en base PostgreSQL. Les
                doublons seront gérés par le pipeline d&apos;import existant.
              </p>
              <p>
                L&apos;action peut prendre un peu de temps selon les Actors et
                le volume retourné.
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-gray-300">
                Sources à lancer
              </p>

              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {sources.map((source) => (
                  <label
                    key={source.source}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm transition-colors hover:border-gray-600"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSources.includes(source.source)}
                      onChange={() => toggleSource(source.source)}
                      disabled={isRunning}
                      className="h-4 w-4 accent-indigo-500"
                    />
                    <span>
                      <span className="font-medium text-white">
                        {source.label}
                      </span>
                      <span className="ml-1 text-xs text-gray-500">
                        ({source.source})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-gray-300">
                Localisations à lancer
              </p>

              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {displayedLocations.map((location) => (
                  <label
                    key={location}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm transition-colors hover:border-gray-600"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLocations.includes(location)}
                      onChange={() => toggleLocation(location)}
                      disabled={isRunning}
                      className="h-4 w-4 accent-indigo-500"
                    />
                    <span className="font-medium text-white">{location}</span>
                  </label>
                ))}
              </div>

              <div className="mt-3 flex flex-col gap-2 md:flex-row">
                <input
                  type="text"
                  value={customLocation}
                  onChange={(event) => setCustomLocation(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCustomLocation();
                    }
                  }}
                  disabled={isRunning}
                  placeholder="Ajouter une localisation custom, ex. Thionville"
                  className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-indigo-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomLocation}
                  disabled={isRunning || customLocation.trim().length === 0}
                  className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Ajouter
                </button>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                La campagne utilise une limite de 20 résultats par source et
                localisation. Les localisations sélectionnées sont ensuite
                limitées à trois plans maximum par source côté serveur.
              </p>
            </div>

            <div className="mt-5 rounded-lg border border-gray-700 bg-gray-800 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Plans théoriques</span>
                <span className="font-semibold text-white">
                  {selectedSources.length * selectedLocations.length}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-gray-400">Plafond items bruts</span>
                <span className="font-semibold text-white">
                  {selectedSources.length * selectedLocations.length * 20}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isRunning}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleRunCampaign}
                disabled={!canRunCampaign}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRunning ? (
                  <>
                    <Spinner />
                    Lancement…
                  </>
                ) : (
                  "Confirmer et lancer"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 shrink-0 animate-spin"
      width="16"
      height="16"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function ImportCampaignReportView({
  report,
}: {
  report: ApifyImportCampaignReport;
}) {
  const durationInSeconds = Math.round(
    (new Date(report.finishedAt).getTime() -
      new Date(report.startedAt).getTime()) /
      1000,
  );
  const relevanceReasonCounts = Array.from(
    report.plans
      .flatMap((plan) => plan.relevanceRejectionReasonCounts)
      .reduce((counts, reasonCount) => {
        counts.set(
          reasonCount.reason,
          (counts.get(reasonCount.reason) ?? 0) + reasonCount.count,
        );

        return counts;
      }, new Map<string, number>()),
  )
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-2 w-2 rounded-full ${report.totalErrors > 0 ? "bg-amber-400" : "bg-green-400"}`}
          />
          <h3 className="font-semibold text-white">Rapport de campagne</h3>
          {report.dryRun ? (
            <span className="rounded-full border border-amber-800 bg-amber-900/40 px-2 py-0.5 text-xs font-medium text-amber-300">
              Dry-run
            </span>
          ) : null}
        </div>
        <p className="text-xs text-gray-500">{durationInSeconds}s</p>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-700 bg-gray-800 p-4 md:grid-cols-5">
        <ReportStat label="Plans lancés" value={report.plansCount} />
        <ReportStat label="Items bruts" value={report.totalRawItems} />
        <ReportStat label="Offres mappées" value={report.totalMappedOffers} />
        <ReportStat label="Préparées" value={report.totalPreparedOffers} />
        <ReportStat label="Uniques" value={report.totalUniqueOffers} />

        <ReportStat
          label="Acceptées filtre"
          value={report.totalAcceptedByRelevance}
          variant="success"
        />
        <ReportStat
          label="Rejetées filtre"
          value={report.totalRejectedByRelevance}
          variant="warning"
        />
        <ReportStat
          label="Créées"
          value={report.totalCreated}
          variant="success"
        />
        <ReportStat
          label="Mises à jour"
          value={report.totalUpdated}
          variant="info"
        />
        <ReportStat
          label="Doublons ignorés"
          value={report.totalDuplicatesSkipped}
        />
        <ReportStat
          label="Erreurs"
          value={report.totalErrors}
          variant={report.totalErrors > 0 ? "danger" : "default"}
        />
      </div>
      {report.totalRejectedByRelevance > 0 ? (
        <div className="rounded-lg border border-amber-800 bg-amber-900/20 p-4">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-amber-200">
                Préfiltre de pertinence actif
              </h4>
              <p className="mt-1 text-sm text-amber-100/80">
                {report.totalRejectedByRelevance} offre
                {report.totalRejectedByRelevance > 1 ? "s" : ""} rejetée
                {report.totalRejectedByRelevance > 1 ? "s" : ""} avant import en
                base.
              </p>
            </div>

            <p className="text-xs text-amber-200/70">
              Seuil :{" "}
              {report.plans.find(
                (plan) => plan.relevanceFilterMinScore !== null,
              )?.relevanceFilterMinScore ?? "non renseigné"}
            </p>
          </div>

          {relevanceReasonCounts.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-200/70">
                Principales raisons
              </p>

              <ul className="mt-2 space-y-1 text-sm text-amber-100/90">
                {relevanceReasonCounts.slice(0, 5).map((reasonCount) => (
                  <li
                    key={reasonCount.reason}
                    className="flex items-center justify-between gap-3"
                  >
                    <span>{reasonCount.reason}</span>
                    <span className="rounded-full bg-amber-950/60 px-2 py-0.5 text-xs font-medium text-amber-200">
                      {reasonCount.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="grid gap-3">
        {report.plans.map((plan) => (
          <article
            key={`${plan.source}-${plan.location}`}
            className="rounded-lg border border-gray-700 bg-gray-800 p-4"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h4 className="font-medium text-white">{plan.displayName}</h4>
                <p className="mt-0.5 text-xs text-gray-500">
                  {plan.source} — {plan.location}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {plan.errors.length > 0 ? (
                  <span className="rounded-full border border-red-800 bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-400">
                    {plan.errors.length} erreur
                    {plan.errors.length > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="rounded-full border border-green-800 bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-400">
                    OK
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  limite {plan.limit}
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <ReportStat label="Raw" value={plan.rawItems} />
              <ReportStat label="Mappées" value={plan.mappedOffers} />
              <ReportStat label="Uniques" value={plan.uniqueOffers} />
              <ReportStat
                label="Acceptées filtre"
                value={plan.acceptedByRelevance}
                variant="success"
              />
              <ReportStat
                label="Rejetées filtre"
                value={plan.rejectedByRelevance}
                variant="warning"
              />
              <ReportStat
                label="Créées"
                value={plan.created}
                variant="success"
              />
              <ReportStat
                label="Mises à jour"
                value={plan.updated}
                variant="info"
              />
            </div>
            {plan.rejectedByRelevance > 0 &&
            plan.relevanceRejectionReasonCounts.length > 0 ? (
              <div className="mt-3 rounded-md border border-amber-800 bg-amber-900/20 p-3 text-sm text-amber-100/90">
                <p className="font-medium text-amber-200">
                  Rejets par pertinence
                </p>

                <ul className="mt-1.5 space-y-1">
                  {plan.relevanceRejectionReasonCounts
                    .slice(0, 3)
                    .map((reasonCount) => (
                      <li
                        key={`${plan.source}-${plan.location}-${reasonCount.reason}`}
                        className="flex items-center justify-between gap-3"
                      >
                        <span>{reasonCount.reason}</span>
                        <span className="rounded-full bg-amber-950/60 px-2 py-0.5 text-xs font-medium text-amber-200">
                          {reasonCount.count}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
            {plan.errors.length > 0 ? (
              <div className="mt-3 rounded-md border border-red-800 bg-red-900/30 p-3 text-sm text-red-300">
                <p className="font-medium">Erreurs</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  {plan.errors.map((planError, index) => (
                    <li key={`${plan.source}-${plan.location}-error-${index}`}>
                      {planError}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function ReportStat({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "success" | "info" | "danger" | "warning";
}) {
  const valueClass = {
    default: "text-gray-100",
    success: "text-green-400",
    info: "text-blue-400",
    warning: "text-amber-400",
    danger: value > 0 ? "text-red-400" : "text-gray-100",
  }[variant];

  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-base font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}