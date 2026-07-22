import { analyzeAndSaveJobOffer } from "@/lib/ai/analyze-and-save-job-offer";

export type AiAnalysisExecutionCandidate = {
  offer: {
    id: string;
    title?: string | null;
  };
};

export type ExecuteAiAnalysisCandidatesOptions = {
  candidates: readonly AiAnalysisExecutionCandidate[];
  maxAnalyses: number;
  execute?: boolean;
};

export type AiAnalysisExecutionStatus =
  | "PLANNED"
  | "SUCCESS"
  | "ERROR";

export type AiAnalysisExecutionItem = {
  jobOfferId: string;
  title: string;
  status: AiAnalysisExecutionStatus;

  analysisMode?: string;
  modelName?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;

  errorMessage?: string;
};

export type ExecuteAiAnalysisCandidatesResult = {
  mode: "DRY_RUN" | "EXECUTE";
  items: AiAnalysisExecutionItem[];

  summary: {
    receivedCandidates: number;
    plannedAnalyses: number;
    skippedDuplicates: number;
    skippedByLimit: number;
    successfulAnalyses: number;
    failedAnalyses: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
};

export type SavedAiAnalysisMetadata = {
  analysisMode: string;
  modelName: string | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type ExecuteAiAnalysisCandidatesDependencies = {
  analyzeAndSave: (
    jobOfferId: string,
  ) => Promise<SavedAiAnalysisMetadata>;
};

const DEFAULT_DEPENDENCIES: ExecuteAiAnalysisCandidatesDependencies = {
  analyzeAndSave: async (jobOfferId) => {
    const analysis =
      await analyzeAndSaveJobOffer(jobOfferId);

    return {
      analysisMode: String(analysis.analysisMode),
      modelName: analysis.modelName,
      inputTokens: analysis.inputTokens ?? 0,
      outputTokens: analysis.outputTokens ?? 0,
      totalTokens: analysis.totalTokens ?? 0,
    };
  },
};

function validateMaxAnalyses(maxAnalyses: number): void {
  if (
    !Number.isInteger(maxAnalyses) ||
    maxAnalyses < 0
  ) {
    throw new Error(
      "maxAnalyses must be a non-negative integer.",
    );
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unknown AI analysis error.";
}

function selectCandidates(input: {
  candidates: readonly AiAnalysisExecutionCandidate[];
  maxAnalyses: number;
}) {
  const uniqueCandidates: AiAnalysisExecutionCandidate[] = [];
  const seenJobOfferIds = new Set<string>();

  for (const candidate of input.candidates) {
    if (seenJobOfferIds.has(candidate.offer.id)) {
      continue;
    }

    seenJobOfferIds.add(candidate.offer.id);
    uniqueCandidates.push(candidate);
  }

  const selectedCandidates = uniqueCandidates.slice(
    0,
    input.maxAnalyses,
  );

  return {
    selectedCandidates,
    skippedDuplicates:
      input.candidates.length - uniqueCandidates.length,
    skippedByLimit:
      uniqueCandidates.length - selectedCandidates.length,
  };
}

export async function executeAiAnalysisCandidates(
  options: ExecuteAiAnalysisCandidatesOptions,
  dependencies: ExecuteAiAnalysisCandidatesDependencies =
    DEFAULT_DEPENDENCIES,
): Promise<ExecuteAiAnalysisCandidatesResult> {
  validateMaxAnalyses(options.maxAnalyses);

  const execute = options.execute ?? false;

  const selection = selectCandidates({
    candidates: options.candidates,
    maxAnalyses: options.maxAnalyses,
  });

  if (!execute) {
    return {
      mode: "DRY_RUN",

      items: selection.selectedCandidates.map(
        (candidate) => ({
          jobOfferId: candidate.offer.id,
          title:
            candidate.offer.title ??
            candidate.offer.id,
          status: "PLANNED",
        }),
      ),

      summary: {
        receivedCandidates:
          options.candidates.length,
        plannedAnalyses:
          selection.selectedCandidates.length,
        skippedDuplicates:
          selection.skippedDuplicates,
        skippedByLimit:
          selection.skippedByLimit,
        successfulAnalyses: 0,
        failedAnalyses: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
    };
  }

  const items: AiAnalysisExecutionItem[] = [];

  for (const candidate of selection.selectedCandidates) {
    try {
      const analysis =
        await dependencies.analyzeAndSave(
          candidate.offer.id,
        );

      items.push({
        jobOfferId: candidate.offer.id,
        title:
          candidate.offer.title ??
          candidate.offer.id,
        status: "SUCCESS",

        analysisMode: analysis.analysisMode,
        modelName: analysis.modelName,
        inputTokens: analysis.inputTokens,
        outputTokens: analysis.outputTokens,
        totalTokens: analysis.totalTokens,
      });
    } catch (error) {
      items.push({
        jobOfferId: candidate.offer.id,
        title:
          candidate.offer.title ??
          candidate.offer.id,
        status: "ERROR",
        errorMessage: getErrorMessage(error),
      });
    }
  }

  const successfulItems = items.filter(
    (item) => item.status === "SUCCESS",
  );

  return {
    mode: "EXECUTE",
    items,

    summary: {
      receivedCandidates:
        options.candidates.length,
      plannedAnalyses:
        selection.selectedCandidates.length,
      skippedDuplicates:
        selection.skippedDuplicates,
      skippedByLimit:
        selection.skippedByLimit,

      successfulAnalyses:
        successfulItems.length,

      failedAnalyses: items.filter(
        (item) => item.status === "ERROR",
      ).length,

      inputTokens: successfulItems.reduce(
        (total, item) =>
          total + (item.inputTokens ?? 0),
        0,
      ),

      outputTokens: successfulItems.reduce(
        (total, item) =>
          total + (item.outputTokens ?? 0),
        0,
      ),

      totalTokens: successfulItems.reduce(
        (total, item) =>
          total + (item.totalTokens ?? 0),
        0,
      ),
    },
  };
}