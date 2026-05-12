import Link from "next/link";
import { notFound } from "next/navigation";
import { mockOffers } from "@/lib/mock-offers";

type OfferDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfferDetailPage({ params }: OfferDetailPageProps) {
  const { id } = await params;
  const offer = mockOffers.find((offer) => offer.id === id);

  if (!offer) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/offers" className="text-sm underline">
        ← Retour aux offres
      </Link>

      <article className="mt-6 rounded-lg border p-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold">{offer.title}</h1>
          <p className="mt-2 text-gray-600">
            {offer.company} — {offer.location}
          </p>
        </div>

        <div className="mt-4 flex gap-3 text-sm">
          <span className="rounded bg-gray-600 px-2 py-1 text-white">
            {offer.contractType}
          </span>
          <span className="rounded bg-gray-600 px-2 py-1 text-white">
            Remote : {offer.remote}
          </span>
        </div>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">Description</h2>
          <p className="mt-2 leading-relaxed">{offer.description}</p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">Compétences demandées</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {offer.skills.map((skill) => (
              <li key={skill} className="rounded bg-gray-600 px-2 py-1 text-sm">
                {skill}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">Source</h2>
          <p className="mt-2 text-sm">
            Source : {offer.source}
          </p>
          <a
            href={offer.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm underline"
          >
            Voir l’offre originale
          </a>
        </section>
        <section className="mt-6">
          <h2 className="text-xl font-semibold">Pourquoi cette offre est intéressante ? </h2>
          <p className="mt-2 leading-relaxed">
            Cette offre est intéressante car elle combine des technologies modernes comme React et TypeScript, et offre la possibilité de travailler en remote.
          </p>
        </section>
        <section className="mt-6">
          <h2 className="text-xl font-semibold">Données techniques</h2>
          <p className="mt-2 text-sm">
            ID : {offer.id}<br />
            Date de création : {offer.createdAt}<br />
            URL : {offer.url}
          </p>
        </section>
      </article>
    </main>
  );
}