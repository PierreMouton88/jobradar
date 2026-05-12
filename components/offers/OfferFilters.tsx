export function OfferFilters() {
  return (
    <section className="mb-6 rounded-lg border p-4">
      <h2 className="font-semibold">Filtres</h2>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium">Recherche</label>
          <input
            type="text"
            placeholder="React, TypeScript..."
            disabled
            className="mt-1 w-full rounded border px-3 py-2 text-sm disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Contrat</label>
          <select
            disabled
            className="mt-1 w-full rounded border px-3 py-2 text-sm disabled:bg-gray-100"
          >
            <option>Tous</option>
            <option>CDI</option>
            <option>CDD</option>
            <option>Stage</option>
            <option>Alternance</option>
            <option>Freelance</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Remote</label>
          <select
            disabled
            className="mt-1 w-full rounded border px-3 py-2 text-sm disabled:bg-gray-100"
          >
            <option>Tous</option>
            <option>Aucun</option>
            <option>Partiel</option>
            <option>Complet</option>
          </select>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Les filtres sont désactivés pour l’instant. Ils seront rendus
        interactifs plus tard.
      </p>
    </section>
  );
}