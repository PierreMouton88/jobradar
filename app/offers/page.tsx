import { OfferFilters } from "@/components/offers/OfferFilters";
import { OfferList } from "@/components/offers/OfferList";
import { getOffers } from "@/lib/offers/get-offers";

export default async function OffersPage() {
  const offers = await getOffers();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Offres d'emploi</h1>
        <p className="mt-2 text-gray-600">
          Offres générées depuis le premier scraper statique de JobRadar IA.
        </p>
      </div>

      <OfferFilters />

      <OfferList offers={offers} />
    </main>
  );
}