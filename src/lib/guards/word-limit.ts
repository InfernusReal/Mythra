export const DEFAULT_CHAPTER_WORD_LIMIT = 3000;

export type WordLimitEvaluation = {
  wordCount: number;
  maxWordCount: number;
  remainingWords: number;
  isAtLimit: boolean;
  isOverLimit: boolean;
};

export function countWords(content: string): number {
  const trimmedContent = content.trim();

  if (trimmedContent.length === 0) {
    return 0;
  }

  return trimmedContent.split(/\s+/).length;
}

export function resolveChapterWordLimit(maxWordCount: number | null | undefined): number {
  return typeof maxWordCount === "number" && maxWordCount > 0 ? maxWordCount : DEFAULT_CHAPTER_WORD_LIMIT;
}

export function evaluateWordLimit(content: string, maxWordCount: number | null | undefined): WordLimitEvaluation {
  const wordCount = countWords(content);
  const resolvedLimit = resolveChapterWordLimit(maxWordCount);
  const remainingWords = resolvedLimit - wordCount;

  return {
    wordCount,
    maxWordCount: resolvedLimit,
    remainingWords,
    isAtLimit: remainingWords === 0,
    isOverLimit: remainingWords < 0
  };
}
