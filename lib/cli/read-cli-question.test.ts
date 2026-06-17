import { describe, expect, it } from "vitest";

import { readCliQuestion } from "./read-cli-question";

describe("readCliQuestion", () => {
  it("reads a question from CLI arguments", () => {
    const question = readCliQuestion({
      argv: ["Quel", "type", "de", "poste", "?"],
    });

    expect(question).toBe("Quel type de poste ?");
  });

  it("uses the fallback question when no CLI argument is provided", () => {
    const question = readCliQuestion({
      argv: [],
      fallbackQuestion: "Question par défaut",
    });

    expect(question).toBe("Question par défaut");
  });

  it("throws when no CLI argument and no fallback question are provided", () => {
    expect(() => readCliQuestion({ argv: [] })).toThrow(
      "Aucune question fournie",
    );
  });
});