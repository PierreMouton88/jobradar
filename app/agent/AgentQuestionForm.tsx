"use client";

import { useActionState } from "react";

import { askJobAgent, type AgentActionState } from "./actions";

const initialState: AgentActionState = {
  answer: null,
  toolCalls: [],
  usage: null,
  error: null,
};

export function AgentQuestionForm() {
  const [state, formAction, isPending] = useActionState(
    askJobAgent,
    initialState,
  );

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4 rounded-lg border p-4">
        <div className="space-y-2">
          <label htmlFor="question" className="block font-medium">
            Question pour l’agent
          </label>

          <textarea
            id="question"
            name="question"
            rows={4}
            className="w-full rounded-md border px-3 py-2"
            placeholder="Exemple : Trouve une offre React junior et détaille la première."
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md border px-4 py-2 font-medium disabled:opacity-50"
        >
          {isPending ? "L’agent réfléchit..." : "Demander à l’agent"}
        </button>
      </form>

      {state.error ? (
        <div className="rounded-lg border border-red-300 p-4 text-red-700">
          {state.error}
        </div>
      ) : null}

      {state.answer ? (
        <section className="space-y-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Réponse agent</h2>
          <div className="whitespace-pre-wrap">{state.answer}</div>
        </section>
      ) : null}

      {state.toolCalls.length > 0 ? (
        <section className="space-y-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Tools utilisés</h2>

          <ul className="space-y-3">
            {state.toolCalls.map((toolCall, index) => (
              <li key={`${toolCall.toolName}-${index}`} className="space-y-1">
                <div className="font-medium">{toolCall.toolName}</div>
                <pre className="overflow-x-auto rounded-md border bg-black/30 p-2 text-sm text-gray-100">
                  {JSON.stringify(toolCall.input, null, 2)}
                </pre>
                <div className="text-sm text-gray-700">
                  Résultat : {toolCall.outputSummary}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {state.usage ? (
        <section className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Usage tokens</h2>
          <p>Input tokens : {state.usage.inputTokens ?? "N/A"}</p>
          <p>Output tokens : {state.usage.outputTokens ?? "N/A"}</p>
          <p>Total tokens : {state.usage.totalTokens ?? "N/A"}</p>
        </section>
      ) : null}
    </div>
  );
}
