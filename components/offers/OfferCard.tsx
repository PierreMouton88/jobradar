import Link from "next/link";
import type { JobOffer } from "@/types/job-offer";

type OfferCardProps = {
  offer: JobOffer;
};

type PriorityLevel = JobOffer["priority"]["priority"];

function getScoreColor(percentage: number): string {
  if (percentage >= 85) {
    return "text-green-400";
  }

  if (percentage >= 70) {
    return "text-blue-400";
  }

  if (percentage >= 50) {
    return "text-amber-400";
  }

  return "text-red-400";
}

function getPriorityClass(priority: PriorityLevel): string {
  const classes: Record<PriorityLevel, string> = {
    very_promising: "border-green-700 bg-green-900/20 text-green-300",
    interesting: "border-blue-700 bg-blue-900/20 text-blue-300",
    needs_ai_analysis: "border-purple-700 bg-purple-900/20 text-purple-300",
    watch: "border-amber-700 bg-amber-900/20 text-amber-300",
    low_priority: "border-gray-700 bg-gray-800 text-gray-300",
    probably_ignore: "border-red-800 bg-red-900/20 text-red-300",
  };

  return classes[priority];
}

function getUniqueLabels(labels: string[]): string[] {
  return Array.from(new Set(labels.filter(Boolean))).slice(0, 3);
}

export function OfferCard({ offer }: OfferCardProps) {
  const score = offer.score ?? {
    score: 0,
    maxScore: 100,
    percentage: 0,
    label: "Non scorée",
    positiveExplanations: [],
    negativeExplanations: [],
  };

  const scoreColor = getScoreColor(score.percentage);

  const positiveLabels = getUniqueLabels([
    ...score.positiveExplanations.map((explanation) => explanation.label),
    ...offer.priority.reasons
      .filter((reason) => reason.type === "positive")
      .map((reason) => reason.label),
  ]);

  const warningLabels = getUniqueLabels([
    ...offer.priority.reasons
      .filter((reason) => reason.type !== "positive")
      .map((reason) => reason.label),
    ...score.negativeExplanations.map((explanation) => explanation.label),
  ]);

  return (
    <article className="rounded-xl border border-gray-800 bg-gray-900 p-4 transition-colors hover:border-gray-700 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white sm:text-lg">
            {offer.title}
          </h2>
          <p className="mt-0.5 truncate text-sm text-gray-400">
            {offer.company} — {offer.location}
          </p>
        </div>

        <div className="sm:shrink-0 sm:text-right">
          <p className={`text-base font-bold sm:text-xl ${scoreColor}`}>
            {score.percentage} %{" "}
          </p>
          <p className="text-xs text-gray-500">{score.label}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getPriorityClass(
            offer.priority.priority,
          )}`}
        >
          {offer.priority.label}
        </span>

        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs ${
            offer.analysis
              ? "border-green-800 bg-green-900/20 text-green-300"
              : "border-purple-800 bg-purple-900/20 text-purple-300"
          }`}
        >
          {offer.analysis ? "Analyse IA disponible" : "Analyse IA absente"}
        </span>

        <span className="rounded-full border border-gray-700 bg-gray-800 px-2.5 py-0.5 text-xs text-gray-300">
          {offer.contractType}
        </span>

        <span className="rounded-full border border-gray-700 bg-gray-800 px-2.5 py-0.5 text-xs text-gray-300">
          Remote : {offer.remote ? "Oui" : "Non"}
        </span>
      </div>

      <p className="mt-3 line-clamp-3 text-sm text-gray-400">
        {offer.description}
      </p>

      {(positiveLabels.length > 0 || warningLabels.length > 0) && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {positiveLabels.length > 0 && (
            <div className="rounded-lg border border-green-900/70 bg-green-950/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-300/80">
                Points positifs
              </p>
              <ul className="mt-2 space-y-1 text-xs text-green-100/80">
                {positiveLabels.map((label) => (
                  <li key={label}>• {label}</li>
                ))}
              </ul>
            </div>
          )}

          {warningLabels.length > 0 && (
            <div className="rounded-lg border border-amber-900/70 bg-amber-950/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/80">
                Points de vigilance
              </p>
              <ul className="mt-2 space-y-1 text-xs text-amber-100/80">
                {warningLabels.map((label) => (
                  <li key={label}>• {label}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {offer.skills.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {offer.skills.map((skill) => (
            <li
              key={skill}
              className="rounded-full border border-blue-800 bg-blue-900/40 px-2.5 py-0.5 text-xs text-blue-300"
            >
              {skill}
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/offers/${offer.id}`}
        className="mt-4 inline-block text-sm font-medium text-blue-400 underline hover:text-blue-300"
      >
        Voir le détail →
      </Link>
    </article>
  );
}
