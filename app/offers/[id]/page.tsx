import { notFound } from "next/navigation";
import { getOfferById } from "@/lib/offers/get-offers";
import { analyzeOfferAction } from "./actions";
import { AnalyzeSubmitButton } from "./AnalyzeSubmitButton";
import { estimateAiCostInDollarCents } from "@/lib/ai/estimate-ai-cost";

type OfferDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfferDetailPage({
  params,
}: OfferDetailPageProps) {
  const { id } = await params;

  const offer = await getOfferById(id);

  if (!offer) {
    notFound();
  }
  
  const estimatedCostInCents = offer.analysis
    ? estimateAiCostInDollarCents({
        modelName: offer.analysis.modelName,
        inputTokens: offer.analysis.inputTokens,
        outputTokens: offer.analysis.outputTokens,
      })
    : null;

  const isFakeAiMode = process.env.USE_FAKE_AI !== "false";
  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{offer.title}</h1>
        <p className="mt-2 text-gray-600">
          {offer.company} — {offer.location}
        </p>
      </div>

      <section className="space-y-3 rounded-lg border p-4">
        <p>
          <strong>Contrat :</strong> {offer.contractType}
        </p>

        <p>
          <strong>Remote :</strong> {offer.remote ? "Oui" : "Non"}
        </p>

        <p>
          <strong>Source :</strong> {offer.source}
        </p>

        <p>
          <strong>Date d'ajout :</strong> {offer.createdAt}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold">Description</h2>
        <p className="mt-2 text-white">{offer.description}</p>
      </section>

      {offer.analysis ? (
        <section className="mt-8 rounded-lg border p-4">
          <h2 className="text-xl font-semibold">Analyse IA</h2>
          <p className="mt-1 text-xs text-gray-500">
            Mode actuel : {isFakeAiMode ? "Fake AI" : "LLM réel"}
          </p>

          <p className="mt-2 text-sm text-white">{offer.analysis.summary}</p>

          {offer.analysis.requiredSkills.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium">Compétences requises</h3>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {offer.analysis.requiredSkills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>
          )}
          {offer.analysis.niceToHaveSkills.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium">Compétences bonus</h3>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {offer.analysis.niceToHaveSkills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>
          )}
          {offer.analysis.positiveSignals.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium">Signaux positifs</h3>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {offer.analysis.positiveSignals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </div>
          )}
          {offer.analysis.redFlags.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium">Points de vigilance</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
                {offer.analysis.redFlags.map((redFlag) => (
                  <li key={redFlag}>{redFlag}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 text-sm">
            <p>
              <strong>Niveau estimé :</strong> {offer.analysis.experienceLevel}
            </p>
            <p>
              <strong>Politique remote :</strong> {offer.analysis.remotePolicy}
            </p>
            <p>
              <strong>Salaire mentionné :</strong>{" "}
              {offer.analysis.salaryMentioned ? "Oui" : "Non"}
            </p>
          </div>
          <div className="mt-4 rounded bg-gray-50 p-3 text-xs text-gray-600">
            <p>
              <strong>Mode d’analyse :</strong>{" "}
              {offer.analysis.analysisMode === "real"
                ? "LLM réel"
                : "Fake mode"}
            </p>

            {offer.analysis.modelName && (
              <p>
                <strong>Modèle :</strong> {offer.analysis.modelName}
              </p>
            )}

            {offer.analysis.totalTokens !== null &&
              offer.analysis.analysisMode !== "fake" && (
                <p>
                  <strong>Tokens consommés :</strong>{" "}
                  {offer.analysis.totalTokens}
                  {offer.analysis.inputTokens !== null &&
                    offer.analysis.outputTokens !== null && (
                      <>
                        {" "}
                        ({offer.analysis.inputTokens} input /{" "}
                        {offer.analysis.outputTokens} output)
                      </>
                    )}
                </p>
              )}
            {estimatedCostInCents !== null && (
              <p>
                <strong>Coût estimé :</strong> {estimatedCostInCents.toFixed(4)}{" "}
                centime(s) de dollar
              </p>
            )}
          </div>
          {!isFakeAiMode && (
            <p className="mt-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
              Attention : cette action appellera le vrai modèle OpenAI et
              consommera des tokens.
            </p>
          )}
          <form
            action={async () => {
              "use server";
              await analyzeOfferAction(offer.id);
            }}
            className="mt-4"
          >
            <AnalyzeSubmitButton
              isFakeAiMode={isFakeAiMode}
              variant="refresh"
            />
          </form>
        </section>
      ) : (
        <section className="mt-8 rounded-lg border border-dashed p-4">
          <h2 className="text-xl font-semibold">Analyse IA</h2>
          <p className="mt-2 text-sm text-gray-600">
            Aucune analyse IA n’a encore été générée pour cette offre.
          </p>

          <form
            action={async () => {
              "use server";
              await analyzeOfferAction(offer.id);
            }}
            className="mt-4"
          >
            <AnalyzeSubmitButton isFakeAiMode={isFakeAiMode} variant="create" />
          </form>
        </section>
      )}

      <a
        href={offer.url}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-block underline"
      >
        Voir l’offre source
      </a>
    </main>
  );
}
