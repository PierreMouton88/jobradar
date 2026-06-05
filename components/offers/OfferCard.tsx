import Link from "next/link";
import type { JobOffer } from "@/types/job-offer";

type OfferCardProps = {
  offer: JobOffer;
};

export function OfferCard({ offer }: OfferCardProps) {
  const scoreColor =
    offer.score && offer.score.percentage >= 70
      ? "text-green-400"
      : offer.score && offer.score.percentage >= 40
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <article className="rounded-xl border border-gray-800 bg-gray-900 p-4 sm:p-5 transition-colors hover:border-gray-700">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white sm:text-lg">{offer.title}</h2>
          <p className="mt-0.5 text-sm text-gray-400 truncate">
            {offer.company} — {offer.location}
          </p>
        </div>
        {offer.score && (
          <div className="sm:shrink-0 sm:text-right">
            <p className={`text-base font-bold sm:text-xl ${scoreColor}`}>
              {offer.score.label} — {offer.score.percentage} %
            </p>
            <p className="text-xs text-gray-500">match</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
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
        className="mt-4 inline-block text-sm font-medium text-blue-400 hover:text-blue-300 underline"
      >
        Voir le détail →
      </Link>
    </article>
  );
}
