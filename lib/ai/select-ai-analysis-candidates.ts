import type { JobOfferScore, ScorableJobOffer } from "@/lib/scoring/score-job-offer";
import type {
  OfferPriorityLevel,
  PrioritizedOffer,
} from "@/lib/scoring/prioritize-job-offer";

export type AiAnalysisCandidateOffer = ScorableJobOffer & {
  id: string;
  title?: string;
  company?: string | null;
  url?: string;
};

export type AiAnalysisCandidate = {
  offer: AiAnalysisCandidateOffer;
  score: JobOfferScore;
  priority: PrioritizedOffer;
};

export type SelectAiAnalysisCandidatesInput = {
  candidates: AiAnalysisCandidate[];
  limit: number;
};

const PRIORITY_ORDER: Record<OfferPriorityLevel, number> = {
  needs_ai_analysis: 1,
  very_promising: 2,
  interesting: 3,
  watch: 4,
  low_priority: 5,
  probably_ignore: 6,
};

const ELIGIBLE_PRIORITIES: OfferPriorityLevel[] = [
  "needs_ai_analysis",
  "very_promising",
  "interesting",
];

export function selectAiAnalysisCandidates({
  candidates,
  limit,
}: SelectAiAnalysisCandidatesInput): AiAnalysisCandidate[] {
  if (limit <= 0) {
    return [];
  }

  return candidates
    .filter((candidate) => !candidate.offer.analysis)
    .filter((candidate) =>
      ELIGIBLE_PRIORITIES.includes(candidate.priority.priority),
    )
    .sort((a, b) => {
      const priorityDiff =
        PRIORITY_ORDER[a.priority.priority] -
        PRIORITY_ORDER[b.priority.priority];

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return b.score.percentage - a.score.percentage;
    })
    .slice(0, limit);
}