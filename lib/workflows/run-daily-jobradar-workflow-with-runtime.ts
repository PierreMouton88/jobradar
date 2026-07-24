import type { DailyJobRadarWorkflowConfig } from "./daily-jobradar-workflow-config";

import {
  runDailyJobRadarWorkflow,
  type DailyJobRadarWorkflowResult,
  type RunDailyJobRadarWorkflowDependencies,
} from "./run-daily-jobradar-workflow";

import {
  acquireDailyJobRadarWorkflowLock,
  getDailyJobRadarWorkflowLockFilePath,
  type DailyJobRadarWorkflowLock,
} from "./daily-jobradar-workflow-lock";

import {
  appendDailyJobRadarWorkflowJournalEntry,
  buildDailyJobRadarWorkflowFailureJournalEntry,
  buildDailyJobRadarWorkflowJournalEntry,
  getDailyJobRadarWorkflowJournalFilePath,
  type DailyJobRadarWorkflowJournalEntry,
  type DailyJobRadarWorkflowTrigger,
} from "./daily-jobradar-workflow-journal";

export type RunDailyJobRadarWorkflowWithRuntimeOptions = {
  execute: boolean;
  config: DailyJobRadarWorkflowConfig;
  trigger: DailyJobRadarWorkflowTrigger;

  campaignId?: string | null;
  recentHours?: number;
  now?: Date;

  /**
   * Le CLI ponctuel ferme Prisma à la fin.
   * Le serveur Next.js conserve sa connexion pour les requêtes suivantes.
   */
  disconnectDependencies?: boolean;
};

async function tryAppendJournalEntry(
  entry: DailyJobRadarWorkflowJournalEntry,
): Promise<void> {
  try {
    await appendDailyJobRadarWorkflowJournalEntry({
      journalFilePath: getDailyJobRadarWorkflowJournalFilePath(),
      entry,
    });
  } catch (error) {
    console.error(
      "Impossible d’écrire dans le journal du workflow quotidien.",
      error,
    );
  }
}

/**
 * Exécute le workflow avec ses protections d’infrastructure :
 *
 * - verrou anti-chevauchement ;
 * - chargement différé des dépendances serveur ;
 * - journal de succès ou d’échec ;
 * - fermeture des connexions ;
 * - libération systématique du verrou.
 *
 * Cette fonction peut être appelée aussi bien par le CLI que par une
 * Server Action Next.js.
 */
export async function runDailyJobRadarWorkflowWithRuntime(
  options: RunDailyJobRadarWorkflowWithRuntimeOptions,
): Promise<DailyJobRadarWorkflowResult> {
  const startedAt = options.now ?? new Date();

  let dependencies: RunDailyJobRadarWorkflowDependencies | undefined;

  let disconnect: (() => Promise<void>) | undefined;

  let workflowLock: DailyJobRadarWorkflowLock | undefined;

  /*
   * En dry-run ou lorsque le workflow est désactivé, aucune connexion
   * serveur et aucun verrou ne sont nécessaires.
   */
  if (options.execute && options.config.enabled) {
    workflowLock = await acquireDailyJobRadarWorkflowLock({
      lockFilePath: getDailyJobRadarWorkflowLockFilePath(),
    });

    const serverDependencies = await import(
      "./daily-jobradar-workflow-dependencies"
    );

    dependencies =
      serverDependencies.DAILY_JOBRADAR_WORKFLOW_DEPENDENCIES;

    disconnect =
      serverDependencies.disconnectDailyJobRadarWorkflowDependencies;
  }

  try {
    const result = await runDailyJobRadarWorkflow(
      {
        execute: options.execute,
        config: options.config,
        now: startedAt,
        campaignId: options.campaignId ?? null,
        recentHours: options.recentHours ?? 24,
      },
      dependencies,
    );

    await tryAppendJournalEntry(
      buildDailyJobRadarWorkflowJournalEntry({
        result,
        trigger: options.trigger,
      }),
    );

    return result;
  } catch (error) {
    await tryAppendJournalEntry(
      buildDailyJobRadarWorkflowFailureJournalEntry({
        error,
        startedAt,
        finishedAt: new Date(),
        execute: options.execute,
        trigger: options.trigger,
        campaignId: options.campaignId ?? null,
      }),
    );

    throw error;
  } finally {
    try {
      await disconnect?.();
    } finally {
      await workflowLock?.release();
    }
  }
}