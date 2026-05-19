"use client";

import { useFormStatus } from "react-dom";

type AnalyzeSubmitButtonProps = {
  isFakeAiMode: boolean;
  variant: "create" | "refresh";
};

export function AnalyzeSubmitButton({
  isFakeAiMode,
  variant,
}: AnalyzeSubmitButtonProps) {
  const { pending } = useFormStatus();

  const defaultLabel =
    variant === "create"
      ? isFakeAiMode
        ? "Analyser avec IA fake"
        : "Analyser avec LLM réel"
      : isFakeAiMode
        ? "Relancer l’analyse fake"
        : "Relancer avec LLM réel";

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Analyse en cours..." : defaultLabel}
    </button>
  );
}