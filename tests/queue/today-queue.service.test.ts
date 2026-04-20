import { describe, expect, it } from "vitest";

import { TodayQueueService } from "../../src/modules/queue/today-queue.service";
import type {
  TodayQueueDataSource,
  TodayQueueRawChapter,
  TodayQueueRawProgress
} from "../../src/modules/queue/today-queue.types";

const activeChapter: TodayQueueRawChapter = {
  id: "chapter_123",
  title: "Chapter Twelve: Ravine Ambush",
  updatedAt: new Date("2026-04-18T00:00:00.000Z"),
  milestone: {
    id: "milestone_123",
    title: "Conflict Escalation",
    volume: {
      id: "volume_123",
      title: "Volume One"
    }
  },
  sceneLinks: [
    {
      sortOrder: 1,
      scene: {
        id: "scene_001",
        outline: "The ambush begins in the ravine."
      }
    },
    {
      sortOrder: 2,
      scene: {
        id: "scene_002",
        outline: "The escort tries to break through."
      }
    }
  ]
};

const milestoneProgress: TodayQueueRawProgress = {
  milestoneId: "milestone_123",
  milestoneTitle: "Conflict Escalation",
  totalScenes: 5,
  linkedScenes: 2,
  chapterCount: 1
};

function createDataSourceDouble(overrides: Partial<TodayQueueDataSource> = {}): TodayQueueDataSource {
  return {
    findActiveChapter: async () => activeChapter,
    findMilestoneProgress: async () => milestoneProgress,
    ...overrides
  };
}

describe("TodayQueueService", () => {
  it("returns the daily writing queue when an active chapter exists", async () => {
    const service = new TodayQueueService(createDataSourceDouble());

    const result = await service.getTodayQueue();

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.continueTarget).toEqual({
        chapterId: "chapter_123",
        chapterTitle: "Chapter Twelve: Ravine Ambush",
        milestoneId: "milestone_123",
        milestoneTitle: "Conflict Escalation",
        volumeId: "volume_123",
        volumeTitle: "Volume One",
        href: "/chapters/chapter_123"
      });
      expect(result.data.nextScenes).toEqual([
        {
          sceneId: "scene_001",
          outline: "The ambush begins in the ravine.",
          sortOrder: 1
        },
        {
          sceneId: "scene_002",
          outline: "The escort tries to break through.",
          sortOrder: 2
        }
      ]);
      expect(result.data.milestoneProgress).toEqual({
        milestoneId: "milestone_123",
        milestoneTitle: "Conflict Escalation",
        totalScenes: 5,
        linkedScenes: 2,
        remainingScenes: 3,
        chapterCount: 1,
        progressLabel: "2/5 scenes linked into chapters"
      });
      expect(result.data.emptyStateMessage).toBeNull();
    }
  });

  it("returns a safe empty queue when no active chapter exists", async () => {
    const service = new TodayQueueService(
      createDataSourceDouble({
        findActiveChapter: async () => null
      })
    );

    const result = await service.getTodayQueue();

    expect(result).toEqual({
      ok: true,
      data: {
        continueTarget: null,
        nextScenes: [],
        milestoneProgress: null,
        queueLabel: "Today's Writing Queue",
        emptyStateMessage: "No active chapter exists yet. Create and link a chapter to start the writing queue."
      }
    });
  });

  it("returns a safe persistence error when queue assembly fails", async () => {
    const service = new TodayQueueService(
      createDataSourceDouble({
        findActiveChapter: async () => {
          throw new Error("database offline");
        }
      })
    );

    const result = await service.getTodayQueue();

    expect(result).toEqual({
      ok: false,
      error: {
        code: "PERSISTENCE_ERROR",
        message: "Unable to load today's writing queue right now."
      }
    });
  });
});
