import { AgentQuestionForm } from "./AgentQuestionForm";

export default function AgentPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">Agent JobRadar IA</h1>

        <p className="text-gray-700">
          Cet agent peut utiliser des tools contrôlés pour explorer les offres
          stockées en base. Pour l’instant, il peut rechercher des offres et
          consulter le détail d’une offre. Il ne peut pas modifier de données,
          envoyer de mail, postuler ou lancer de scraping.
        </p>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 text-lg font-semibold">Garde-fous actuels</h2>

        <ul className="list-inside list-disc space-y-1 text-gray-700">
          <li>Tools de lecture uniquement</li>
          <li>Nombre d’étapes limité</li>
          <li>Inputs validés avec Zod</li>
          <li>Trace des tools utilisés affichée</li>
          <li>Aucune action sensible sans validation humaine</li>
        </ul>
      </section>

      <AgentQuestionForm />
    </main>
  );
}