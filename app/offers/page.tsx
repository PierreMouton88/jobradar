import { OfferFilters } from "@/components/offers/OfferFilters";
import { OfferList } from "@/components/offers/OfferList";
import { mockOffers } from "@/lib/mock-offers";

export default function OffersPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Offres d’emploi</h1>
        <p className="mt-2 text-gray-600">
          Liste fictive d’offres pour construire progressivement JobRadar IA.
        </p>
      </div>

      <OfferFilters />

      <OfferList offers={mockOffers} />
    </main>
  );
}