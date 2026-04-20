import { describe, expect, it } from "vitest";

import { ChapterLinkService } from "../../src/modules/chapters/chapter-link.service";
import type {
  ChapterMilestoneSummary,
  ChapterRecord,
  ChapterRepository,
  ChapterSceneLinkDetail,
  ChapterSceneLinkRecord,
  ChapterSceneSummary,
  ChapterTransactionRepository
} from "../../src/modules/chapters/chapter.types";

const milestoneSummary: ChapterMilestoneSummary = {
  id: "milestone_123",
  title: "Conflict Escalation",
  volumeId: "volume_123",
  maxChaptersPerMilestone: 3
};

const chapterRecord: ChapterRecord = {
  id: "chapter_123",
  milestoneId: milestoneSummary.id,
  title: "Chapter Twelve: Ravine Ambush",
  body: "",
  wordCount: 0,
  savedVersion: 0,
  maxWordCount: 3000,
  createdAt: new Date("2026-04-17T00:00:00.000Z"),
  updatedAt: new Date("2026-04-17T00:00:00.000Z")
};

const sceneSummaries: ChapterSceneSummary[] = [
  {
    id: "scene_001",
    milestoneId: milestoneSummary.id,
    outline: "The ambush begins in the ravine.",
    explanation: "The first clash locks the convoy inside the ravine."
  },
  {
    id: "scene_002",
    milestoneId: milestoneSummary.id,
    outline: "The escort tries to break through.",
    explanation: "The escort shifts into a defensive escape attempt."
  }
];

const chapterSceneLinks: ChapterSceneLinkDetail[] = [
  {
    id: "link_001",
    chapterId: chapterRecord.id,
    sceneId: "scene_001",
    sortOrder: 1,
    sceneOutline: "The ambush begins in the ravine.",
    sceneExplanation: "The first clash locks the convoy inside the ravine."
  }
];

function createTransactionRepositoryDouble(
  overrides: Partial<ChapterTransactionRepository> = {}
): ChapterTransactionRepository {
  return {
    countChaptersByMilestoneId: async () => 0,
    createChapter: async () => chapterRecord,
    findChapterById: async () => chapterRecord,
    listScenesByMilestoneId: async () => sceneSummaries,
    findChapterSceneLink: async () => null,
    createChapterSceneLinks: async (chapterId: string, sceneIds: string[]) =>
      sceneIds.map((sceneId, index) => ({
        id: `link_${index + 1}`,
        chapterId,
        sceneId,
        sortOrder: index + 1,
        createdAt: new Date("2026-04-17T00:00:00.000Z"),
        updatedAt: new Date("2026-04-17T00:00:00.000Z")
      })),
    deleteChapterSceneLink: async () => undefined,
    normalizeChapterSceneLinkSortOrder: async () => undefined,
    updateChapterDraft: async () => chapterRecord,
    ...overrides
  };
}

function createRepositoryDouble(overrides: Partial<ChapterRepository> = {}): ChapterRepository {
  return {
    findMilestoneById: async () => milestoneSummary,
    listChaptersByMilestoneId: async () => [chapterRecord],
    listScenesByMilestoneId: async () => sceneSummaries,
    listChapterSceneLinksByMilestoneId: async () => chapterSceneLinks,
    countChaptersByMilestoneId: async () => 1,
    createChapter: async () => chapterRecord,
    findChapterById: async () => chapterRecord,
    findChapterSceneLink: async () => null,
    createChapterSceneLinks: async () => [],
    deleteChapterSceneLink: async () => undefined,
    normalizeChapterSceneLinkSortOrder: async () => undefined,
    updateChapterDraft: async () => chapterRecord,
    runInTransaction: async (handler) => handler(createTransactionRepositoryDouble()),
    ...overrides
  };
}

describe("ChapterLinkService", () => {
  it("links scenes to a chapter when they belong to the milestone", async () => {
    const service = new ChapterLinkService(createRepositoryDouble());

    const result = await service.linkScenesToChapter({
      chapterId: "chapter_123",
      sceneIds: ["scene_001", "scene_002"]
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.chapters).toHaveLength(1);
      expect(result.data.availableScenes).toHaveLength(2);
      expect(result.data.chapterSceneLinks).toHaveLength(1);
    }
  });

  it("returns a chapter not found error when the chapter is missing", async () => {
    const service = new ChapterLinkService(
      createRepositoryDouble({
        runInTransaction: async (handler) =>
          handler(
            createTransactionRepositoryDouble({
              findChapterById: async () => null
            })
          )
      })
    );

    const result = await service.linkScenesToChapter({
      chapterId: "missing_chapter",
      sceneIds: ["scene_001"]
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "CHAPTER_NOT_FOUND",
        message: "The chapter could not be found."
      }
    });
  });

  it("blocks duplicate scene links for the same chapter", async () => {
    const duplicateLink: ChapterSceneLinkRecord = {
      id: "link_001",
      chapterId: chapterRecord.id,
      sceneId: "scene_001",
      sortOrder: 1,
      createdAt: new Date("2026-04-17T00:00:00.000Z"),
      updatedAt: new Date("2026-04-17T00:00:00.000Z")
    };
    const service = new ChapterLinkService(
      createRepositoryDouble({
        runInTransaction: async (handler) =>
          handler(
            createTransactionRepositoryDouble({
              findChapterSceneLink: async () => duplicateLink
            })
          )
      })
    );

    const result = await service.linkScenesToChapter({
      chapterId: "chapter_123",
      sceneIds: ["scene_001"]
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "DUPLICATE_SCENE_LINK",
        message: "One or more selected scenes are already linked to this chapter."
      }
    });
  });
});
