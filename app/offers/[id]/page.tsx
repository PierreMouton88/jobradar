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

  const scoreColor =
    offer.score && offer.score.percentage >= 70
      ? "text-green-400"
      : offer.score && offer.score.percentage >= 40
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{offer.title}</h1>
            <p className="mt-1 text-gray-400">
              {offer.company} — {offer.location}
            </p>
          </div>
          {offer.score && (
            <div className="shrink-0 text-right">
              <p className={`text-3xl font-bold ${scoreColor}`}>
                {offer.score.label} — {offer.score.percentage} % de compatibilité
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-gray-300">
            {offer.contractType}
          </span>
          <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-gray-300">
            Remote : {offer.remote ? "Oui" : "Non"}
          </span>
          <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-gray-400">
            {offer.source}
          </span>
          <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-gray-400">
            {offer.createdAt}
          </span>
        </div>

        <a
          href={offer.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 underline"
        >
          Voir l&apos;offre source →
        </a>
      </div>

      {/* Score détaillé */}
      {offer.score && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-lg font-semibold text-white">Score profil</h2>
          <p className="mt-1 text-sm text-gray-400">
            {offer.score.score}/{offer.score.maxScore} points
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {offer.score.positiveExplanations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-green-400">
                  Points positifs
                </h3>
                <ul className="mt-2 space-y-1">
                  {offer.score.positiveExplanations.map((explanation) => (
                    <li
                      key={`${explanation.label}-${explanation.points}`}
                      className="flex items-start gap-2 text-sm text-gray-300"
                    >
                      <span className="mt-0.5 text-green-500">+</span>
                      {explanation.label}
                      <span className="ml-auto shrink-0 text-green-400 text-xs">
                        +{explanation.points}pts
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {offer.score.negativeExplanations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-red-400">
                  Points de vigilance
                </h3>
                <ul className="mt-2 space-y-1">
                  {offer.score.negativeExplanations.map((explanation) => (
                    <li
                      key={`${explanation.label}-${explanation.points}`}
                      className="flex items-start gap-2 text-sm text-gray-300"
                    >
                      <span className="mt-0.5 text-red-500">−</span>
                      {explanation.label}
                      <span className="ml-auto shrink-0 text-red-400 text-xs">
                        {explanation.points}pts
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-white">Description</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-300 whitespace-pre-line">
          {offer.description}
        </p>
      </div>

      {/* Analyse IA */}
      {offer.analysis ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Analyse IA</h2>
            <span className="rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
              {offer.analysis.analysisMode === "real" ? "LLM réel" : "Fake mode"}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-gray-300">
            {offer.analysis.summary}
          </p>

          {/* Compétences */}
          <div className="grid gap-4 sm:grid-cols-2">
            {offer.analysis.requiredSkills.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-200">
                  Compétences requises
                </h3>
                <div className="flex flex-wrap gap-2">
                  {offer.analysis.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-blue-800 bg-blue-900/40 px-2.5 py-1 text-xs text-blue-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {offer.analysis.niceToHaveSkills.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-200">
                  Compétences bonus
                </h3>
                <div className="flex flex-wrap gap-2">
                  {offer.analysis.niceToHaveSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-purple-800 bg-purple-900/40 px-2.5 py-1 text-xs text-purple-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Signaux */}
          <div className="grid gap-4 sm:grid-cols-2">
            {offer.analysis.positiveSignals.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-green-400">
                  Signaux positifs
                </h3>
                <ul className="space-y-1">
                  {offer.analysis.positiveSignals.map((signal) => (
                    <li key={signal} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="mt-0.5 text-green-500">✓</span>
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {offer.analysis.redFlags.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-red-400">
                  Points de vigilance
                </h3>
                <ul className="space-y-1">
                  {offer.analysis.redFlags.map((redFlag) => (
                    <li key={redFlag} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="mt-0.5 text-red-500">!</span>
                      {redFlag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Infos rapides */}
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-gray-300">
              <span className="text-gray-500">Niveau</span>{" "}
              {offer.analysis.experienceLevel}
            </span>
            <span className="rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-gray-300">
              <span className="text-gray-500">Remote</span>{" "}
              {offer.analysis.remotePolicy}
            </span>
            <span className="rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-gray-300">
              <span className="text-gray-500">Salaire</span>{" "}
              {offer.analysis.salaryMentioned ? "Mentionné" : "Non mentionné"}
            </span>
          </div>

          {/* Méta technique */}
          <div className="rounded-lg border border-gray-800 bg-black/30 p-3 text-xs text-gray-500 space-y-1">
            {offer.analysis.modelName && (
              <p>Modèle : {offer.analysis.modelName}</p>
            )}
            {offer.analysis.totalTokens !== null &&
              offer.analysis.analysisMode !== "fake" && (
                <p>
                  Tokens : {offer.analysis.totalTokens}
                  {offer.analysis.inputTokens !== null &&
                    offer.analysis.outputTokens !== null && (
                      <> ({offer.analysis.inputTokens} in / {offer.analysis.outputTokens} out)</>
                    )}
                </p>
              )}
            {estimatedCostInCents !== null && (
              <p>Coût estimé : {estimatedCostInCents.toFixed(4)} ¢</p>
            )}
          </div>

          {!isFakeAiMode && (
            <p className="rounded-lg border border-yellow-700 bg-yellow-900/20 p-3 text-sm text-yellow-300">
              Attention : cette action appellera le vrai modèle et consommera des tokens.
            </p>
          )}

          <form
            action={async () => {
              "use server";
              await analyzeOfferAction(offer.id);
            }}
          >
            <AnalyzeSubmitButton isFakeAiMode={isFakeAiMode} variant="refresh" />
          </form>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Analyse IA</h2>
          <p className="mt-2 text-sm text-gray-400">
            Aucune analyse IA n&apos;a encore été générée pour cette offre.
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
        </div>
      )}
    </main>
  );
}
