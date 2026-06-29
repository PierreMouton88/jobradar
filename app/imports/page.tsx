import { getApifyRunPlansViewModel } from "@/lib/imports/get-apify-run-plans-view-model";
import { getImportSourcesViewModel } from "@/lib/imports/get-import-sources-view-model";
import { prisma } from "@/lib/prisma";
import { ImportCampaignButton } from "./ImportCampaignButton";

function formatList(values: string[] | null | undefined) {
  if (!values || values.length === 0) {
    return "Non renseigné";
  }

  return values.join(", ");
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

  const importSources = getImportSourcesViewModel();
  const runPlans = getApifyRunPlansViewModel(activeScenario);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Pilotage des imports</h1>
        <p className="mt-2 text-sm text-gray-400">
          Prévisualisation des imports externes — scénario actif, sources
          disponibles, commandes CLI.
        </p>
      </div>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-white">Mode d&apos;emploi</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-gray-700 bg-gray-800 p-4">
            <h3 className="font-semibold text-white">1. Preview</h3>
            <p className="mt-2 text-sm text-gray-400">
              La commande{" "}
              <code className="rounded bg-gray-700 px-1 py-0.5 text-xs font-mono text-gray-200">
                apify:preview-inputs
              </code>{" "}
              génère les inputs Apify à partir du scénario actif, sans lancer
              d&apos;Actor.
            </p>
          </article>

          <article className="rounded-lg border border-gray-700 bg-gray-800 p-4">
            <h3 className="font-semibold text-white">2. Dry-run Apify</h3>
            <p className="mt-2 text-sm text-gray-400">
              La commande{" "}
              <code className="rounded bg-gray-700 px-1 py-0.5 text-xs font-mono text-gray-200">
                external:import
              </code>{" "}
              avec{" "}
              <code className="rounded bg-gray-700 px-1 py-0.5 text-xs font-mono text-gray-200">
                --run-actor
              </code>{" "}
              lance l&apos;Actor, mais{" "}
              <code className="rounded bg-gray-700 px-1 py-0.5 text-xs font-mono text-gray-200">
                --dry-run
              </code>{" "}
              empêche l&apos;écriture en base.
            </p>
          </article>

          <article className="rounded-lg border border-gray-700 bg-gray-800 p-4">
            <h3 className="font-semibold text-white">3. Import réel</h3>
            <p className="mt-2 text-sm text-gray-400">
              Un import réel se fait en retirant{" "}
              <code className="rounded bg-gray-700 px-1 py-0.5 text-xs font-mono text-gray-200">
                --dry-run
              </code>
              . Cette action doit rester volontaire et limitée.
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
          uniquement — aucun Actor n&apos;est lancé depuis cette page.
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
            Les Actors Apify ne sont pas lancés automatiquement depuis cette
            interface.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-gray-600">•</span>
            Le token Apify reste côté serveur ou scripts locaux — jamais exposé
            dans un composant client.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-gray-600">•</span>
            Les imports réels restent contrôlés par les commandes CLI avec les
            flags explicites{" "}
            <code className="rounded bg-gray-700 px-1 py-0.5 font-mono text-gray-300">
              --dry-run
            </code>{" "}
            et{" "}
            <code className="rounded bg-gray-700 px-1 py-0.5 font-mono text-gray-300">
              --run-actor
            </code>
            .
          </li>
        </ul>
      </section>
    </main>
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
