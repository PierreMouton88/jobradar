import { RagQuestionForm } from "@/components/rag/RagQuestionForm";
import { getRagIndexStats } from "@/lib/rag/get-rag-index-stats";

export default async function RagPage() {
  const stats = await getRagIndexStats();

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">RAG JobRadar</h1>

        <p className="text-gray-700">
          Pose une question sur ton profil candidat et les offres indexées. Le
          système recherche les documents les plus pertinents avec pgvector,
          puis demande au LLM de répondre à partir de ces sources.
        </p>

        <p className="text-gray-700">
          Le RAG utilise maintenant un index documentaire générique. Il peut
          contenir des offres d’emploi, le profil candidat actif, ainsi que des
          documents de profil ou de CV.
        </p>
      </section>

      <section className="rounded border p-4">
        <h2 className="text-xl font-semibold">État de l’index RAG</h2>

        <p className="mt-2 text-gray-700">
          Documents indexés : <strong>{stats.genericDocumentsCount}</strong>
        </p>

        <div className="mt-2 space-y-1 text-gray-700">
          <p>Répartition par type :</p>

          {Object.entries(stats.genericDocumentsByType).length > 0 ? (
            <ul className="list-disc pl-6">
              {Object.entries(stats.genericDocumentsByType).map(
                ([type, count]) => (
                  <li key={type}>
                    {type} : <strong>{count}</strong>
                  </li>
                ),
              )}
            </ul>
          ) : (
            <p>Aucun document RAG indexé.</p>
          )}
        </div>

        <p className="mt-3 text-sm text-gray-500">
          L’index RAG contient les documents utilisés pour répondre aux
          questions : profil candidat, offres d’emploi, documents de profil et
          CV Markdown.
        </p>
      </section>

      <RagQuestionForm />
    </main>
  );
}
