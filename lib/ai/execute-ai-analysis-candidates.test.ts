import { describe, expect, it, vi } from "vitest";

import {
  executeAiAnalysisCandidates,
  type AiAnalysisExecutionCandidate,
  type ExecuteAiAnalysisCandidatesDependencies,
} from "@/lib/ai/execute-ai-analysis-candidates";

function createCandidate(
  jobOfferId: string,
): AiAnalysisExecutionCandidate {
  return {
    offer: {
      id: jobOfferId,
      title: `Offre ${jobOfferId}`,
    },
  };
}

function createDependencies(): ExecuteAiAnalysisCandidatesDependencies {
  return {
    analyzeAndSave: vi.fn().mockImplementation(
      async (jobOfferId: string) => ({
        analysisMode: "OPENAI",
        modelName: "gpt-test",
        inputTokens:
          jobOfferId === "offer-1" ? 100 : 200,
        outputTokens:
          jobOfferId === "offer-1" ? 20 : 40,
        totalTokens:
          jobOfferId === "offer-1" ? 120 : 240,
      }),
    ),
  };
}

describe("executeAiAnalysisCandidates", () => {
  it("reste en dry-run par défaut sans appel IA", async () => {
    const dependencies = createDependencies();

    const result =
      await executeAiAnalysisCandidates(
        {
          candidates: [
            createCandidate("offer-1"),
            createCandidate("offer-2"),
          ],
          maxAnalyses: 2,
        },
        dependencies,
      );

    expect(result.mode).toBe("DRY_RUN");

    expect(result.items).toEqual([
      {
        jobOfferId: "offer-1",
        title: "Offre offer-1",
        status: "PLANNED",
      },
      {
        jobOfferId: "offer-2",
        title: "Offre offer-2",
        status: "PLANNED",
      },
    ]);

    expect(
      dependencies.analyzeAndSave,
    ).not.toHaveBeenCalled();

    expect(result.summary).toMatchObject({
      receivedCandidates: 2,
      plannedAnalyses: 2,
      successfulAnalyses: 0,
      failedAnalyses: 0,
      totalTokens: 0,
    });
  });

  it("déduplique les offres et applique la limite avant les appels", async () => {
    const dependencies = createDependencies();

    const result =
      await executeAiAnalysisCandidates(
        {
          candidates: [
            createCandidate("offer-1"),
            createCandidate("offer-1"),
            createCandidate("offer-2"),
            createCandidate("offer-3"),
          ],
          maxAnalyses: 2,
          execute: true,
        },
        dependencies,
      );

    expect(
      dependencies.analyzeAndSave,
    ).toHaveBeenCalledTimes(2);

    expect(
      dependencies.analyzeAndSave,
    ).toHaveBeenNthCalledWith(
      1,
      "offer-1",
    );

    expect(
      dependencies.analyzeAndSave,
    ).toHaveBeenNthCalledWith(
      2,
      "offer-2",
    );

    expect(result.summary).toMatchObject({
      receivedCandidates: 4,
      plannedAnalyses: 2,
      skippedDuplicates: 1,
      skippedByLimit: 1,
      successfulAnalyses: 2,
      failedAnalyses: 0,
    });
  });

  it("continue après une erreur sur une offre", async () => {
    const dependencies = createDependencies();

    vi.mocked(
      dependencies.analyzeAndSave,
    )
      .mockRejectedValueOnce(
        new Error("OpenAI unavailable"),
      )
      .mockResolvedValueOnce({
        analysisMode: "OPENAI",
        modelName: "gpt-test",
        inputTokens: 200,
        outputTokens: 40,
        totalTokens: 240,
      });

    const result =
      await executeAiAnalysisCandidates(
        {
          candidates: [
            createCandidate("offer-error"),
            createCandidate("offer-success"),
          ],
          maxAnalyses: 2,
          execute: true,
        },
        dependencies,
      );

    expect(result.items[0]).toMatchObject({
      jobOfferId: "offer-error",
      status: "ERROR",
      errorMessage: "OpenAI unavailable",
    });

    expect(result.items[1]).toMatchObject({
      jobOfferId: "offer-success",
      status: "SUCCESS",
      totalTokens: 240,
    });

    expect(result.summary).toMatchObject({
      successfulAnalyses: 1,
      failedAnalyses: 1,
      inputTokens: 200,
      outputTokens: 40,
      totalTokens: 240,
    });
  });

  it("n’effectue aucun appel lorsque la limite vaut zéro", async () => {
    const dependencies = createDependencies();

    const result =
      await executeAiAnalysisCandidates(
        {
          candidates: [
            createCandidate("offer-1"),
          ],
          maxAnalyses: 0,
          execute: true,
        },
        dependencies,
      );

    expect(result.items).toEqual([]);

    expect(
      dependencies.analyzeAndSave,
    ).not.toHaveBeenCalled();

    expect(result.summary).toMatchObject({
      receivedCandidates: 1,
      plannedAnalyses: 0,
      skippedByLimit: 1,
      successfulAnalyses: 0,
      failedAnalyses: 0,
    });
  });

  it("refuse une limite invalide avant toute exécution", async () => {
    const dependencies = createDependencies();

    await expect(
      executeAiAnalysisCandidates(
        {
          candidates: [
            createCandidate("offer-1"),
          ],
          maxAnalyses: -1,
          execute: true,
        },
        dependencies,
      ),
    ).rejects.toThrow(
      "maxAnalyses must be a non-negative integer.",
    );

    expect(
      dependencies.analyzeAndSave,
    ).not.toHaveBeenCalled();
  });
});