"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { askOffersRagQuestion } from "../../app/rag/actions";

type RagSource = {
  jobOfferId: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  distance: number;
};

type RagState = {
  error: string | null;
  answer: string | null;
  sources: RagSource[];
};

export function RagQuestionForm() {
  const [state, setState] = useState<RagState>({
    error: null,
    answer: null,
    sources: [],
  });

  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await askOffersRagQuestion(formData);
      setState(result);
    });
  }

  return (
    <div className="space-y-6">
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="question" className="block font-medium">
            Question sur les offres
          </label>

          <textarea
            id="question"
            name="question"
            rows={4}
            className="w-full rounded border p-3"
            placeholder="Exemple : Quelles offres sont adaptées à un profil React junior en télétravail ?"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isPending ? "Recherche en cours..." : "Poser la question"}
        </button>
      </form>

      {state.error ? (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-red-700">
          {state.error}
        </div>
      ) : null}

      {state.answer ? (
        <section className="space-y-3 rounded border p-4">
          <h2 className="text-xl font-semibold">Réponse</h2>
          <p className="whitespace-pre-wrap">{state.answer}</p>
        </section>
      ) : null}
      {state.answer && state.sources.length === 0 ? (
        <section className="rounded border border-amber-300 bg-amber-50 p-4 text-amber-800">
          <h2 className="font-semibold">Aucune source RAG trouvée</h2>
          <p>
            La réponse indique qu’aucune offre indexée n’a été trouvée. Vérifie
            que les embeddings ont bien été générés avec le script RAG.
          </p>
        </section>
      ) : null}
      {state.sources.length > 0 ? (
        <section className="space-y-3 rounded border p-4">
          <h2 className="text-xl font-semibold">Sources utilisées</h2>

          <ul className="space-y-3">
            {state.sources.map((source, index) => (
              <li key={source.jobOfferId} className="rounded border p-3">
                <p className="font-medium">
                  Source {index + 1} —{" "}
                  <Link
                    href={`/offers/${source.jobOfferId}`}
                    className="underline underline-offset-2"
                  >
                    {source.title}
                  </Link>
                </p>
                <p className="text-sm text-gray-700">
                  {source.company} — {source.location} — {source.contractType}
                </p>
                <p className="text-sm text-gray-500">
                  Distance vectorielle : {source.distance.toFixed(4)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
