export type ReadCliQuestionOptions = {
  argv?: string[];
  fallbackQuestion?: string;
};

export function readCliQuestion(options: ReadCliQuestionOptions = {}): string {
  const argv = options.argv ?? process.argv.slice(2);

  const question = argv.join(" ").trim();

  if (question) {
    return question;
  }

  if (options.fallbackQuestion) {
    return options.fallbackQuestion;
  }

  throw new Error(
    'Aucune question fournie. Exemple : npm run rag:search-documents -- "Ma question"',
  );
}