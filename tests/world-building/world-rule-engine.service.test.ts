import { describe, expect, it } from "vitest";

import { WorldRuleEngineService } from "../../src/modules/world-building/world-rule-engine.service";
import type { PersistedWorldLayerRecord } from "../../src/modules/world-building/world-layer.types";

function createLayer(overrides: Partial<PersistedWorldLayerRecord> = {}): PersistedWorldLayerRecord {
  return {
    id: "layer_001",
    volumeId: "volume_123",
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

describe("WorldRuleEngineService", () => {
  it("bootstraps the fixed missing layers for a new volume", () => {
    const service = new WorldRuleEngineService();

    const result = service.buildBootstrapLayers("volume_123", []);

    expect(result).toHaveLength(5);
    expect(result.map((layer) => layer.layerKey)).toEqual([
      "SPACE_UNIVERSE",
      "PLANETS",
      "KINGDOMS",
      "ORGANIZATIONS",
      "ADVENTURE_TEAMS"
    ]);
    expect(result.every((layer) => layer.orderingMode === "STRONGEST_TO_WEAKEST")).toBe(true);
  });

  it("only bootstraps layers that are still missing", () => {
    const service = new WorldRuleEngineService();

    const result = service.buildBootstrapLayers("volume_123", [
      createLayer(),
      createLayer({
        id: "layer_002",
        layerKey: "PLANETS",
        displayName: "Planets",
        position: 2
      })
    ]);

    expect(result).toHaveLength(3);
    expect(result.map((layer) => layer.layerKey)).toEqual([
      "KINGDOMS",
      "ORGANIZATIONS",
      "ADVENTURE_TEAMS"
    ]);
  });

  it("normalizes invariant text and resolves ordering mode labels", () => {
    const service = new WorldRuleEngineService();

    const normalizedUpdate = service.normalizeLayerUpdate({
      volumeId: "volume_123",
      layerKey: "KINGDOMS",
      orderingMode: "FIXED_CAP",
      vibe: "  Dense political rivalry  ",
      constraints: "   ",
      narrativeFlavor: "  Rising frontier tension "
    });
    const tree = service.resolveLayerTree([
      createLayer({
        layerKey: "KINGDOMS",
        displayName: "Kingdoms",
        position: 3,
        orderingMode: "FIXED_CAP",
        vibe: normalizedUpdate.vibe,
        constraints: normalizedUpdate.constraints,
        narrativeFlavor: normalizedUpdate.narrativeFlavor
      })
    ]);

    expect(normalizedUpdate).toEqual({
      volumeId: "volume_123",
      layerKey: "KINGDOMS",
      orderingMode: "FIXED_CAP",
      vibe: "Dense political rivalry",
      constraints: null,
      narrativeFlavor: "Rising frontier tension"
    });
    expect(tree[0].orderingModeLabel).toBe("Fixed cap");
  });
});
