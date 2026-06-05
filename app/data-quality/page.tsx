import { prisma } from "@/lib/prisma";

function countIssues(offers: { qualityIssues: string[] }[]) {
  const issuesCount = new Map<string, number>();

  for (const offer of offers) {
    for (const issue of offer.qualityIssues) {
      issuesCount.set(issue, (issuesCount.get(issue) ?? 0) + 1);
    }
  }

  return Array.from(issuesCount.entries())
    .map(([issue, count]) => ({
      issue,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export default async function DataQualityPage() {
  const offers = await prisma.jobOffer.findMany({
    orderBy: {
      qualityScore: "asc",
    },
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      qualityScore: true,
      qualityIssues: true,
      url: true,
      source: true,
    },
  });

  const totalOffers = offers.length;

  const averageQualityScore =
    totalOffers === 0
      ? 0
      : Math.round(
          offers.reduce((sum, offer) => sum + offer.qualityScore, 0) /
            totalOffers,
        );

  const offersWithIssues = offers.filter(
    (offer) => offer.qualityIssues.length > 0,
  );

  const issuesCount = countIssues(offers);

  const weakestOffers = offers
    .filter((offer) => offer.qualityIssues.length > 0)
    .slice(0, 5);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10">
      <section>
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">
          Pipeline qualité
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate sm:text-3xl">
          Qualité des données
        </h1>
        <p className="mt-3 max-w-3xl text-base text-slate-400">
          Cette page permet de vérifier la qualité des offres importées avant
          les prochaines étapes IA. Elle s’appuie sur les champs{" "}
          <code className="rounded bg-indigo-50 px-1.5 py-0.5 text-sm font-mono text-indigo-700">qualityScore</code>{" "}
          et{" "}
          <code className="rounded bg-indigo-50 px-1.5 py-0.5 text-sm font-mono text-indigo-700">qualityIssues</code>{" "}
          calculés au moment de l’import.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Offres en base</p>
          <p className="mt-2 text-4xl font-bold text-slate-900">{totalOffers}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Score qualité moyen</p>
          <p className="mt-2 text-4xl font-bold text-slate-900">
            {averageQualityScore}
            <span className="text-xl font-medium text-slate-400">/100</span>
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Offres avec anomalies</p>
          <p className="mt-2 text-4xl font-bold text-amber-700">
            {offersWithIssues.length}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Anomalies détectées</h2>

        {issuesCount.length === 0 ? (
          <p className="mt-4 text-slate-500">
            Aucune anomalie détectée pour le moment.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {issuesCount.map((issue) => (
              <li
                key={issue.issue}
                className="flex items-center justify-between py-3"
              >
                <span className="font-medium text-slate-800">{issue.issue}</span>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700">
                  {issue.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Offres à vérifier en priorité
        </h2>

        {weakestOffers.length === 0 ? (
          <p className="mt-4 text-slate-500">
            Aucune offre problématique à afficher.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-3 pr-4 pl-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Score</th>
                  <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Offre</th>
                  <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Entreprise</th>
                  <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Localisation</th>
                  <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Anomalies</th>
                </tr>
              </thead>
              <tbody>
                {weakestOffers.map((offer) => (
                  <tr key={offer.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                    <td className="py-3 pr-4 pl-2">
                      <span className="rounded-md bg-rose-100 px-2 py-1 text-sm font-bold text-rose-700">
                        {offer.qualityScore}/100
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <a
                        href={`/offers/${offer.id}`}
                        className="font-medium text-indigo-600 underline underline-offset-4 hover:text-indigo-800"
                      >
                        {offer.title}
                      </a>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{offer.company}</td>
                    <td className="py-3 pr-4 text-slate-500">{offer.location}</td>
                    <td className="py-3 pr-4 text-slate-500">
                      {offer.qualityIssues.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}