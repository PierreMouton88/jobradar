import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const DEFAULT_MAX_LOCK_AGE_MS =
  12 * 60 * 60 * 1000;

export type DailyJobRadarWorkflowLockMetadata = {
  lockId: string;
  pid: number;
  hostname: string;
  startedAt: string;
  expiresAt: string;
};

export type AcquireDailyJobRadarWorkflowLockOptions = {
  lockFilePath: string;

  now?: Date;
  maxAgeMs?: number;

  pid?: number;
  hostname?: string;
};

export type DailyJobRadarWorkflowLock = {
  lockFilePath: string;
  metadata: DailyJobRadarWorkflowLockMetadata;
  release: () => Promise<void>;
};

export class DailyJobRadarWorkflowAlreadyRunningError extends Error {
  readonly lockFilePath: string;
  readonly metadata: DailyJobRadarWorkflowLockMetadata | null;

  constructor(input: {
    lockFilePath: string;
    metadata: DailyJobRadarWorkflowLockMetadata | null;
  }) {
    const executionDetails = input.metadata
      ? [
          `PID ${input.metadata.pid}`,
          `hôte ${input.metadata.hostname}`,
          `démarrée à ${input.metadata.startedAt}`,
        ].join(", ")
      : "métadonnées indisponibles";

    super(
      [
        "Une exécution du workflow quotidien est déjà en cours.",
        executionDetails,
        `Verrou : ${input.lockFilePath}`,
      ].join(" "),
    );

    this.name =
      "DailyJobRadarWorkflowAlreadyRunningError";

    this.lockFilePath = input.lockFilePath;
    this.metadata = input.metadata;
  }
}

function isNodeError(
  error: unknown,
): error is NodeJS.ErrnoException {
  return (
    error instanceof Error &&
    "code" in error
  );
}

function isLockMetadata(
  value: unknown,
): value is DailyJobRadarWorkflowLockMetadata {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const metadata =
    value as Record<string, unknown>;

  return (
    typeof metadata.lockId === "string" &&
    typeof metadata.pid === "number" &&
    typeof metadata.hostname === "string" &&
    typeof metadata.startedAt === "string" &&
    typeof metadata.expiresAt === "string"
  );
}

async function readLockMetadata(
  lockFilePath: string,
): Promise<DailyJobRadarWorkflowLockMetadata | null> {
  try {
    const content = await fs.readFile(
      lockFilePath,
      "utf8",
    );

    const parsedValue: unknown =
      JSON.parse(content);

    return isLockMetadata(parsedValue)
      ? parsedValue
      : null;
  } catch (error) {
    if (
      isNodeError(error) &&
      error.code === "ENOENT"
    ) {
      return null;
    }

    return null;
  }
}

async function isExistingLockStale(input: {
  lockFilePath: string;
  metadata: DailyJobRadarWorkflowLockMetadata | null;
  now: Date;
  maxAgeMs: number;
}): Promise<boolean> {
  if (input.metadata) {
    const expiresAt =
      new Date(input.metadata.expiresAt);

    if (
      !Number.isNaN(expiresAt.getTime())
    ) {
      return expiresAt.getTime() <=
        input.now.getTime();
    }
  }

  try {
    const stats = await fs.stat(
      input.lockFilePath,
    );

    return (
      input.now.getTime() -
        stats.mtime.getTime() >=
      input.maxAgeMs
    );
  } catch (error) {
    return (
      isNodeError(error) &&
      error.code === "ENOENT"
    );
  }
}

function validateMaxAge(
  maxAgeMs: number,
): void {
  if (
    !Number.isFinite(maxAgeMs) ||
    maxAgeMs <= 0
  ) {
    throw new Error(
      "maxAgeMs must be a positive number.",
    );
  }
}

async function removeStaleLock(
  lockFilePath: string,
): Promise<void> {
  try {
    await fs.unlink(lockFilePath);
  } catch (error) {
    if (
      !isNodeError(error) ||
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  }
}

export function getDailyJobRadarWorkflowLockFilePath(
  runtimeDir =
    process.env.JOBRADAR_RUNTIME_DIR ??
    path.join(process.cwd(), "runtime"),
): string {
  return path.join(
    runtimeDir,
    "daily-jobradar-workflow.lock",
  );
}

export async function acquireDailyJobRadarWorkflowLock(
  options: AcquireDailyJobRadarWorkflowLockOptions,
): Promise<DailyJobRadarWorkflowLock> {
  const now = options.now ?? new Date();

  const maxAgeMs =
    options.maxAgeMs ??
    DEFAULT_MAX_LOCK_AGE_MS;

  validateMaxAge(maxAgeMs);

  await fs.mkdir(
    path.dirname(options.lockFilePath),
    {
      recursive: true,
    },
  );

  const metadata: DailyJobRadarWorkflowLockMetadata =
    {
      lockId: crypto.randomUUID(),
      pid: options.pid ?? process.pid,
      hostname:
        options.hostname ?? os.hostname(),
      startedAt: now.toISOString(),
      expiresAt: new Date(
        now.getTime() + maxAgeMs,
      ).toISOString(),
    };

  async function tryAcquire(
    canRemoveStaleLock: boolean,
  ): Promise<DailyJobRadarWorkflowLock> {
    try {
      const handle = await fs.open(
        options.lockFilePath,
        "wx",
      );

      try {
        await handle.writeFile(
          JSON.stringify(metadata, null, 2),
          "utf8",
        );
      } finally {
        await handle.close();
      }
    } catch (error) {
      if (
        !isNodeError(error) ||
        error.code !== "EEXIST"
      ) {
        throw error;
      }

      const existingMetadata =
        await readLockMetadata(
          options.lockFilePath,
        );

      const stale =
        await isExistingLockStale({
          lockFilePath:
            options.lockFilePath,
          metadata: existingMetadata,
          now,
          maxAgeMs,
        });

      if (
        stale &&
        canRemoveStaleLock
      ) {
        await removeStaleLock(
          options.lockFilePath,
        );

        return tryAcquire(false);
      }

      throw new DailyJobRadarWorkflowAlreadyRunningError(
        {
          lockFilePath:
            options.lockFilePath,
          metadata: existingMetadata,
        },
      );
    }

    let released = false;

    return {
      lockFilePath:
        options.lockFilePath,
      metadata,

      release: async () => {
        if (released) {
          return;
        }

        released = true;

        const currentMetadata =
          await readLockMetadata(
            options.lockFilePath,
          );

        /*
         * Le verrou a pu expirer et être remplacé.
         * Une ancienne exécution ne doit jamais supprimer
         * le verrou appartenant à une nouvelle exécution.
         */
        if (
          currentMetadata?.lockId !==
          metadata.lockId
        ) {
          return;
        }

        try {
          await fs.unlink(
            options.lockFilePath,
          );
        } catch (error) {
          if (
            !isNodeError(error) ||
            error.code !== "ENOENT"
          ) {
            throw error;
          }
        }
      },
    };
  }

  return tryAcquire(true);
}