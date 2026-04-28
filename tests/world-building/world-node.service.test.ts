import { describe, expect, it } from "vitest";

import { WorldNodeService } from "../../src/modules/world-building/world-node.service";
import type { WorldRepository, WorldVolumeSummary } from "../../src/modules/world-building/world-layer.types";
import type { PersistedWorldLayerRecord } from "../../src/modules/world-building/world-layer.types";
import type { PersistedWorldNodeRecord, WorldLayerSummary } from "../../src/modules/world-building/world-node.types";

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

function createLayerRecord(overrides: Partial<PersistedWorldLayerRecord> = {}): PersistedWorldLayerRecord {
  return {
    id: layerSummary.id,
    volumeId: volumeSummary.id,
    layerKey: layerSummary.layerKey,
    displayName: layerSummary.displayName,
    position: layerSummary.position,
    orderingMode: "STRONGEST_TO_WEAKEST",
    vibe: null,
    constraints: null,
    narrativeFlavor: null,
    createdAt: new Date("2026-04-25T00:00:00.000Z"),
    updatedAt: new Date("2026-04-25T00:00:00.000Z"),
    ...overrides
  };
}

function createNodeRecord(overrides: Partial<PersistedWorldNodeRecord> = {}): PersistedWorldNodeRecord {
  return {
    id: "node_001",
    volumeId: volumeSummary.id,
    layerId: layerSummary.id,
    name: "Aurelian Kingdom",
    positionJustification: null,
    advantages: null,
    disadvantages: null,
    relationships: null,
    geographicalLocation: null,
    traditions: null,
    specialTraits: null,
    lastReminderQueuedAt: null,
    nextReminderDueAt: null,
    createdAt: new Date("2026-04-25T00:00:00.000Z"),
    updatedAt: new Date("2026-04-25T00:00:00.000Z"),
    ...overrides
  };
}

function createRepositoryDouble(options: {
  initialNodes?: PersistedWorldNodeRecord[];
  throwOnRead?: boolean;
} = {}): WorldRepository {
  const nodeState = [...(options.initialNodes ?? [])];

  return {
    findVolumeSummaryById: async () => volumeSummary,
    listLayersByVolumeId: async () => [createLayerRecord()],
    createLayers: async () => [createLayerRecord()],
    updateLayer: async () => createLayerRecord(),
    findLayerByKey: async () => layerSummary,
    listNodesByLayerId: async () => {
      if (options.throwOnRead) {
        throw new Error("DATABASE_DOWN");
      }

      return nodeState.filter((node) => node.layerId === layerSummary.id);
    },
    listNodesByVolumeId: async () => nodeState,
    findNodeById: async (nodeId) => nodeState.find((node) => node.id === nodeId) ?? null,
    createNode: async (input) => {
      const createdNode = createNodeRecord({
        id: `node_${nodeState.length + 1}`,
        volumeId: input.volumeId,
        layerId: input.layerId,
        name: input.name,
        positionJustification: input.positionJustification,
        advantages: input.advantages,
        disadvantages: input.disadvantages,
        relationships: input.relationships,
        geographicalLocation: input.geographicalLocation,
        traditions: input.traditions,
        specialTraits: input.specialTraits,
        lastReminderQueuedAt: input.lastReminderQueuedAt,
        nextReminderDueAt: input.nextReminderDueAt
      });

      nodeState.push(createdNode);
      return createdNode;
    },
    updateNode: async (input) => {
      const targetNode = nodeState.find((node) => node.id === input.nodeId);

      if (!targetNode) {
        throw new Error("NODE_NOT_FOUND");
      }

      Object.assign(targetNode, {
        volumeId: input.volumeId,
        layerId: input.layerId,
        name: input.name,
        positionJustification: input.positionJustification,
        advantages: input.advantages,
        disadvantages: input.disadvantages,
        relationships: input.relationships,
        geographicalLocation: input.geographicalLocation,
        traditions: input.traditions,
        specialTraits: input.specialTraits,
        lastReminderQueuedAt: input.lastReminderQueuedAt,
        nextReminderDueAt: input.nextReminderDueAt
      });

      return targetNode;
    },
    updateNodeReminderSchedule: async (input) => {
      const targetNode = nodeState.find((node) => node.id === input.nodeId)!;
      targetNode.lastReminderQueuedAt = input.lastReminderQueuedAt;
      targetNode.nextReminderDueAt = input.nextReminderDueAt;
      return targetNode;
    },
    findSceneWorldLink: async () => null,
    createSceneWorldLink: async () => {
      throw new Error("NOT_IMPLEMENTED");
    },
    listWorldReferencesBySceneIds: async () => []
  };
}

describe("WorldNodeService", () => {
  it("creates an incomplete world node draft and schedules its first reminder window", async () => {
    const service = new WorldNodeService(createRepositoryDouble());

    const result = await service.upsertWorldNode({
      volumeId: volumeSummary.id,
      layerKey: layerSummary.layerKey,
      name: "Aurelian Kingdom",
      positionJustification: "",
      advantages: "Military discipline",
      disadvantages: "",
      relationships: "",
      geographicalLocation: "Northern continent",
      traditions: "",
      specialTraits: "Hidden citadel network"
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.nodes).toHaveLength(1);
      expect(result.data.nodes[0].isComplete).toBe(false);
      expect(result.data.nodes[0].missingRequiredFields).toEqual([
        "positionJustification",
        "disadvantages",
        "relationships",
        "traditions"
      ]);
      expect(result.data.nodes[0].nextReminderDueAtLabel).not.toBeNull();
    }
  });

  it("marks a fully described world node as complete and clears reminder scheduling", async () => {
    const service = new WorldNodeService(createRepositoryDouble());

    const result = await service.upsertWorldNode({
      volumeId: volumeSummary.id,
      layerKey: layerSummary.layerKey,
      name: "Aurelian Kingdom",
      positionJustification: "It controls the most stable mana routes.",
      advantages: "Military discipline",
      disadvantages: "Slow maritime expansion",
      relationships: "Cold trade war with the eastern crown",
      geographicalLocation: "Northern continent",
      traditions: "Winter oath ceremonies",
      specialTraits: "Hidden citadel network"
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.nodes[0]).toMatchObject({
        isComplete: true,
        missingRequiredFields: [],
        completionLabel: "Complete",
        nextReminderDueAtLabel: null
      });
    }
  });

  it("returns a safe persistence fallback when node loading fails", async () => {
    const service = new WorldNodeService(
      createRepositoryDouble({
        throwOnRead: true
      })
    );

    const result = await service.getWorldNodesByLayer({
      volumeId: volumeSummary.id,
      layerKey: layerSummary.layerKey
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "PERSISTENCE_ERROR",
        message: "Unable to load world nodes right now."
      }
    });
  });
});
