import { describe, expect, it, vi } from "vitest";

import { ChapterService } from "../../src/modules/chapters/chapter.service";
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
  maxChaptersPerMilestone: 2
};

function buildChapterRecord(input: CreateChapterInput): ChapterRecord {
  return {
    id: "chapter_123",
    milestoneId: input.milestoneId,
    title: input.title,
    wordCount: 0,
    createdAt: new Date("2026-04-17T00:00:00.000Z"),
    updatedAt: new Date("2026-04-17T00:00:00.000Z")
  };
}

function createTransactionRepositoryDouble(
  overrides: Partial<ChapterTransactionRepository> = {}
): ChapterTransactionRepository {
  return {
    countChaptersByMilestoneId: async () => 0,
    createChapter: async (input: CreateChapterInput) => buildChapterRecord(input),
    findChapterById: async () => null,
    listScenesByMilestoneId: async () => [],
    findChapterSceneLink: async () => null,
    createChapterSceneLinks: async () => [],
    ...overrides
  };
}

function createRepositoryDouble(overrides: Partial<ChapterRepository> = {}): ChapterRepository {
  return {
    findMilestoneById: async () => milestoneSummary,
    listChaptersByMilestoneId: async () => [],
    listScenesByMilestoneId: async () => [],
    listChapterSceneLinksByMilestoneId: async () => [],
    countChaptersByMilestoneId: async () => 0,
    createChapter: async (input: CreateChapterInput) => buildChapterRecord(input),
    findChapterById: async () => null,
    findChapterSceneLink: async () => null,
    createChapterSceneLinks: async () => [],
    runInTransaction: async (handler) => handler(createTransactionRepositoryDouble()),
    ...overrides
  };
}

describe("ChapterService", () => {
  it("creates a chapter when the milestone exists and the chapter cap is not reached", async () => {
    const repository = createRepositoryDouble({
      runInTransaction: vi.fn(async (handler) =>
        handler(
          createTransactionRepositoryDouble({
            countChaptersByMilestoneId: async () => 1,
            createChapter: async (input: CreateChapterInput) => buildChapterRecord(input)
          })
        )
      )
    });
    const service = new ChapterService(repository);

    const result = await service.createChapter({
      milestoneId: "milestone_123",
      title: "  Chapter Twelve: Ravine Ambush  "
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.chapter.title).toBe("Chapter Twelve: Ravine Ambush");
      expect(result.data.milestone.id).toBe("milestone_123");
    }
  });

  it("returns a milestone not found error when the parent milestone is missing", async () => {
    const service = new ChapterService(
      createRepositoryDouble({
        findMilestoneById: async () => null
      })
    );

    const result = await service.createChapter({
      milestoneId: "missing_milestone",
      title: "Chapter Zero"
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "MILESTONE_NOT_FOUND",
        message: "The parent milestone could not be found."
      }
    });
  });

  it("blocks chapter creation when the milestone chapter cap is already reached", async () => {
    const service = new ChapterService(
      createRepositoryDouble({
        runInTransaction: async (handler) =>
          handler(
            createTransactionRepositoryDouble({
              countChaptersByMilestoneId: async () => 2
            })
          )
      })
    );

    const result = await service.createChapter({
      milestoneId: "milestone_123",
      title: "Chapter Thirteen"
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "CHAPTER_LIMIT_REACHED",
        message: "The milestone chapter cap has already been reached."
      }
    });
  });
});
