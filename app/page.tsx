import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <section className="rounded-lg border p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Projet fil rouge</p>

        <h1 className="mt-2 text-4xl font-bold">JobRadar IA</h1>

        <p className="mt-4 text-lg text-gray-700">
          Une application d’apprentissage pour collecter, structurer, analyser
          et interroger des offres d’emploi avec Next.js, scraping, base de
          données et IA.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/offers"
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Voir les offres
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">1. Collecter</h2>
          <p className="mt-2 text-sm text-gray-600">
            Commencer avec des offres fictives, puis apprendre le scraping
            contrôlé.
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">2. Structurer</h2>
          <p className="mt-2 text-sm text-gray-600">
            Nettoyer les données, les typer, puis les stocker en base.
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">3. Analyser</h2>
          <p className="mt-2 text-sm text-gray-600">
            Ajouter progressivement LLM, structured outputs, RAG et agent
            contrôlé.
          </p>
        </div>
      </section>
    </main>
  );
}