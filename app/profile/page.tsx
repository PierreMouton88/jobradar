import { candidateProfile } from "@/lib/profile/candidate-profile";

export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Profil candidat</h1>
        <p className="mt-1 text-sm text-gray-400">
          Ce profil est utilisé pour calculer le score de compatibilité des
          offres.
        </p>
      </div>

      {/* Objectif */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-white">Objectif</h2>

        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Rôle cible
            </dt>
            <dd className="mt-1 text-gray-200">{candidateProfile.targetRole}</dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Niveau
            </dt>
            <dd className="mt-1">
              <span className="rounded-full border border-blue-800 bg-blue-900/40 px-3 py-1 text-sm text-blue-300">
                {candidateProfile.level}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {/* Compétences */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-white">Compétences</h2>

        <div className="mt-5 space-y-5">
          <div>
            <h3 className="mb-2 text-sm font-medium text-green-400">
              Maîtrisées
            </h3>
            <ul className="flex flex-wrap gap-2">
              {candidateProfile.strongSkills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-green-800 bg-green-900/30 px-3 py-1 text-sm text-green-300"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-yellow-400">
              En apprentissage
            </h3>
            <ul className="flex flex-wrap gap-2">
              {candidateProfile.learningSkills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-yellow-800 bg-yellow-900/30 px-3 py-1 text-sm text-yellow-300"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Préférences */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-white">Préférences</h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Contrats
            </h3>
            <ul className="flex flex-wrap gap-2">
              {candidateProfile.preferredContractTypes.map((contractType) => (
                <li
                  key={contractType}
                  className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-300"
                >
                  {contractType}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Remote
            </h3>
            <ul className="flex flex-wrap gap-2">
              {candidateProfile.preferredRemotePolicies.map((remotePolicy) => (
                <li
                  key={remotePolicy}
                  className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-300"
                >
                  {remotePolicy}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Localisations
            </h3>
            <ul className="flex flex-wrap gap-2">
              {candidateProfile.preferredLocations.map((location) => (
                <li
                  key={location}
                  className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-300"
                >
                  {location}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
