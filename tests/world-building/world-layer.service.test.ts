import { describe, expect, it } from "vitest";

import { WorldLayerService } from "../../src/modules/world-building/world-layer.service";
import { WorldRuleEngineService } from "../../src/modules/world-building/world-rule-engine.service";
import type {
  CreateWorldLayerInput,
  PersistedWorldLayerRecord,
  UpdateWorldLayerInput,
  WorldRepository,
  WorldVolumeSummary
} from "../../src/modules/world-building/world-layer.types";

const volumeSummary: WorldVolumeSummary = {
  id: "volume_123",
  title: "Volume One",
  novelId: "novel_123",
  novelTitle: "Mythra"
};

function createLayer(overrides: Partial<PersistedWorldLayerRecord> = {}): PersistedWorldLayerRecord {
  return {
    id: "layer_001",
    volumeId: volumeSummary.id,
    layerKey: "SPACE_UNIVERSE",
    displayName: "Space / Universe",
    position: 1,
    orderingMode: "STRONGEST_TO_WEAKEST",
    vibe: null,
    constraints: null,
    narrativeFlavor: null,
    createdAt: new Date("2026-04-25T00:00:00.000Z"),
    updatedAt: new Date("2026-04-25T00:00:00.000Z"),
    ...overrides
  };
}

function createRepositoryDouble(options: {
  initialLayers?: PersistedWorldLayerRecord[];
  createLayersReturnsEmpty?: boolean;
  throwOnList?: boolean;
} = {}): WorldRepository {
  const layerState = [...(options.initialLayers ?? [])];

  return {
    findVolumeSummaryById: async () => volumeSummary,
    listLayersByVolumeId: async () => {
      if (options.throwOnList) {
        throw new Error("DATABASE_DOWN");
      }

      return [...layerState].sort((leftLayer, rightLayer) => leftLayer.position - rightLayer.position);
    },
    createLayers: async (inputs: CreateWorldLayerInput[]) => {
      if (options.createLayersReturnsEmpty) {
        return [];
      }

      inputs.forEach((input, index) => {
        layerState.push(
          createLayer({
            id: `layer_${index + 1}`,
            layerKey: input.layerKey,
            displayName: input.displayName,
            position: input.position,
            orderingMode: input.orderingMode,
            vibe: input.vibe,
            constraints: input.constraints,
            narrativeFlavor: input.narrativeFlavor
          })
        );
      });

      return [...layerState].sort((leftLayer, rightLayer) => leftLayer.position - rightLayer.position);
    },
    updateLayer: async (input: UpdateWorldLayerInput) => {
      const targetLayer = layerState.find((layer) => layer.volumeId === input.volumeId && layer.layerKey === input.layerKey);

      if (!targetLayer) {
        throw new Error("LAYER_NOT_FOUND");
      }

      targetLayer.orderingMode = input.orderingMode;
      targetLayer.vibe = input.vibe;
      targetLayer.constraints = input.constraints;
      targetLayer.narrativeFlavor = input.narrativeFlavor;
      return targetLayer;
    },
    findLayerByKey: async (volumeId, layerKey) => {
      const targetLayer = layerState.find((layer) => layer.volumeId === volumeId && layer.layerKey === layerKey);

      if (!targetLayer) {
        return null;
      }

      return {
        id: targetLayer.id,
        volumeId: targetLayer.volumeId,
        layerKey: targetLayer.layerKey,
        displayName: targetLayer.displayName,
        position: targetLayer.position
      };
    },
    listNodesByLayerId: async () => [],
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
    createSceneWorldLink: async () => {
      throw new Error("NOT_IMPLEMENTED");
    },
    listWorldReferencesBySceneIds: async () => []
  };
}

describe("WorldLayerService", () => {
  it("bootstraps the fixed world layers for a valid volume", async () => {
    const service = new WorldLayerService(createRepositoryDouble(), new WorldRuleEngineService());

    const result = await service.getVolumeWorldLayers({
      volumeId: volumeSummary.id
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.layers).toHaveLength(5);
      expect(result.data.layers.map((layer) => layer.displayName)).toEqual([
        "Space / Universe",
        "Planets",
        "Kingdoms",
        "Organizations",
        "Adventure Teams"
      ]);
      expect(result.data.emptyStateMessage).toBeNull();
    }
  });

  it("updates ordering mode and invariant fields through the service layer", async () => {
    const service = new WorldLayerService(
      createRepositoryDouble({
        initialLayers: [
          createLayer(),
          createLayer({
            id: "layer_002",
            layerKey: "PLANETS",
            displayName: "Planets",
            position: 2
          }),
          createLayer({
            id: "layer_003",
            layerKey: "KINGDOMS",
            displayName: "Kingdoms",
            position: 3
          }),
          createLayer({
            id: "layer_004",
            layerKey: "ORGANIZATIONS",
            displayName: "Organizations",
            position: 4
          }),
          createLayer({
            id: "layer_005",
            layerKey: "ADVENTURE_TEAMS",
            displayName: "Adventure Teams",
            position: 5
          })
        ]
      }),
      new WorldRuleEngineService()
    );

    const result = await service.updateWorldLayer({
      volumeId: volumeSummary.id,
      layerKey: "KINGDOMS",
      orderingMode: "FIXED_CAP",
      vibe: "  Court intrigue and military hierarchy ",
      constraints: "  Seven sovereign limits ",
      narrativeFlavor: "  Tense aristocratic rivalry "
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      const kingdomsLayer = result.data.layers.find((layer) => layer.layerKey === "KINGDOMS");

      expect(kingdomsLayer).toMatchObject({
        orderingMode: "FIXED_CAP",
        orderingModeLabel: "Fixed cap",
        vibe: "Court intrigue and military hierarchy",
        constraints: "Seven sovereign limits",
        narrativeFlavor: "Tense aristocratic rivalry"
      });
    }
  });

  it("returns a safe empty-tree fallback when bootstrap cannot produce layers", async () => {
    const service = new WorldLayerService(
      createRepositoryDouble({
        createLayersReturnsEmpty: true
      }),
      new WorldRuleEngineService()
    );

    const result = await service.getVolumeWorldLayers({
      volumeId: volumeSummary.id
    });

    expect(result).toEqual({
      ok: true,
      data: {
        volume: volumeSummary,
        layers: [],
        emptyStateMessage: "World layers are not available yet for this volume."
      }
    });
  });

  it("returns a safe persistence fallback when layer loading fails", async () => {
    const service = new WorldLayerService(
      createRepositoryDouble({
        throwOnList: true
      }),
      new WorldRuleEngineService()
    );

    const result = await service.getVolumeWorldLayers({
      volumeId: volumeSummary.id
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "PERSISTENCE_ERROR",
        message: "Unable to load world-building layers right now."
      }
    });
  });
});
