import type { JobOfferScore } from "@/lib/scoring/score-job-offer";
import type { PrioritizedOffer } from "@/lib/scoring/prioritize-job-offer";


export type ContractType =
  | "CDI"
  | "CDD"
  | "Stage"
  | "Alternance"
  | "Freelance"
  | "Inconnu";

export type JobOffer = {
  id: string;
  title: string;
  company: string;
  location: string;
  contractType: ContractType;
  remote: boolean;
  skills: string[];
  description: string;
  source: string;
  url: string;
  createdAt: string;
  analysis?: JobAnalysisView | null;
  score?: JobOfferScore;
  priority: PrioritizedOffer;
};

export type JobAnalysisView = {
  summary: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  experienceLevel: string;
  remotePolicy: string;
  salaryMentioned: boolean;
  redFlags: string[];
  positiveSignals: string[];
  analysisMode: string;
  modelName: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
};