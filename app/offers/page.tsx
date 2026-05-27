import { OfferFilters } from "@/components/offers/OfferFilters";
import { OfferList } from "@/components/offers/OfferList";
import { getOffers } from "@/lib/offers/get-offers";

export default async function OffersPage() {
  const offers = await getOffers();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Offres d&apos;emploi</h1>
        <p className="mt-2 text-gray-400">
          Offres générées depuis le premier scraper statique de JobRadar IA.
        </p>
      </div>

      <OfferFilters />

      <OfferList offers={offers} />
    </main>
  );
}