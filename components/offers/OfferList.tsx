import type { JobOffer } from "@/types/job-offer";
import { OfferCard } from "./OfferCard";

type OfferListProps = {
  offers: JobOffer[];
};

export function OfferList({ offers }: OfferListProps) {
  return (
    <section className="grid gap-4">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </section>
  );
}