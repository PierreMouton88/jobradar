import Link from "next/link";
import { notFound } from "next/navigation";
import { ManualDemoWorkflowButton } from "./ManualDemoWorkflowButton";
import {
  getImportCampaignDetail,
  type ImportCampaignDetailOffer,
} from "@/lib/imports/get-import-campaign-detail";

type ImportCampaignDetailPageProps = {
  params: Promise<{
    campaignId: string;
  }>;
};

function formatDateTime(date: Date | null | undefined): string {
  if (!date) {
    return "Non renseigné";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatDuration(startedAt: Date, finishedAt: Date | null): string {
  if (!finishedAt) {
    return "En cours";
  }

  const durationMs = finishedAt.getTime() - startedAt.getTime();

  const durationSeconds = Math.max(0, Math.round(durationMs / 1000));

  if (durationSeconds < 60) {
    return `${durationSeconds}s`;
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return `${minutes}min ${seconds}s`;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "RUNNING":
      return "En cours";

    case "SUCCESS":
      return "Succès";

    case "PARTIAL":
      return "Partiel";

    case "FAILED":
      return "Échec";

    default:
      return status;
  }
}

function getStatusClassName(status: string): string {
  switch (status) {
    case "SUCCESS":
      return "border-emerald-700 bg-emerald-950/60 text-emerald-300";

    case "PARTIAL":
      return "border-amber-700 bg-amber-950/60 text-amber-300";

    case "FAILED":
      return "border-red-700 bg-red-950/60 text-red-300";

    case "RUNNING":
      return "border-blue-700 bg-blue-950/60 text-blue-300";

    default:
      return "border-gray-700 bg-gray-800 text-gray-300";
  }
}

function getManualDemoDisabledReason(campaign: {
  dryRun: boolean;
  status: string;
  finishedAt: Date | null;
}): string | null {
  if (campaign.dryRun) {
    return "La démonstration complète est indisponible sur une campagne dry-run.";
  }

  if (campaign.status === "RUNNING" || !campaign.finishedAt) {
    return "La campagne doit être terminée avant de lancer la suite du pipeline.";
  }

  if (campaign.status === "FAILED") {
    return "La démonstration complète est indisponible sur une campagne en échec.";
  }

  return null;
}

export default async function ImportCampaignDetailPage({
  params,
}: ImportCampaignDetailPageProps) {
  const { campaignId } = await params;

  const campaign = await getImportCampaignDetail(campaignId);

  if (!campaign) {
    notFound();
  }
  const manualDemoDisabledReason = getManualDemoDisabledReason(campaign);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <div>
        <Link
          href="/imports"
          className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
        >
          ← Retour aux imports
        </Link>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-white">
                Détail de la campagne
              </h1>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClassName(
                  campaign.status,
                )}`}
              >
                {getStatusLabel(campaign.status)}
              </span>

              {campaign.dryRun ? (
                <span className="rounded-full border border-gray-600 bg-gray-800 px-3 py-1 text-xs font-medium text-gray-300">
                  dry-run
                </span>
              ) : null}
            </div>

            <p className="mt-2 break-all text-sm text-gray-500">
              {campaign.id}
            </p>
          </div>

          <div className="text-sm text-gray-400 md:text-right">
            <p>Démarrée le {formatDateTime(campaign.startedAt)}</p>

            <p>
              Durée : {formatDuration(campaign.startedAt, campaign.finishedAt)}
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-white">
          Résumé de la campagne
        </h2>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <CampaignMetric label="Items bruts" value={campaign.totalRawItems} />

          <CampaignMetric
            label="Offres uniques"
            value={campaign.totalUniqueOffers}
          />

          <CampaignMetric label="Créées" value={campaign.totalCreated} />

          <CampaignMetric label="Mises à jour" value={campaign.totalUpdated} />

          <CampaignMetric
            label="Acceptées"
            value={campaign.totalAcceptedByRelevance}
          />

          <CampaignMetric
            label="Rejetées"
            value={campaign.totalRejectedByRelevance}
          />

          <CampaignMetric
            label="Doublons"
            value={campaign.totalDuplicatesSkipped}
          />

          <CampaignMetric label="Erreurs" value={campaign.totalErrors} />
        </div>

        <div className="mt-5 grid gap-4 border-t border-gray-800 pt-5 text-sm md:grid-cols-2">
          <CampaignDetail
            label="Scénario"
            value={campaign.searchScenarioName ?? "Non renseigné"}
          />

          <CampaignDetail
            label="Profil candidat"
            value={campaign.candidateName ?? "Non renseigné"}
          />

          <CampaignDetail
            label="Sources"
            value={
              campaign.selectedSources.length > 0
                ? campaign.selectedSources.join(", ")
                : "Non renseigné"
            }
          />

          <CampaignDetail
            label="Localisations"
            value={
              campaign.selectedLocations.length > 0
                ? campaign.selectedLocations.join(", ")
                : "Non renseigné"
            }
          />
        </div>

        {campaign.errorMessage ? (
          <div className="mt-5 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
            <p className="font-medium">Erreur de campagne</p>

            <p className="mt-1 whitespace-pre-wrap">{campaign.errorMessage}</p>
          </div>
        ) : null}
      </section>
      <ManualDemoWorkflowButton
        campaignId={campaign.id}
        disabled={manualDemoDisabledReason !== null}
        disabledReason={manualDemoDisabledReason}
      />
      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-white">
          Événements enregistrés
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Chaque compteur représente une action persistée pendant cette
          campagne.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          <CampaignMetric
            label="Créées"
            value={campaign.offersByAction.CREATED.length}
          />

          <CampaignMetric
            label="Mises à jour"
            value={campaign.offersByAction.UPDATED.length}
          />

          <CampaignMetric
            label="Rejetées"
            value={campaign.offersByAction.REJECTED_BY_RELEVANCE.length}
          />

          <CampaignMetric
            label="Erreurs preview"
            value={campaign.offersByAction.PREVIEW_ERROR.length}
          />

          <CampaignMetric
            label="Erreurs import"
            value={campaign.offersByAction.IMPORT_ERROR.length}
          />
        </div>
      </section>

      <details className="group rounded-xl border border-gray-800 bg-gray-900">
        <summary className="flex cursor-pointer list-none flex-col gap-3 p-6 md:flex-row md:items-start md:justify-between [&::-webkit-details-marker]:hidden">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Runs de la campagne
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Chaque run correspond à une source et une localisation exécutées
              pendant la campagne.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300">
              {campaign.runs.length}{" "}
              {campaign.runs.length === 1 ? "run" : "runs"}
            </span>

            <span className="rounded-lg border border-indigo-700 bg-indigo-950/40 px-3 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-950/70">
              <span className="group-open:hidden">Afficher les runs</span>

              <span className="hidden group-open:inline">Masquer les runs</span>
            </span>
          </div>
        </summary>

        <div className="px-6 pb-6">
          {campaign.runs.length === 0 ? (
            <p className="text-sm text-gray-400">
              Aucun run n’est rattaché à cette campagne.
            </p>
          ) : (
            <div className="grid gap-4">
              {campaign.runs.map((run) => (
                <article
                  key={run.id}
                  className="rounded-lg border border-gray-700 bg-gray-800 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-white">
                          {run.displayName ?? run.source}
                        </h3>

                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusClassName(
                            run.status,
                          )}`}
                        >
                          {getStatusLabel(run.status)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-400">
                        {run.source}
                        {" — "}
                        {run.location ?? "Localisation non renseignée"}
                      </p>

                      {run.actorId ? (
                        <p className="mt-1 break-all text-xs text-gray-500">
                          Actor : {run.actorId}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-sm text-gray-400 md:text-right">
                      <p>Début : {formatDateTime(run.startedAt)}</p>

                      <p>
                        Durée : {formatDuration(run.startedAt, run.finishedAt)}
                      </p>

                      {run.limit !== null ? <p>Limite : {run.limit}</p> : null}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <RunMetric label="Items bruts" value={run.rawItems} />

                    <RunMetric label="Mappées" value={run.mappedOffers} />

                    <RunMetric label="Préparées" value={run.preparedOffers} />

                    <RunMetric label="Uniques" value={run.uniqueOffers} />

                    <RunMetric
                      label="Acceptées"
                      value={run.acceptedByRelevance}
                    />

                    <RunMetric
                      label="Rejetées"
                      value={run.rejectedByRelevance}
                    />

                    <RunMetric label="Créées" value={run.created} />

                    <RunMetric label="Mises à jour" value={run.updated} />

                    <RunMetric label="Doublons" value={run.duplicatesSkipped} />

                    <RunMetric
                      label="Erreurs preview"
                      value={run.previewErrors}
                    />

                    <RunMetric label="Erreurs" value={run.errors} />
                  </div>

                  {run.relevanceFilterEnabled ? (
                    <div className="mt-4 rounded-lg border border-amber-900 bg-amber-950/30 p-3 text-sm text-amber-200">
                      Préfiltre de pertinence actif
                      {run.relevanceFilterMinScore !== null
                        ? ` — seuil ${run.relevanceFilterMinScore}`
                        : ""}
                    </div>
                  ) : null}

                  {run.errorMessage ? (
                    <div className="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
                      <p className="font-medium">Erreur du run</p>

                      <p className="mt-1 whitespace-pre-wrap">
                        {run.errorMessage}
                      </p>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </details>

      <OfferEventSection
        title="Offres créées"
        description="Offres qui n’existaient pas encore dans JobRadar au moment de cette campagne. Elles sont triées par compatibilité actuelle décroissante."
        offers={campaign.offersByAction.CREATED}
        emptyMessage="Aucune nouvelle offre créée pendant cette campagne."
      />

      <OfferEventSection
        title="Offres mises à jour"
        description="Offres déjà présentes en base, mais retrouvées et actualisées pendant cette campagne. Elles sont triées par compatibilité actuelle décroissante."
        offers={campaign.offersByAction.UPDATED}
        emptyMessage="Aucune offre existante mise à jour pendant cette campagne."
      />

      <OfferEventSection
        title="Offres rejetées par pertinence"
        description="Offres écartées avant leur import en base par le préfiltre déterministe."
        offers={campaign.offersByAction.REJECTED_BY_RELEVANCE}
        emptyMessage="Aucune offre rejetée par le préfiltre."
      />

      <OfferEventSection
        title="Erreurs de préparation"
        description="Éléments qui n’ont pas pu être préparés ou validés avant l’import."
        offers={campaign.offersByAction.PREVIEW_ERROR}
        emptyMessage="Aucune erreur de préparation enregistrée."
      />

      <OfferEventSection
        title="Erreurs d’import"
        description="Offres préparées, mais dont l’écriture en base a échoué."
        offers={campaign.offersByAction.IMPORT_ERROR}
        emptyMessage="Aucune erreur d’import enregistrée."
      />
    </main>
  );
}

function CampaignMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function RunMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function CampaignDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-gray-200">{value}</p>
    </div>
  );
}

function OfferEventSection({
  title,
  description,
  offers,
  emptyMessage,
}: {
  title: string;
  description: string;
  offers: ImportCampaignDetailOffer[];
  emptyMessage: string;
}) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>

          <p className="mt-2 text-sm text-gray-400">{description}</p>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300">
          {offers.length} {offers.length === 1 ? "offre" : "offres"}
        </div>
      </div>

      {offers.length === 0 ? (
        <p className="mt-5 rounded-lg border border-gray-800 bg-gray-950/40 p-4 text-sm text-gray-500">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-5 grid gap-4">
          {offers.map((offer) => (
            <OfferEventCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </section>
  );
}

function OfferEventCard({ offer }: { offer: ImportCampaignDetailOffer }) {
  const title =
    offer.title ?? offer.jobOffer?.title ?? "Offre sans titre renseigné";

  const company =
    offer.company ?? offer.jobOffer?.company ?? "Entreprise non renseignée";

  const location =
    offer.location ?? offer.jobOffer?.location ?? "Localisation non renseignée";

  const externalUrl = offer.url ?? offer.jobOffer?.url ?? null;

  const runLabel =
    offer.campaignRun?.displayName ?? offer.campaignRun?.source ?? offer.source;

  return (
    <article className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">{title}</h3>

            <OfferActionBadge action={offer.action} />

            {offer.jobOffer ? (
              offer.jobOffer.analysis ? (
                <span className="rounded-full border border-violet-800 bg-violet-950/40 px-2 py-1 text-xs font-medium text-violet-300">
                  Analyse IA disponible
                </span>
              ) : (
                <span className="rounded-full border border-gray-600 bg-gray-900 px-2 py-1 text-xs font-medium text-gray-400">
                  Non analysée
                </span>
              )
            ) : (
              <span className="rounded-full border border-gray-600 bg-gray-900 px-2 py-1 text-xs font-medium text-gray-400">
                Non importée
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-gray-300">
            {company}
            {" — "}
            {location}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {runLabel}
            {" · "}
            Source : {offer.source}
          </p>

          {offer.externalId ? (
            <p className="mt-1 break-all text-xs text-gray-600">
              Identifiant externe : {offer.externalId}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {offer.jobOffer ? (
            <Link
              href={`/offers/${offer.jobOffer.id}`}
              className="rounded-lg border border-indigo-700 bg-indigo-950/40 px-3 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-950/70"
            >
              Voir la fiche
            </Link>
          ) : null}

          {externalUrl ? (
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-white"
            >
              Source externe
            </a>
          ) : null}
        </div>
      </div>

      {offer.jobOffer ? (
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {offer.compatibilityScore !== null ? (
            <div className="rounded-lg border border-indigo-800 bg-indigo-950/30 px-3 py-2">
              <span className="text-indigo-300">Compatibilité actuelle : </span>

              <span className="font-semibold text-indigo-100">
                {offer.compatibilityScore}%
              </span>

              {offer.compatibilityLabel ? (
                <span className="text-indigo-300">
                  {" "}
                  · {offer.compatibilityLabel}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2">
            <span className="text-gray-500">Qualité des données : </span>

            <span className="font-medium text-gray-200">
              {offer.jobOffer.qualityScore}/100
            </span>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2">
            <span className="text-gray-500">IA : </span>

            <span className="font-medium text-gray-200">
              {offer.jobOffer.analysis
                ? offer.jobOffer.analysis.analysisMode
                : "non analysée"}
            </span>
          </div>
        </div>
      ) : null}

      {offer.relevanceScore !== null ? (
        <div className="mt-4 rounded-lg border border-amber-900 bg-amber-950/30 p-3">
          <p className="text-sm font-medium text-amber-200">
            Score de pertinence : {offer.relevanceScore}/100
          </p>

          {offer.relevanceReasons.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-amber-100/80">
              {offer.relevanceReasons.map((reason, index) => (
                <li
                  key={`${offer.id}-reason-${index}`}
                  className="flex items-start gap-2"
                >
                  <span className="text-amber-500">•</span>

                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {offer.errorMessage ? (
        <div className="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          <p className="font-medium">Erreur enregistrée</p>

          <p className="mt-1 whitespace-pre-wrap">{offer.errorMessage}</p>
        </div>
      ) : null}
    </article>
  );
}

function OfferActionBadge({
  action,
}: {
  action: ImportCampaignDetailOffer["action"];
}) {
  const config = {
    CREATED: {
      label: "Créée",
      className: "border-emerald-800 bg-emerald-950/40 text-emerald-300",
    },

    UPDATED: {
      label: "Mise à jour",
      className: "border-blue-800 bg-blue-950/40 text-blue-300",
    },

    REJECTED_BY_RELEVANCE: {
      label: "Rejetée",
      className: "border-amber-800 bg-amber-950/40 text-amber-300",
    },

    PREVIEW_ERROR: {
      label: "Erreur préparation",
      className: "border-red-800 bg-red-950/40 text-red-300",
    },

    IMPORT_ERROR: {
      label: "Erreur import",
      className: "border-red-800 bg-red-950/40 text-red-300",
    },
  }[action];

  return (
    <span
      className={`rounded-full border px-2 py-1 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
