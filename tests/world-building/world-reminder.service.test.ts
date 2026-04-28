import { describe, expect, it } from "vitest";

import { WorldReminderService } from "../../src/modules/world-building/world-reminder.service";
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

function createLayerRecord(): PersistedWorldLayerRecord {
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
    updatedAt: new Date("2026-04-25T00:00:00.000Z")
  };
}

function createNodeRecord(overrides: Partial<PersistedWorldNodeRecord> = {}): PersistedWorldNodeRecord {
  return {
    id: "node_001",
    volumeId: volumeSummary.id,
    layerId: layerSummary.id,
    name: "Aurelian Kingdom",
    positionJustification: null,
    advantages: "Military discipline",
    disadvantages: null,
    relationships: null,
    geographicalLocation: "Northern continent",
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
  throwOnList?: boolean;
} = {}): WorldRepository {
  const nodeState = [...(options.initialNodes ?? [])];

  return {
    findVolumeSummaryById: async () => volumeSummary,
    listLayersByVolumeId: async () => [createLayerRecord()],
    createLayers: async () => [createLayerRecord()],
    updateLayer: async () => createLayerRecord(),
    findLayerByKey: async () => layerSummary,
    listNodesByLayerId: async () => nodeState.filter((node) => node.layerId === layerSummary.id),
    listNodesByVolumeId: async () => {
      if (options.throwOnList) {
        throw new Error("DATABASE_DOWN");
      }

      return nodeState;
    },
    findNodeById: async (nodeId) => nodeState.find((node) => node.id === nodeId) ?? null,
    createNode: async () => createNodeRecord(),
    updateNode: async () => createNodeRecord(),
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

describe("WorldReminderService", () => {
  it("queues reminders for due incomplete nodes and schedules the next due date", async () => {
    const service = new WorldReminderService(
      createRepositoryDouble({
        initialNodes: [
          createNodeRecord({
            nextReminderDueAt: new Date("2026-04-20T00:00:00.000Z")
          })
        ]
      })
    );

    const result = await service.queueIncompleteNodeReminders({
      volumeId: volumeSummary.id
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.scannedNodeCount).toBe(1);
      expect(result.data.queuedReminderCount).toBe(1);
      expect(result.data.reminders[0]).toMatchObject({
        nodeId: "node_001",
        nodeName: "Aurelian Kingdom",
        layerKey: "KINGDOMS"
      });
    }
  });

  it("skips reminders that are not due yet", async () => {
    const service = new WorldReminderService(
      createRepositoryDouble({
        initialNodes: [
          createNodeRecord({
            nextReminderDueAt: new Date("2099-04-26T00:00:00.000Z")
          })
        ]
      })
    );

    const result = await service.queueIncompleteNodeReminders({
      volumeId: volumeSummary.id
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.queuedReminderCount).toBe(0);
      expect(result.data.reminders).toEqual([]);
    }
  });

  it("returns a safe fallback when reminder scanning fails", async () => {
    const service = new WorldReminderService(
      createRepositoryDouble({
        throwOnList: true
      })
    );

    const result = await service.queueIncompleteNodeReminders({
      volumeId: volumeSummary.id
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "PERSISTENCE_ERROR",
        message: "Unable to queue world-node reminders right now."
      }
    });
  });
});
