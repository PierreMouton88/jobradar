import { RagQuestionForm } from "@/components/rag/RagQuestionForm";
import { getRagIndexStats } from "@/lib/rag/get-rag-index-stats";

export default async function RagPage() {
  const stats = await getRagIndexStats();

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4 sm:space-y-6 sm:p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Recherche RAG sur les offres</h1>

        <p className="text-gray-700">
          Pose une question en langage naturel. L’application recherche les
          offres les plus pertinentes avec pgvector, puis demande au LLM de
          répondre uniquement à partir de ces sources.
        </p>
      </div>

      <section className="rounded border bg-gray-50 p-4 text-sm text-gray-700">
        <h2 className="mb-2 font-semibold">Comment fonctionne cette page ?</h2>

        <p>
          Cette page utilise une première version de RAG. La question est
          transformée en embedding, puis comparée aux embeddings des offres
          stockés dans PostgreSQL avec pgvector. Les offres les plus proches
          sont ensuite données au LLM comme sources pour générer une réponse.
        </p>

        <p className="mt-2">
          Le modèle ne connaît pas directement la base de données : il répond
          uniquement à partir des offres récupérées par la recherche
          vectorielle.
        </p>
      </section>
      <section className="grid gap-3 rounded border p-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-gray-500">Offres totales</p>
          <p className="text-2xl font-semibold">{stats.totalOffers}</p>
        </div>

        <div>
          <p className="text-gray-500">Offres indexées RAG</p>
          <p className="text-2xl font-semibold">{stats.indexedOffers}</p>
        </div>

        <div>
          <p className="text-gray-500">Embeddings manquants</p>
          <p className="text-2xl font-semibold">{stats.missingEmbeddings}</p>
        </div>
      </section>
      <RagQuestionForm />
    </main>
  );
}
