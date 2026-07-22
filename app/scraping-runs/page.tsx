import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ScrapingRunsPage() {
  const scrapingRuns = await prisma.scrapingRun.findMany({
    orderBy: {
      startedAt: "desc",
    },
    take: 20,
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Historique des imports</h1>
        <p className="mt-2 text-gray-600">
          Cette page affiche les dernières sessions de scraping ou d’import JSON
          enregistrées en base.
        </p>
      </div>

      {scrapingRuns.length === 0 ? (
        <p className="text-gray-600">Aucun import enregistré pour le moment.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-160 border-collapse text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold">Offres</th>
                <th className="px-4 py-3 font-semibold">Début</th>
                <th className="px-4 py-3 font-semibold">Fin</th>
                <th className="px-4 py-3 font-semibold">Erreur</th>
              </tr>
            </thead>

            <tbody>
              {scrapingRuns.map((run) => (
                <tr key={run.id} className="border-t border-gray-200">
                  <td className="px-4 py-3">{run.source}</td>
                  <td className="px-4 py-3">{run.status}</td>
                  <td className="px-4 py-3">{run.offersCount}</td>
                  <td className="px-4 py-3">
                    {run.startedAt.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    {run.finishedAt
                      ? run.finishedAt.toLocaleString("fr-FR")
                      : "En cours / non terminé"}
                  </td>
                  <td className="px-4 py-3">
                    {run.errorMessage ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}