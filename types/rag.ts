export type RagSearchResult = {
  jobOfferId: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  content: string;
  distance: number;
};

export type RagSource = {
  sourceType: string;
  sourceId: string;
  title: string;
  distance: number;
};

export type RagAnswerResult = {
  answer: string;
  sources: RagSearchResult[];
};

export type RagQuestionState = {
  error: string | null;
  answer: string | null;
  sources: RagSource[];
};