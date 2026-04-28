import { describe, expect, it } from "vitest";

import { SceneWorldLinkService } from "../../src/modules/scenes/scene-world-link.service";
import type {
  CreateSceneGraphEdgeInput,
  CreateSceneInput,
  SceneGraphEdgeRecord,
  SceneMilestoneSummary,
  SceneRecord,
  SceneRepository,
  UpdateSceneInput
} from "../../src/modules/scenes/scene.types";
import type { WorldRepository, WorldVolumeSummary } from "../../src/modules/world-building/world-layer.types";
import type { PersistedWorldLayerRecord } from "../../src/modules/world-building/world-layer.types";
import type { PersistedWorldNodeRecord, WorldLayerSummary } from "../../src/modules/world-building/world-node.types";
import type { LinkWorldNodeToSceneInput, SceneWorldLinkRecord } from "../../src/modules/world-building/world-reference.types";

const milestoneSummary: SceneMilestoneSummary = {
  id: "milestone_123",
  title: "Conflict Escalation",
  volumeId: "volume_123"
};

const sceneRecord: SceneRecord = {
  id: "scene_123",
  milestoneId: milestoneSummary.id,
  outline: "The convoy enters the ravine.",
  explanation: "The scene introduces the ambush route.",
  createdAt: new Date("2026-04-25T00:00:00.000Z"),
  updatedAt: new Date("2026-04-25T00:00:00.000Z")
};

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

function createNode(overrides: Partial<PersistedWorldNodeRecord> = {}): PersistedWorldNodeRecord {
  return {
    id: "node_123",
    volumeId: volumeSummary.id,
    layerId: layerSummary.id,
    name: "Aurelian Kingdom",
    positionJustification: "It controls the main trade route.",
    advantages: "Disciplined army",
    disadvantages: "Rigid command structure",
    relationships: "Tense alliance with the border clans",
    geographicalLocation: "Northern continent",
    traditions: "Winter oath ceremonies",
    specialTraits: null,
    lastReminderQueuedAt: null,
    nextReminderDueAt: null,
    createdAt: new Date("2026-04-25T00:00:00.000Z"),
    updatedAt: new Date("2026-04-25T00:00:00.000Z"),
    ...overrides
  };
}

function createSceneRepositoryDouble(): SceneRepository {
  return {
    findMilestoneById: async () => milestoneSummary,
    listScenesByMilestoneId: async () => [sceneRecord],
    findSceneById: async (sceneId) => (sceneId === sceneRecord.id ? sceneRecord : null),
    createScene: async (input: CreateSceneInput) => ({ ...sceneRecord, ...input }),
    updateScene: async (input: UpdateSceneInput) => ({ ...sceneRecord, ...input }),
    listGraphEdgesByMilestoneId: async () => [],
    findGraphEdgeByNodes: async () => null,
    createGraphEdge: async (input: CreateSceneGraphEdgeInput): Promise<SceneGraphEdgeRecord> => ({
      id: "edge_123",
      ...input,
      createdAt: new Date("2026-04-25T00:00:00.000Z"),
      updatedAt: new Date("2026-04-25T00:00:00.000Z")
    })
  };
}

function createWorldRepositoryDouble(options: {
  node?: PersistedWorldNodeRecord | null;
  existingLink?: SceneWorldLinkRecord | null;
} = {}): WorldRepository {
  const node = options.node === undefined ? createNode() : options.node;

  return {
    findVolumeSummaryById: async () => volumeSummary,
    listLayersByVolumeId: async (): Promise<PersistedWorldLayerRecord[]> => [],
    createLayers: async () => [],
    updateLayer: async () => {
      throw new Error("NOT_IMPLEMENTED");
    },
    findLayerByKey: async () => layerSummary,
    listNodesByLayerId: async () => (node ? [node] : []),
    listNodesByVolumeId: async () => (node ? [node] : []),
    findNodeById: async () => node,
    createNode: async () => {
      throw new Error("NOT_IMPLEMENTED");
    },
    updateNode: async () => {
      throw new Error("NOT_IMPLEMENTED");
    },
    updateNodeReminderSchedule: async () => {
      throw new Error("NOT_IMPLEMENTED");
    },
    findSceneWorldLink: async () => options.existingLink ?? null,
    createSceneWorldLink: async (input: LinkWorldNodeToSceneInput) => ({
      id: "scene_world_link_123",
      ...input,
      createdAt: new Date("2026-04-25T00:00:00.000Z"),
      updatedAt: new Date("2026-04-25T00:00:00.000Z")
    }),
    listWorldReferencesBySceneIds: async () => []
  };
}

describe("SceneWorldLinkService", () => {
  it("links a world node to a scene in the same volume", async () => {
    const service = new SceneWorldLinkService(createSceneRepositoryDouble(), createWorldRepositoryDouble());

    const result = await service.linkWorldNodeToScene({
      sceneId: sceneRecord.id,
      worldNodeId: "node_123"
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data).toMatchObject({
        sceneId: sceneRecord.id,
        worldNodeId: "node_123"
      });
    }
  });

  it("blocks scene-world links across different volumes", async () => {
    const service = new SceneWorldLinkService(
      createSceneRepositoryDouble(),
      createWorldRepositoryDouble({
        node: createNode({
          volumeId: "other_volume"
        })
      })
    );

    const result = await service.linkWorldNodeToScene({
      sceneId: sceneRecord.id,
      worldNodeId: "node_123"
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "WORLD_REFERENCE_NOT_ALLOWED",
        message: "World nodes can only be linked to scenes inside the same volume."
      }
    });
  });

  it("blocks duplicate scene-world references", async () => {
    const existingLink: SceneWorldLinkRecord = {
      id: "scene_world_link_123",
      sceneId: sceneRecord.id,
      worldNodeId: "node_123",
      createdAt: new Date("2026-04-25T00:00:00.000Z"),
      updatedAt: new Date("2026-04-25T00:00:00.000Z")
    };
    const service = new SceneWorldLinkService(
      createSceneRepositoryDouble(),
      createWorldRepositoryDouble({
        existingLink
      })
    );

    const result = await service.linkWorldNodeToScene({
      sceneId: sceneRecord.id,
      worldNodeId: "node_123"
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "DUPLICATE_WORLD_REFERENCE",
        message: "This world node is already linked to the selected scene."
      }
    });
  });
});
