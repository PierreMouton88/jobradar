import Link from "next/link";
import type { JobOffer } from "@/types/job-offer";

type OfferCardProps = {
  offer: JobOffer;
};

export function OfferCard({ offer }: OfferCardProps) {
  return (
    <article className="rounded-lg border p-4 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold">{offer.title}</h2>
        <p className="text-sm text-gray-600">
          {offer.company} — {offer.location}
        </p>
      </div>

      <div className="mt-2 flex gap-2 text-sm">
        <span>{offer.contractType}</span>
        <span>Remote : {offer.remote}</span>
      </div>

      <p className="mt-3 text-sm">{offer.description}</p>

      <ul className="mt-3 flex flex-wrap gap-2">
        {offer.skills.map((skill) => (
          <li key={skill} className="rounded bg-gray-800 px-2 py-1 text-sm">
            {skill}
          </li>
        ))}
      </ul>

      <Link
        href={`/offers/${offer.id}`}
        className="mt-4 inline-block text-sm font-medium underline"
      >
        Voir le détail
      </Link>
    </article>
  );
}
