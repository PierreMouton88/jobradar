import { notFound } from "next/navigation";
import { getOfferById } from "@/lib/offers/get-offers";

type OfferDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfferDetailPage({ params }: OfferDetailPageProps) {
  const { id } = await params;

  const offer = await getOfferById(id);

  if (!offer) {
    notFound();
  }

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
        <p className="mt-2 text-gray-700">{offer.description}</p>
      </section>

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