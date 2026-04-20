import { describe, expect, it } from "vitest";

import { ChapterGuardrailsService } from "../../src/modules/chapters/chapter-guardrails.service";

describe("ChapterGuardrailsService", () => {
  it("evaluates a draft within the chapter word limit", () => {
    const service = new ChapterGuardrailsService();

    const result = service.evaluateDraft({
      body: "The convoy enters the ravine without suspecting the ambush.",
      maxWordCount: 20
    });

    expect(result).toEqual({
      wordCount: 9,
      maxWordCount: 20,
      remainingWords: 11,
      isAtLimit: false,
      isOverLimit: false,
      hardStopMessage: null
    });
  });

  it("marks a draft as over limit when the hard stop is exceeded", () => {
    const service = new ChapterGuardrailsService();

    const result = service.evaluateDraft({
      body: "One two three four five six",
      maxWordCount: 5
    });

    expect(result).toEqual({
      wordCount: 6,
      maxWordCount: 5,
      remainingWords: -1,
      isAtLimit: false,
      isOverLimit: true,
      hardStopMessage: "This chapter reached the hard limit of 5 words."
    });
  });
});
