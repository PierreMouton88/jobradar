import { getApifyRunPlansViewModel } from "@/lib/imports/get-apify-run-plans-view-model";
import { getImportSourcesViewModel } from "@/lib/imports/get-import-sources-view-model";
import { prisma } from "@/lib/prisma";
import { ImportCampaignButton } from "./ImportCampaignButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatList(values: string[] | null | undefined) {
  if (!values || values.length === 0) {
    return "Non renseigné";
  }

  return values.join(", ");
}

function formatDateTime(date: Date | null | undefined) {
  if (!date) {
    return "Non renseigné";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatDuration(startedAt: Date, finishedAt: Date | null) {
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

function getCampaignStatusLabel(status: string) {
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

function getCampaignStatusClassName(status: string) {
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

export default async function ImportsPage() {
  const activeScenario = await prisma.searchScenario.findFirst({
    where: {
      isActive: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const latestCampaigns = await prisma.importCampaign.findMany({
    orderBy: {
      startedAt: "desc",
    },
    take: 5,
    include: {
      runs: {
        orderBy: {
          startedAt: "asc",
        },
      },
    },
  });

  const importSources = getImportSourcesViewModel();
  const runPlans = getApifyRunPlansViewModel(activeScenario);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Pilotage des imports</h1>
        <p className="mt-2 text-sm text-gray-400">
          Campagnes Apify contrôlées, historique persistant et prévisualisation
          des plans générés à partir du scénario actif.
        </p>
      </div>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-white">Mode d&apos;emploi</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-gray-700 bg-gray-800 p-4">
            <h3 className="font-semibold text-white">1. Preview</h3>
            <p className="mt-2 text-sm text-gray-400">
              La commande{" "}
              <code className="rounded bg-gray-700 px-1 py-0.5 font-mono text-xs text-gray-200">
                apify:preview-inputs
              </code>{" "}
              génère les inputs Apify à partir du scénario actif, sans lancer
              d&apos;Actor.
            </p>
          </article>

          <article className="rounded-lg border border-gray-700 bg-gray-800 p-4">
            <h3 className="font-semibold text-white">2. Campagne UI</h3>
            <p className="mt-2 text-sm text-gray-400">
              Le bouton de campagne lance les Actors sélectionnés, récupère les
              datasets, mappe les offres, applique le préfiltre profil puis
              persiste l&apos;historique du batch.
            </p>
          </article>

          <article className="rounded-lg border border-gray-700 bg-gray-800 p-4">
            <h3 className="font-semibold text-white">3. Rapport batch</h3>
            <p className="mt-2 text-sm text-gray-400">
              Le daily report peut ensuite utiliser la dernière campagne réelle
              comme périmètre avec{" "}
              <code className="rounded bg-gray-700 px-1 py-0.5 font-mono text-xs text-gray-200">
                --latest-campaign
              </code>
              .
            </p>
          </article>
        </div>
      </section>

      <ImportCampaignButton
        sources={importSources.map((source) => ({
          source: source.source,
          label: source.label,
        }))}
        locations={activeScenario?.locations ?? []}
      />

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Historique des campagnes
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Les dernières campagnes persistées en base. C&apos;est ce batch
              qui peut maintenant servir de périmètre au rapport daily.
            </p>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300">
            {latestCampaigns.length} campagne(s) affichée(s)
          </div>
        </div>

        {latestCampaigns.length === 0 ? (
          <p className="mt-5 text-sm text-gray-400">
            Aucune campagne persistée pour le moment. Lance une campagne depuis
            le bouton ci-dessus pour alimenter cet historique.
          </p>
        ) : (
          <div className="mt-5 grid gap-4">
            {latestCampaigns.map((campaign) => (
              <article
                key={campaign.id}
                className="rounded-lg border border-gray-700 bg-gray-800 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white">
                        Campagne {campaign.id}
                      </h3>

                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-medium ${getCampaignStatusClassName(
                          campaign.status,
                        )}`}
                      >
                        {getCampaignStatusLabel(campaign.status)}
                      </span>

                      {campaign.dryRun ? (
                        <span className="rounded-full border border-gray-600 bg-gray-900 px-2 py-1 text-xs font-medium text-gray-300">
                          dry-run
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm text-gray-400">
                      Démarrée le {formatDateTime(campaign.startedAt)}
                      {" · "}
                      Durée :{" "}
                      {formatDuration(campaign.startedAt, campaign.finishedAt)}
                    </p>

                    {campaign.searchScenarioName ? (
                      <p className="mt-1 text-sm text-gray-500">
                        Scénario :{" "}
                        <span className="text-gray-300">
                          {campaign.searchScenarioName}
                        </span>
                      </p>
                    ) : null}
                    {campaign.searchScenarioName ? (
                      <p className="mt-1 text-sm text-gray-500">
                        Scénario :{" "}
                        <span className="text-gray-300">
                          {campaign.searchScenarioName}
                        </span>
                      </p>
                    ) : null}

                    <Link
                      href={`/imports/${campaign.id}`}
                      className="mt-3 inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300"
                    >
                      Voir le détail de la campagne →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                    <CampaignMetric
                      label="Créées"
                      value={campaign.totalCreated}
                    />
                    <CampaignMetric
                      label="Mises à jour"
                      value={campaign.totalUpdated}
                    />
                    <CampaignMetric
                      label="Rejetées"
                      value={campaign.totalRejectedByRelevance}
                    />
                    <CampaignMetric
                      label="Erreurs"
                      value={campaign.totalErrors}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                  <CampaignDetail
                    label="Sources"
                    value={formatList(campaign.selectedSources)}
                  />
                  <CampaignDetail
                    label="Localisations"
                    value={formatList(campaign.selectedLocations)}
                  />
                  <CampaignDetail
                    label="Items bruts"
                    value={campaign.totalRawItems.toString()}
                  />
                  <CampaignDetail
                    label="Offres uniques"
                    value={campaign.totalUniqueOffers.toString()}
                  />
                </div>

                {campaign.errorMessage ? (
                  <div className="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
                    <p className="font-medium">Erreur campagne</p>
                    <p className="mt-1 whitespace-pre-wrap">
                      {campaign.errorMessage}
                    </p>
                  </div>
                ) : null}

                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Runs
                  </p>

                  {campaign.runs.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-400">
                      Aucun run rattaché à cette campagne.
                    </p>
                  ) : (
                    <div className="mt-2 overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-gray-700 text-xs uppercase tracking-wide text-gray-500">
                          <tr>
                            <th className="py-2 pr-4">Source</th>
                            <th className="py-2 pr-4">Localisation</th>
                            <th className="py-2 pr-4">Statut</th>
                            <th className="py-2 pr-4">Raw</th>
                            <th className="py-2 pr-4">Créées</th>
                            <th className="py-2 pr-4">MAJ</th>
                            <th className="py-2 pr-4">Rejetées</th>
                            <th className="py-2 pr-4">Erreurs</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {campaign.runs.map((run) => (
                            <tr key={run.id} className="text-gray-300">
                              <td className="py-2 pr-4">
                                {run.displayName ?? run.source}
                              </td>
                              <td className="py-2 pr-4">
                                {run.location ?? "—"}
                              </td>
                              <td className="py-2 pr-4">
                                {getCampaignStatusLabel(run.status)}
                              </td>
                              <td className="py-2 pr-4">{run.rawItems}</td>
                              <td className="py-2 pr-4">{run.created}</td>
                              <td className="py-2 pr-4">{run.updated}</td>
                              <td className="py-2 pr-4">
                                {run.rejectedByRelevance}
                              </td>
                              <td className="py-2 pr-4">{run.errors}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-white">Scénario actif</h2>

        {!activeScenario ? (
          <p className="mt-4 text-sm text-gray-400">
            Aucun scénario actif trouvé. Les previews d&apos;imports auront
            besoin d&apos;un scénario de recherche actif pour générer des
            critères.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <ScenarioField label="Nom" value={activeScenario.name} />
            <ScenarioField
              label="Rôle ciblé"
              value={formatList(activeScenario.targetRoles)}
            />
            <ScenarioField
              label="Localisations"
              value={formatList(activeScenario.locations)}
            />
            <ScenarioField
              label="Mots-clés"
              value={formatList(activeScenario.keywords)}
            />
            <ScenarioField
              label="Contrats"
              value={formatList(activeScenario.contractTypes)}
            />
            <ScenarioField
              label="Télétravail"
              value={formatList(activeScenario.remotePolicies)}
            />
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-white">
          Sources disponibles
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Adapters Apify actuellement déclarés dans JobRadar IA — lecture seule.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {importSources.map((source) => (
            <article
              key={source.source}
              className="rounded-lg border border-gray-700 bg-gray-800 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">{source.label}</h3>
                  <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                    {source.source}
                  </p>
                </div>

                <span className="rounded-full border border-gray-600 bg-gray-700 px-2 py-1 text-xs font-medium text-gray-300">
                  {source.statusLabel}
                </span>
              </div>

              <p className="mt-4 text-sm text-gray-400">{source.description}</p>

              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Actor Apify
                  </dt>
                  <dd className="mt-1 break-all text-gray-200">
                    {source.actorId}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Limite minimale
                  </dt>
                  <dd className="mt-1 text-gray-200">{source.minLimit}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Limite par défaut
                  </dt>
                  <dd className="mt-1 text-gray-200">{source.defaultLimit}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-white">Plans de run Apify</h2>

        <p className="mt-2 text-sm text-gray-400">
          Générés à partir du scénario actif et des adapters. Prévisualisation
          uniquement — aucun Actor n&apos;est lancé depuis cette section.
        </p>

        {runPlans.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">
            Aucun plan de run disponible. Vérifie qu&apos;un scénario de
            recherche actif existe.
          </p>
        ) : (
          <div className="mt-5 grid gap-4">
            {runPlans.map((plan) => (
              <article
                key={`${plan.source}-${plan.location}`}
                className="rounded-lg border border-gray-700 bg-gray-800 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="font-semibold text-white">
                      {plan.displayName}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Source :{" "}
                      <span className="font-medium text-gray-300">
                        {plan.source}
                      </span>
                    </p>
                  </div>

                  <div className="text-sm text-gray-500 md:text-right">
                    <p>
                      Localisation :{" "}
                      <span className="font-medium text-gray-300">
                        {plan.location}
                      </span>
                    </p>
                    <p>
                      Limite :{" "}
                      <span className="font-medium text-gray-300">
                        {plan.limit}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Actor Apify
                  </p>
                  <p className="mt-1 break-all text-sm text-gray-300">
                    {plan.actorId}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Input généré
                  </p>
                  <pre className="mt-2 overflow-x-auto rounded-md bg-gray-950 p-4 text-xs text-gray-300">
                    <code>{plan.inputJson}</code>
                  </pre>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Commande de preview
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Ne lance pas Apify — vérifie uniquement les inputs générés.
                  </p>
                  <pre className="mt-2 overflow-x-auto rounded-md bg-gray-950 p-4 text-xs text-gray-300">
                    <code>{plan.previewCommand}</code>
                  </pre>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Commande d&apos;import dry-run
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Lance l&apos;Actor avec{" "}
                    <code className="rounded bg-gray-700 px-1 py-0.5 font-mono text-gray-300">
                      --run-actor
                    </code>
                    , mais n&apos;écrit pas en base grâce à{" "}
                    <code className="rounded bg-gray-700 px-1 py-0.5 font-mono text-gray-300">
                      --dry-run
                    </code>
                    .
                  </p>
                  <pre className="mt-2 overflow-x-auto rounded-md bg-gray-950 p-4 text-xs text-gray-300">
                    <code>{plan.dryRunImportCommand}</code>
                  </pre>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-white">Garde-fous</h2>

        <ul className="mt-4 space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-gray-600">•</span>
            Les campagnes lancées depuis l&apos;interface restent volontaires :
            sources et localisations sont sélectionnées avant chaque exécution.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-gray-600">•</span>
            Le token Apify reste côté serveur ou scripts locaux — jamais exposé
            dans un composant client.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-gray-600">•</span>
            Les candidatures ne sont jamais automatisées. Le daily report peut
            analyser et envoyer un digest, mais il ne contacte aucun recruteur.
          </li>
        </ul>
      </section>
    </main>
  );
}

function CampaignMetric({ label, value }: { label: string; value: number }) {
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

function ScenarioField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-gray-200">{value}</p>
    </div>
  );
}
