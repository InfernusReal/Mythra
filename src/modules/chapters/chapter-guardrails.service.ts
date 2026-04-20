import { evaluateWordLimit } from "../../lib/guards/word-limit";

export type ChapterGuardrailRecord = {
  wordCount: number;
  maxWordCount: number;
  remainingWords: number;
  isAtLimit: boolean;
  isOverLimit: boolean;
  hardStopMessage: string | null;
};

export class ChapterGuardrailsService {
  evaluateDraft(input: { body: string; maxWordCount: number | null | undefined }): ChapterGuardrailRecord {
    const evaluation = evaluateWordLimit(input.body, input.maxWordCount);

    return {
      ...evaluation,
      hardStopMessage: evaluation.isOverLimit
        ? `This chapter reached the hard limit of ${evaluation.maxWordCount} words.`
        : null
    };
  }
}
