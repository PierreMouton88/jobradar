"use client";

import { useState } from "react";

import {
  runManualDemoWorkflowAction,
  type ManualDemoWorkflowActionResult,
} from "../actions";

type ManualDemoWorkflowButtonProps = {
  campaignId: string;
  disabled?: boolean;
  disabledReason?: string | null;
};

export function ManualDemoWorkflowButton({
  campaignId,
  disabled = false,
  disabledReason = null,
}: ManualDemoWorkflowButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const [accessCode, setAccessCode] = useState("");

  const [result, setResult] = useState<ManualDemoWorkflowActionResult | null>(
    null,
  );

  const [error, setError] = useState<string | null>(null);

  const canRun = !disabled && !isRunning && accessCode.trim().length > 0;

  async function handleRunWorkflow(): Promise<void> {
    if (!canRun) {
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const nextResult = await runManualDemoWorkflowAction({
        campaignId,
        accessCode,
      });

      setResult(nextResult);
      setAccessCode("");
      setIsModalOpen(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Une erreur inconnue est survenue pendant le workflow.",
      );
    } finally {
      setIsRunning(false);
    }
  }

  function closeModal(): void {
    if (isRunning) {
      return;
    }

    setIsModalOpen(false);
    setAccessCode("");
    setError(null);
  }

  return (
    <section className="rounded-xl border border-violet-900 bg-violet-950/20 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">
              Démonstration complète
            </h2>

            <span className="rounded-full border border-violet-800 bg-violet-950/60 px-2 py-1 text-xs font-medium text-violet-300">
              RAG + IA + email
            </span>
          </div>

          <p className="mt-2 max-w-3xl text-sm text-gray-400">
            Reprend cette campagne sans relancer Apify, synchronise un nombre
            limité de documents RAG, analyse quelques offres avec OpenAI, génère
            le rapport puis envoie le digest par email.
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Le workflow traite toute la campagne dans la limite des plafonds
            techniques globaux de l’application.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setResult(null);
            setIsModalOpen(true);
          }}
          disabled={disabled || isRunning}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Spinner />
              Workflow en cours…
            </>
          ) : (
            "Lancer la démonstration"
          )}
        </button>
      </div>

      {disabled && disabledReason ? (
        <div className="mt-4 rounded-lg border border-amber-900 bg-amber-950/30 p-3 text-sm text-amber-200">
          {disabledReason}
        </div>
      ) : null}

      {error && !isModalOpen ? (
        <div className="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {result ? <WorkflowResultView result={result} /> : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-xl rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              Confirmer la démonstration complète
            </h3>

            <div className="mt-3 space-y-2 text-sm text-gray-400">
              <p>
                Cette action effectuera de vrais appels OpenAI et enverra un
                email.
              </p>

              <p>
                L’import Apify ne sera pas relancé. Le workflow travaillera
                uniquement sur la campagne affichée.
              </p>

              <p>
                Un verrou empêche le lancement simultané avec le cron ou une
                autre démonstration.
              </p>
            </div>

            <div className="mt-5 rounded-lg border border-gray-700 bg-gray-800 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Campagne
              </p>

              <p className="mt-1 break-all font-mono text-sm text-gray-200">
                {campaignId}
              </p>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-medium text-gray-300">
                Code d’accès
              </span>

              <input
                type="password"
                value={accessCode}
                onChange={(event) => {
                  setAccessCode(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && canRun) {
                    event.preventDefault();
                    void handleRunWorkflow();
                  }
                }}
                disabled={isRunning}
                autoComplete="off"
                placeholder="Saisir le code privé"
                className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-violet-600 focus:outline-none"
              />
            </label>

            {error ? (
              <div className="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isRunning}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => void handleRunWorkflow()}
                disabled={!canRun}
                className="flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <Spinner />
                    Exécution…
                  </>
                ) : (
                  "Confirmer et lancer"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function WorkflowResultView({
  result,
}: {
  result: ManualDemoWorkflowActionResult;
}) {
  return (
    <div className="mt-5 rounded-lg border border-gray-700 bg-gray-900 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-white">Résultat du workflow</p>

          <p className="mt-1 text-sm text-gray-400">
            {result.jobOfferCount} offre
            {result.jobOfferCount > 1 ? "s" : ""} dans le périmètre.
          </p>
        </div>

        <WorkflowStatusBadge status={result.status} />
      </div>

      <div className="mt-4 grid gap-2">
        {result.steps.map((step) => (
          <div
            key={step.id}
            className="rounded-lg border border-gray-700 bg-gray-800 p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-white">{step.id}</p>

              <StepStatusBadge status={step.status} />
            </div>

            <p className="mt-2 text-sm text-gray-400">{step.message}</p>

            {step.errorMessage ? (
              <p className="mt-2 text-sm text-red-300">{step.errorMessage}</p>
            ) : null}
          </div>
        ))}
      </div>

      {result.reportFilePath ? (
        <p className="mt-4 break-all text-xs text-gray-500">
          Rapport serveur : {result.reportFilePath}
        </p>
      ) : null}
    </div>
  );
}

function WorkflowStatusBadge({
  status,
}: {
  status: ManualDemoWorkflowActionResult["status"];
}) {
  const className = {
    PLANNED: "border-blue-800 bg-blue-950/40 text-blue-300",
    SKIPPED: "border-gray-700 bg-gray-800 text-gray-300",
    SUCCESS: "border-emerald-800 bg-emerald-950/40 text-emerald-300",
    PARTIAL: "border-amber-800 bg-amber-950/40 text-amber-300",
    FAILED: "border-red-800 bg-red-950/40 text-red-300",
  }[status];

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${className}`}
    >
      {status}
    </span>
  );
}

function StepStatusBadge({
  status,
}: {
  status: ManualDemoWorkflowActionResult["steps"][number]["status"];
}) {
  const className = {
    PLANNED: "border-blue-800 bg-blue-950/40 text-blue-300",
    SKIPPED: "border-gray-700 bg-gray-900 text-gray-400",
    SUCCESS: "border-emerald-800 bg-emerald-950/40 text-emerald-300",
    PARTIAL: "border-amber-800 bg-amber-950/40 text-amber-300",
    ERROR: "border-red-800 bg-red-950/40 text-red-300",
  }[status];

  return (
    <span
      className={`rounded-full border px-2 py-1 text-xs font-medium ${className}`}
    >
      {status}
    </span>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />

      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
