import { describe, expect, it } from "vitest";

import { ChapterEditorService } from "../../src/modules/chapters/chapter-editor.service";
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
  createdAt: new Date("2026-04-20T00:00:00.000Z"),
  updatedAt: new Date("2026-04-20T00:00:00.000Z")
};

const scenes: ChapterSceneSummary[] = [
  {
    id: "scene_001",
    milestoneId: milestoneSummary.id,
    outline: "The ambush begins in the ravine.",
    explanation: "The first clash traps the convoy in a narrow kill zone."
  },
  {
    id: "scene_002",
    milestoneId: milestoneSummary.id,
    outline: "The escort tries to break through.",
    explanation: "The escorts attempt a desperate break toward the eastern ridge."
  }
];

function createRepositoryDouble(options: {
  initialLinks?: ChapterSceneLinkDetail[];
  throwOnFindChapter?: boolean;
} = {}): ChapterRepository {
  const linkState = [...(options.initialLinks ?? [])];

  function buildTransactionRepository(): ChapterTransactionRepository {
    return {
      countChaptersByMilestoneId: async () => 1,
      createChapter: async () => chapterRecord,
      findChapterById: async () => {
        if (options.throwOnFindChapter) {
          throw new Error("DATABASE_DOWN");
        }

        return chapterRecord;
      },
      listScenesByMilestoneId: async () => scenes,
      findChapterSceneLink: async (chapterId, sceneId) => {
        const matchingLink = linkState.find((link) => link.chapterId === chapterId && link.sceneId === sceneId);

        return matchingLink
          ? {
              id: matchingLink.id,
              chapterId: matchingLink.chapterId,
              sceneId: matchingLink.sceneId,
              sortOrder: matchingLink.sortOrder,
              createdAt: new Date("2026-04-20T00:00:00.000Z"),
              updatedAt: new Date("2026-04-20T00:00:00.000Z")
            }
          : null;
      },
      createChapterSceneLinks: async (chapterId, sceneIds) => {
        const startingOrder = linkState.length === 0 ? 1 : Math.max(...linkState.map((link) => link.sortOrder)) + 1;

        const createdLinks: ChapterSceneLinkRecord[] = sceneIds.map((sceneId, index) => {
          const scene = scenes.find((candidate) => candidate.id === sceneId)!;
          const nextRecord: ChapterSceneLinkDetail = {
            id: `link_${linkState.length + index + 1}`,
            chapterId,
            sceneId,
            sortOrder: startingOrder + index,
            sceneOutline: scene.outline,
            sceneExplanation: scene.explanation
          };

          linkState.push(nextRecord);

          return {
            id: nextRecord.id,
            chapterId,
            sceneId,
            sortOrder: nextRecord.sortOrder,
            createdAt: new Date("2026-04-20T00:00:00.000Z"),
            updatedAt: new Date("2026-04-20T00:00:00.000Z")
          };
        });

        return createdLinks;
      },
      deleteChapterSceneLink: async (chapterId, sceneId) => {
        const linkIndex = linkState.findIndex((link) => link.chapterId === chapterId && link.sceneId === sceneId);

        if (linkIndex >= 0) {
          linkState.splice(linkIndex, 1);
        }
      },
      normalizeChapterSceneLinkSortOrder: async (chapterId) => {
        const chapterLinks = linkState
          .filter((link) => link.chapterId === chapterId)
          .sort((leftLink, rightLink) => leftLink.sortOrder - rightLink.sortOrder);

        chapterLinks.forEach((link, index) => {
          const targetLink = linkState.find((candidate) => candidate.id === link.id);

          if (targetLink) {
            targetLink.sortOrder = index + 1;
          }
        });
      },
      updateChapterDraft: async (input) => {
        chapterRecord.body = input.body;
        chapterRecord.wordCount = input.wordCount;
        chapterRecord.savedVersion = input.savedVersion;
        chapterRecord.updatedAt = new Date("2026-04-20T00:00:00.000Z");
        return chapterRecord;
      }
    };
  }

  return {
    findMilestoneById: async () => milestoneSummary,
    listChaptersByMilestoneId: async () => [chapterRecord],
    listScenesByMilestoneId: async () => scenes,
    listChapterSceneLinksByMilestoneId: async () =>
      [...linkState].sort((leftLink, rightLink) => leftLink.sortOrder - rightLink.sortOrder),
    countChaptersByMilestoneId: async () => 1,
    createChapter: async () => chapterRecord,
    findChapterById: async () => {
      if (options.throwOnFindChapter) {
        throw new Error("DATABASE_DOWN");
      }

      return chapterRecord;
    },
    findChapterSceneLink: async (chapterId, sceneId) => {
      const matchingLink = linkState.find((link) => link.chapterId === chapterId && link.sceneId === sceneId);

      return matchingLink
        ? {
            id: matchingLink.id,
            chapterId: matchingLink.chapterId,
            sceneId: matchingLink.sceneId,
            sortOrder: matchingLink.sortOrder,
            createdAt: new Date("2026-04-20T00:00:00.000Z"),
            updatedAt: new Date("2026-04-20T00:00:00.000Z")
          }
        : null;
    },
    createChapterSceneLinks: async () => [],
    deleteChapterSceneLink: async () => undefined,
    normalizeChapterSceneLinkSortOrder: async () => undefined,
    updateChapterDraft: async () => chapterRecord,
    runInTransaction: async (handler) => handler(buildTransactionRepository())
  };
}

describe("ChapterEditorService", () => {
  it("hydrates the guided editor workspace for a valid chapter", async () => {
    const service = new ChapterEditorService(
      createRepositoryDouble({
        initialLinks: [
          {
            id: "link_001",
            chapterId: chapterRecord.id,
            sceneId: "scene_001",
            sortOrder: 1,
            sceneOutline: scenes[0].outline,
            sceneExplanation: scenes[0].explanation
          }
        ]
      })
    );

    const result = await service.getChapterEditorWorkspace({
      chapterId: chapterRecord.id
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.chapter?.id).toBe(chapterRecord.id);
      expect(result.data.sceneStack).toHaveLength(1);
      expect(result.data.quickReferences).toHaveLength(1);
      expect(result.data.draftTemplate).toContain("[[SCENE_START:01 The ambush begins in the ravine.]]");
      expect(result.data.availableScenes).toHaveLength(1);
    }
  });

  it("adds an available scene to the chapter structure through the service layer", async () => {
    const service = new ChapterEditorService(createRepositoryDouble());

    const result = await service.addSceneToChapter({
      chapterId: chapterRecord.id,
      sceneId: "scene_002"
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.sceneStack).toHaveLength(1);
      expect(result.data.sceneStack[0].sceneId).toBe("scene_002");
      expect(result.data.availableScenes).toHaveLength(1);
    }
  });

  it("removes a linked scene and normalizes the remaining scene order", async () => {
    const service = new ChapterEditorService(
      createRepositoryDouble({
        initialLinks: [
          {
            id: "link_001",
            chapterId: chapterRecord.id,
            sceneId: "scene_001",
            sortOrder: 1,
            sceneOutline: scenes[0].outline,
            sceneExplanation: scenes[0].explanation
          },
          {
            id: "link_002",
            chapterId: chapterRecord.id,
            sceneId: "scene_002",
            sortOrder: 2,
            sceneOutline: scenes[1].outline,
            sceneExplanation: scenes[1].explanation
          }
        ]
      })
    );

    const result = await service.removeSceneFromChapter({
      chapterId: chapterRecord.id,
      sceneId: "scene_001"
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.sceneStack).toHaveLength(1);
      expect(result.data.sceneStack[0].sceneId).toBe("scene_002");
      expect(result.data.sceneStack[0].sortOrder).toBe(1);
    }
  });

  it("returns a safe persistence fallback when the editor load fails", async () => {
    const service = new ChapterEditorService(
      createRepositoryDouble({
        throwOnFindChapter: true
      })
    );

    const result = await service.getChapterEditorWorkspace({
      chapterId: chapterRecord.id
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "PERSISTENCE_ERROR",
        message: "The chapter editor is temporarily unavailable. A safe read-only fallback was used."
      }
    });
  });
});
