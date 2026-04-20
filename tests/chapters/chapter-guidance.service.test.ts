import { describe, expect, it } from "vitest";

import { ChapterGuidanceService } from "../../src/modules/chapters/chapter-guidance.service";
import type {
  ChapterMilestoneSummary,
  ChapterRecord,
  ChapterRepository,
  ChapterSceneLinkDetail,
  ChapterSceneLinkRecord,
  ChapterSceneSummary,
  ChapterTransactionRepository
} from "../../src/modules/chapters/chapter.types";
import { NextSceneService } from "../../src/modules/scenes/next-scene.service";
import type { SceneGraphEdgeRecord } from "../../src/modules/scenes/scene.types";

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
  body: "Initial draft",
  wordCount: 2,
  savedVersion: 1,
  maxWordCount: 3000,
  createdAt: new Date("2026-04-20T00:00:00.000Z"),
  updatedAt: new Date("2026-04-20T00:00:00.000Z")
};

function createChapterRepositoryDouble(options: {
  scenes?: ChapterSceneSummary[];
  milestoneLinks?: ChapterSceneLinkDetail[];
  throwOnFindChapter?: boolean;
} = {}): ChapterRepository {
  const scenes: ChapterSceneSummary[] =
    options.scenes ??
    [
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
      },
      {
        id: "scene_003",
        milestoneId: milestoneSummary.id,
        outline: "The reserve unit arrives.",
        explanation: "Reinforcements enter after the main clash has already turned."
      }
    ];

  const milestoneLinks: ChapterSceneLinkDetail[] =
    options.milestoneLinks ??
    [
      {
        id: "link_001",
        chapterId: chapterRecord.id,
        sceneId: "scene_001",
        sortOrder: 1,
        sceneOutline: scenes[0].outline,
        sceneExplanation: scenes[0].explanation
      }
    ];

  const transactionRepository: ChapterTransactionRepository = {
    countChaptersByMilestoneId: async () => 1,
    createChapter: async () => chapterRecord,
    findChapterById: async () => chapterRecord,
    listScenesByMilestoneId: async () => scenes,
    findChapterSceneLink: async (): Promise<ChapterSceneLinkRecord | null> => null,
    createChapterSceneLinks: async (): Promise<ChapterSceneLinkRecord[]> => [],
    deleteChapterSceneLink: async () => undefined,
    normalizeChapterSceneLinkSortOrder: async () => undefined,
    updateChapterDraft: async () => chapterRecord
  };

  return {
    findMilestoneById: async () => milestoneSummary,
    listChaptersByMilestoneId: async () => [chapterRecord],
    listScenesByMilestoneId: async () => scenes,
    listChapterSceneLinksByMilestoneId: async () => milestoneLinks,
    countChaptersByMilestoneId: async () => 1,
    createChapter: async () => chapterRecord,
    findChapterById: async () => {
      if (options.throwOnFindChapter) {
        throw new Error("DATABASE_DOWN");
      }

      return chapterRecord;
    },
    findChapterSceneLink: async (): Promise<ChapterSceneLinkRecord | null> => null,
    createChapterSceneLinks: async (): Promise<ChapterSceneLinkRecord[]> => [],
    deleteChapterSceneLink: async () => undefined,
    normalizeChapterSceneLinkSortOrder: async () => undefined,
    updateChapterDraft: async () => chapterRecord,
    runInTransaction: async (handler) => handler(transactionRepository)
  };
}

function createSceneGraphSourceDouble(graphEdges: SceneGraphEdgeRecord[] = []) {
  return {
    listGraphEdgesByMilestoneId: async () => graphEdges
  };
}

describe("ChapterGuidanceService", () => {
  it("assembles passive guidance, milestone progress, and a next-scene suggestion", async () => {
    const service = new ChapterGuidanceService(
      createChapterRepositoryDouble(),
      createSceneGraphSourceDouble([
        {
          id: "edge_001",
          milestoneId: milestoneSummary.id,
          fromSceneId: "scene_001",
          toSceneId: "scene_002",
          relationship: "ESCALATES_TO",
          createdAt: new Date("2026-04-20T00:00:00.000Z"),
          updatedAt: new Date("2026-04-20T00:00:00.000Z")
        }
      ]),
      new NextSceneService()
    );

    const result = await service.getChapterGuidance({
      chapterId: chapterRecord.id
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.indicators).toHaveLength(2);
      expect(result.data.indicators.map((indicator) => indicator.code)).toEqual([
        "MISSING_REFERENCES",
        "MILESTONE_INCOMPLETE"
      ]);
      expect(result.data.nextSceneSuggestion?.sceneId).toBe("scene_002");
      expect(result.data.progressSummary.remainingScenes).toBe(2);
      expect(result.data.progressSummary.summaryLabel).toBe("Milestone progress: 1/3 scenes linked across 1 chapters.");
    }
  });

  it("raises a missing-outline indicator when a milestone scene is blank", async () => {
    const service = new ChapterGuidanceService(
      createChapterRepositoryDouble({
        scenes: [
          {
            id: "scene_001",
            milestoneId: milestoneSummary.id,
            outline: "",
            explanation: "Outline is still missing for this scene."
          },
          {
            id: "scene_002",
            milestoneId: milestoneSummary.id,
            outline: "The escort tries to break through.",
            explanation: "The escorts attempt a desperate break toward the eastern ridge."
          }
        ]
      }),
      createSceneGraphSourceDouble(),
      new NextSceneService()
    );

    const result = await service.getChapterGuidance({
      chapterId: chapterRecord.id
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.indicators[0]).toEqual({
        code: "MISSING_OUTLINE",
        severity: "WARNING",
        title: "Scene outlines still need completion",
        description: "1 scene outlines are still blank inside this milestone.",
        count: 1
      });
    }
  });

  it("returns a safe fallback when guidance assembly fails", async () => {
    const service = new ChapterGuidanceService(
      createChapterRepositoryDouble({
        throwOnFindChapter: true
      }),
      createSceneGraphSourceDouble(),
      new NextSceneService()
    );

    const result = await service.getChapterGuidance({
      chapterId: chapterRecord.id
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "PERSISTENCE_ERROR",
        message: "Unable to load chapter guidance right now."
      }
    });
  });
});
