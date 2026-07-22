import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  acquireDailyJobRadarWorkflowLock,
  DailyJobRadarWorkflowAlreadyRunningError,
} from "@/lib/workflows/daily-jobradar-workflow-lock";

const temporaryDirectories: string[] = [];

async function createTemporaryLockPath() {
  const temporaryDirectory =
    await fs.mkdtemp(
      path.join(
        os.tmpdir(),
        "jobradar-workflow-lock-",
      ),
    );

  temporaryDirectories.push(
    temporaryDirectory,
  );

  return path.join(
    temporaryDirectory,
    "daily-workflow.lock",
  );
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(
      (temporaryDirectory) =>
        fs.rm(temporaryDirectory, {
          recursive: true,
          force: true,
        }),
    ),
  );
});

describe("acquireDailyJobRadarWorkflowLock", () => {
  it("crée puis libère le verrou", async () => {
    const lockFilePath =
      await createTemporaryLockPath();

    const lock =
      await acquireDailyJobRadarWorkflowLock({
        lockFilePath,
        now: new Date(
          "2026-07-21T08:00:00.000Z",
        ),
        pid: 123,
        hostname: "jobradar-test",
      });

    const storedMetadata = JSON.parse(
      await fs.readFile(
        lockFilePath,
        "utf8",
      ),
    );

    expect(storedMetadata).toMatchObject({
      lockId: lock.metadata.lockId,
      pid: 123,
      hostname: "jobradar-test",
      startedAt:
        "2026-07-21T08:00:00.000Z",
    });

    await lock.release();

    await expect(
      fs.stat(lockFilePath),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("refuse une deuxième exécution active", async () => {
    const lockFilePath =
      await createTemporaryLockPath();

    const firstLock =
      await acquireDailyJobRadarWorkflowLock({
        lockFilePath,
        now: new Date(
          "2026-07-21T08:00:00.000Z",
        ),
        maxAgeMs: 60_000,
        pid: 123,
        hostname: "worker-1",
      });

    await expect(
      acquireDailyJobRadarWorkflowLock({
        lockFilePath,
        now: new Date(
          "2026-07-21T08:00:30.000Z",
        ),
        maxAgeMs: 60_000,
        pid: 456,
        hostname: "worker-2",
      }),
    ).rejects.toBeInstanceOf(
      DailyJobRadarWorkflowAlreadyRunningError,
    );

    await firstLock.release();
  });

  it("remplace un verrou expiré", async () => {
    const lockFilePath =
      await createTemporaryLockPath();

    const expiredLock =
      await acquireDailyJobRadarWorkflowLock({
        lockFilePath,
        now: new Date(
          "2026-07-21T08:00:00.000Z",
        ),
        maxAgeMs: 60_000,
        pid: 123,
        hostname: "worker-old",
      });

    const newLock =
      await acquireDailyJobRadarWorkflowLock({
        lockFilePath,
        now: new Date(
          "2026-07-21T08:02:00.000Z",
        ),
        maxAgeMs: 60_000,
        pid: 456,
        hostname: "worker-new",
      });

    expect(newLock.metadata.pid).toBe(456);

    /*
     * L’ancienne exécution ne doit pas supprimer
     * le verrou de la nouvelle.
     */
    await expiredLock.release();

    const storedMetadata = JSON.parse(
      await fs.readFile(
        lockFilePath,
        "utf8",
      ),
    );

    expect(storedMetadata.lockId).toBe(
      newLock.metadata.lockId,
    );

    await newLock.release();
  });

  it("permet de libérer plusieurs fois sans erreur", async () => {
    const lockFilePath =
      await createTemporaryLockPath();

    const lock =
      await acquireDailyJobRadarWorkflowLock({
        lockFilePath,
      });

    await lock.release();
    await lock.release();

    await expect(
      fs.stat(lockFilePath),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("refuse une durée maximale invalide", async () => {
    const lockFilePath =
      await createTemporaryLockPath();

    await expect(
      acquireDailyJobRadarWorkflowLock({
        lockFilePath,
        maxAgeMs: 0,
      }),
    ).rejects.toThrow(
      "maxAgeMs must be a positive number.",
    );
  });
});