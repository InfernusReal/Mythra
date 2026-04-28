import { describe, expect, it } from "vitest";

import { WorldReferenceService } from "../../src/modules/world-building/world-reference.service";
import type {
  ChapterMilestoneSummary,
  ChapterRecord,
  ChapterRepository,
  ChapterSceneLinkDetail,
  ChapterSceneLinkRecord,
  ChapterSceneSummary,
  ChapterTransactionRepository
} from "../../src/modules/chapters/chapter.types";
import type { WorldRepository, WorldVolumeSummary } from "../../src/modules/world-building/world-layer.types";
import type { PersistedWorldLayerRecord } from "../../src/modules/world-building/world-layer.types";
import type { PersistedWorldNodeRecord, WorldLayerSummary } from "../../src/modules/world-building/world-node.types";
import type { LinkWorldNodeToSceneInput, SceneWorldLinkRecord, WorldReferenceNodeRecord } from "../../src/modules/world-building/world-reference.types";

const milestoneSummary: ChapterMilestoneSummary = {
  id: "milestone_123",
  title: "Conflict Escalation",
  volumeId: "volume_123",
  maxChaptersPerMilestone: 3
};

const chapterRecord: ChapterRecord = {
  id: "chapter_123",
  milestoneId: milestoneSummary.id,
  title: "Chapter Twelve",
  body: "",
  wordCount: 0,
  savedVersion: 0,
  maxWordCount: 3000,
  createdAt: new Date("2026-04-25T00:00:00.000Z"),
  updatedAt: new Date("2026-04-25T00:00:00.000Z")
};

const chapterLinks: ChapterSceneLinkDetail[] = [
  {
    id: "chapter_scene_link_001",
    chapterId: chapterRecord.id,
    sceneId: "scene_001",
    sortOrder: 1,
    sceneOutline: "The ravine ambush begins.",
    sceneExplanation: "The convoy is trapped."
  }
];

const volumeSummary: WorldVolumeSummary = {
  id: "volume_123",
  title: "Volume One",
  novelId: "novel_123",
  novelTitle: "Mythra"
};

const layerSummary: WorldLayerSummary = {
  id: "layer_001",
  volumeId: volumeSummary.id,
  layerKey: "KINGDOMS",
  displayName: "Kingdoms",
  position: 3
};

const reference: WorldReferenceNodeRecord = {
  sceneId: "scene_001",
  worldNodeId: "node_001",
  nodeName: "Aurelian Kingdom",
  layerKey: "KINGDOMS",
  layerName: "Kingdoms",
  positionJustification: "It controls the ravine route.",
  advantages: "Disciplined border army",
  disadvantages: "Slow council politics",
  relationships: "Treaty pressure from the eastern crown",
  geographicalLocation: "Northern continent",
  traditions: "Winter oath ceremonies",
  specialTraits: "Hidden citadel network",
  missingRequiredFields: [],
  isComplete: true
};

function createChapterRepositoryDouble(options: {
  chapter?: ChapterRecord | null;
  throwOnLinks?: boolean;
} = {}): ChapterRepository {
  const chapter = options.chapter === undefined ? chapterRecord : options.chapter;

  function createTransactionRepository(): ChapterTransactionRepository {
    return {
      countChaptersByMilestoneId: async () => 1,
      createChapter: async () => chapterRecord,
      findChapterById: async () => chapter,
      listScenesByMilestoneId: async (): Promise<ChapterSceneSummary[]> => [],
      findChapterSceneLink: async (): Promise<ChapterSceneLinkRecord | null> => null,
      createChapterSceneLinks: async () => [],
      deleteChapterSceneLink: async () => undefined,
      normalizeChapterSceneLinkSortOrder: async () => undefined,
      updateChapterDraft: async () => chapterRecord
    };
  }

  return {
    findMilestoneById: async () => milestoneSummary,
    listChaptersByMilestoneId: async () => (chapter ? [chapter] : []),
    listScenesByMilestoneId: async () => [],
    listChapterSceneLinksByMilestoneId: async () => {
      if (options.throwOnLinks) {
        throw new Error("DATABASE_DOWN");
      }

      return chapterLinks;
    },
    countChaptersByMilestoneId: async () => 1,
    createChapter: async () => chapterRecord,
    findChapterById: async () => chapter,
    findChapterSceneLink: async () => null,
    createChapterSceneLinks: async () => [],
    deleteChapterSceneLink: async () => undefined,
    normalizeChapterSceneLinkSortOrder: async () => undefined,
    updateChapterDraft: async () => chapterRecord,
    runInTransaction: async (handler) => handler(createTransactionRepository())
  };
}

function createWorldRepositoryDouble(options: {
  references?: WorldReferenceNodeRecord[];
} = {}): WorldRepository {
  return {
    findVolumeSummaryById: async () => volumeSummary,
    listLayersByVolumeId: async (): Promise<PersistedWorldLayerRecord[]> => [],
    createLayers: async () => [],
    updateLayer: async () => {
      throw new Error("NOT_IMPLEMENTED");
    },
    findLayerByKey: async () => layerSummary,
    listNodesByLayerId: async (): Promise<PersistedWorldNodeRecord[]> => [],
    listNodesByVolumeId: async () => [],
    findNodeById: async () => null,
    createNode: async () => {
      throw new Error("NOT_IMPLEMENTED");
    },
    updateNode: async () => {
      throw new Error("NOT_IMPLEMENTED");
    },
    updateNodeReminderSchedule: async () => {
      throw new Error("NOT_IMPLEMENTED");
    },
    findSceneWorldLink: async () => null,
    createSceneWorldLink: async (input: LinkWorldNodeToSceneInput): Promise<SceneWorldLinkRecord> => ({
      id: "scene_world_link_123",
      ...input,
      createdAt: new Date("2026-04-25T00:00:00.000Z"),
      updatedAt: new Date("2026-04-25T00:00:00.000Z")
    }),
    listWorldReferencesBySceneIds: async () => options.references ?? []
  };
}

describe("WorldReferenceService", () => {
  it("resolves linked world nodes for a chapter context panel", async () => {
    const service = new WorldReferenceService(
      createChapterRepositoryDouble(),
      createWorldRepositoryDouble({
        references: [reference]
      })
    );

    const result = await service.getChapterWorldContext({
      chapterId: chapterRecord.id
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.referencedNodeCount).toBe(1);
      expect(result.data.scenes[0]).toMatchObject({
        sceneId: "scene_001",
        sceneSortOrder: 1
      });
      expect(result.data.scenes[0].nodes[0]).toMatchObject({
        nodeName: "Aurelian Kingdom",
        layerKey: "KINGDOMS"
      });
    }
  });

  it("returns a safe empty-reference context when no world nodes are linked", async () => {
    const service = new WorldReferenceService(createChapterRepositoryDouble(), createWorldRepositoryDouble());

    const result = await service.getChapterWorldContext({
      chapterId: chapterRecord.id
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.referencedNodeCount).toBe(0);
      expect(result.data.emptyStateMessage).toBe("No world nodes are linked to this chapter's scenes yet.");
    }
  });

  it("returns a safe fallback when reference resolution fails", async () => {
    const service = new WorldReferenceService(
      createChapterRepositoryDouble({
        throwOnLinks: true
      }),
      createWorldRepositoryDouble()
    );

    const result = await service.getChapterWorldContext({
      chapterId: chapterRecord.id
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "PERSISTENCE_ERROR",
        message: "Unable to load chapter world context right now."
      }
    });
  });
});
