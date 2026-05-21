export function OfferFilters() {
  return (
    <section className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-4">
      <h2 className="font-semibold text-white">Filtres</h2>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-300">
            Recherche
          </label>
          <input
            type="text"
            placeholder="React, TypeScript..."
            disabled
            className="mt-1 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 placeholder-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">
            Contrat
          </label>
          <select
            disabled
            className="mt-1 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
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
          <label className="block text-sm font-medium text-gray-300">
            Remote
          </label>
          <select
            disabled
            className="mt-1 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option>Tous</option>
            <option>Aucun</option>
            <option>Partiel</option>
            <option>Complet</option>
          </select>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-600">
        Les filtres sont désactivés pour l&apos;instant. Ils seront rendus
        interactifs plus tard.
      </p>
    </section>
  );
}
