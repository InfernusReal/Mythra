import { describe, expect, it } from "vitest";

import { ChapterGuardrailsService } from "../../src/modules/chapters/chapter-guardrails.service";
import { ChapterSaveService } from "../../src/modules/chapters/chapter-save.service";
import type {
  ChapterMilestoneSummary,
  ChapterRecord,
  ChapterRepository,
  ChapterSceneLinkDetail,
  ChapterSceneLinkRecord,
  ChapterSceneSummary,
  ChapterTransactionRepository,
  CreateChapterInput
} from "../../src/modules/chapters/chapter.types";

const milestoneSummary: ChapterMilestoneSummary = {
  id: "milestone_123",
  title: "Conflict Escalation",
  volumeId: "volume_123",
  maxChaptersPerMilestone: 3
};

function createChapterRecord(overrides: Partial<ChapterRecord> = {}): ChapterRecord {
  return {
    id: "chapter_123",
    milestoneId: milestoneSummary.id,
    title: "Chapter Twelve: Ravine Ambush",
    body: "Initial draft",
    wordCount: 2,
    savedVersion: 2,
    maxWordCount: 50,
    createdAt: new Date("2026-04-20T00:00:00.000Z"),
    updatedAt: new Date("2026-04-20T00:00:00.000Z"),
    ...overrides
  };
}

function createTransactionRepositoryDouble(
  chapterRecord: ChapterRecord,
  overrides: Partial<ChapterTransactionRepository> = {}
): ChapterTransactionRepository {
  return {
    countChaptersByMilestoneId: async () => 0,
    createChapter: async (input: CreateChapterInput) =>
      createChapterRecord({
        milestoneId: input.milestoneId,
        title: input.title
      }),
    findChapterById: async () => chapterRecord,
    listScenesByMilestoneId: async (): Promise<ChapterSceneSummary[]> => [],
    findChapterSceneLink: async (): Promise<ChapterSceneLinkRecord | null> => null,
    createChapterSceneLinks: async (): Promise<ChapterSceneLinkRecord[]> => [],
    deleteChapterSceneLink: async () => undefined,
    normalizeChapterSceneLinkSortOrder: async () => undefined,
    updateChapterDraft: async (input) =>
      createChapterRecord({
        ...chapterRecord,
        body: input.body,
        wordCount: input.wordCount,
        savedVersion: input.savedVersion,
        updatedAt: new Date("2026-04-20T00:05:00.000Z")
      }),
    ...overrides
  };
}

function createRepositoryDouble(
  chapterRecord: ChapterRecord,
  overrides: Partial<ChapterRepository> = {}
): ChapterRepository {
  return {
    findMilestoneById: async () => milestoneSummary,
    listChaptersByMilestoneId: async (): Promise<ChapterRecord[]> => [chapterRecord],
    listScenesByMilestoneId: async (): Promise<ChapterSceneSummary[]> => [],
    listChapterSceneLinksByMilestoneId: async (): Promise<ChapterSceneLinkDetail[]> => [],
    countChaptersByMilestoneId: async () => 0,
    createChapter: async () => chapterRecord,
    findChapterById: async () => chapterRecord,
    findChapterSceneLink: async (): Promise<ChapterSceneLinkRecord | null> => null,
    createChapterSceneLinks: async (): Promise<ChapterSceneLinkRecord[]> => [],
    deleteChapterSceneLink: async () => undefined,
    normalizeChapterSceneLinkSortOrder: async () => undefined,
    updateChapterDraft: async () => chapterRecord,
    runInTransaction: async (handler) => handler(createTransactionRepositoryDouble(chapterRecord)),
    ...overrides
  };
}

describe("ChapterSaveService", () => {
  it("saves a valid chapter draft and increments the saved version", async () => {
    const chapterRecord = createChapterRecord();
    const service = new ChapterSaveService(createRepositoryDouble(chapterRecord), new ChapterGuardrailsService());

    const result = await service.saveChapterDraft({
      chapterId: chapterRecord.id,
      body: "The convoy enters the ravine and the ambush begins immediately.",
      expectedSavedVersion: 2,
      saveMode: "MANUAL"
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.chapter.savedVersion).toBe(3);
      expect(result.data.wordCount).toBe(10);
      expect(result.data.saveMode).toBe("MANUAL");
    }
  });

  it("blocks a stale write when a newer server version exists", async () => {
    const chapterRecord = createChapterRecord({
      savedVersion: 4,
      body: "A newer server draft."
    });
    const service = new ChapterSaveService(createRepositoryDouble(chapterRecord), new ChapterGuardrailsService());

    const result = await service.saveChapterDraft({
      chapterId: chapterRecord.id,
      body: "Older local draft.",
      expectedSavedVersion: 2,
      saveMode: "AUTO"
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "SAVE_CONFLICT",
        message: "A newer server draft exists. Local draft was preserved for recovery.",
        details: {
          currentSavedVersion: 4,
          serverBody: "A newer server draft.",
          updatedAt: "2026-04-20T00:00:00.000Z"
        }
      }
    });
  });

  it("blocks a save when the hard chapter word limit is exceeded", async () => {
    const chapterRecord = createChapterRecord({
      maxWordCount: 5
    });
    const service = new ChapterSaveService(createRepositoryDouble(chapterRecord), new ChapterGuardrailsService());

    const result = await service.saveChapterDraft({
      chapterId: chapterRecord.id,
      body: "One two three four five six",
      expectedSavedVersion: 2,
      saveMode: "AUTO"
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "WORD_LIMIT_REACHED",
        message: "This chapter reached the hard limit of 5 words.",
        details: {
          wordCount: 6,
          maxWordCount: 5,
          remainingWords: -1
        }
      }
    });
  });

  it("returns a safe persistence fallback when save reconciliation fails", async () => {
    const chapterRecord = createChapterRecord();
    const service = new ChapterSaveService(
      createRepositoryDouble(chapterRecord, {
        runInTransaction: async () => {
          throw new Error("DATABASE_DOWN");
        }
      }),
      new ChapterGuardrailsService()
    );

    const result = await service.saveChapterDraft({
      chapterId: chapterRecord.id,
      body: "The convoy enters the ravine.",
      expectedSavedVersion: 2,
      saveMode: "AUTO"
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "PERSISTENCE_ERROR",
        message: "Unable to save the chapter right now. The local draft should be preserved."
      }
    });
  });
});
