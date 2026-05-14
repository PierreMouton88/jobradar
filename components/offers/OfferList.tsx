import type { JobOffer } from "@/types/job-offer";
import { OfferCard } from "./OfferCard";

type OfferListProps = {
  offers: JobOffer[];
};

export function OfferList({ offers }: OfferListProps) {
  if (offers.length === 0) {
    return (
      <p className="mt-6 rounded-lg border p-4 text-sm text-gray-600">
        Aucune offre à afficher pour le moment. Lance le script de scraping pour
        générer le fichier JSON.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  );
}