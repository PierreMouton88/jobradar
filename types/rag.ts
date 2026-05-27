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
  jobOfferId: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  distance: number;
};

export type RagAnswerResult = {
  answer: string;
  sources: RagSearchResult[];
};

export type RagQuestionState = {
  answer: string | null;
  error: string | null;
  sources: RagSource[];
};