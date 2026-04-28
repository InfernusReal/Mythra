import type {
  CreateWorldLayerInput,
  PersistedWorldLayerRecord,
  UpdateWorldLayerInput,
  WorldLayerKey,
  WorldLayerRecord,
  WorldOrderingMode
} from "./world-layer.types";

type WorldLayerDefinition = {
  key: WorldLayerKey;
  displayName: string;
  position: number;
};

const WORLD_LAYER_DEFINITIONS: readonly WorldLayerDefinition[] = [
  {
    key: "SPACE_UNIVERSE",
    displayName: "Space / Universe",
    position: 1
  },
  {
    key: "PLANETS",
    displayName: "Planets",
    position: 2
  },
  {
    key: "KINGDOMS",
    displayName: "Kingdoms",
    position: 3
  },
  {
    key: "ORGANIZATIONS",
    displayName: "Organizations",
    position: 4
  },
  {
    key: "ADVENTURE_TEAMS",
    displayName: "Adventure Teams",
    position: 5
  }
] as const;

export class WorldRuleEngineService {
  buildBootstrapLayers(
    volumeId: string,
    existingLayers: PersistedWorldLayerRecord[]
  ): CreateWorldLayerInput[] {
    const existingKeys = new Set(existingLayers.map((layer) => layer.layerKey));

    return WORLD_LAYER_DEFINITIONS.filter((definition) => !existingKeys.has(definition.key)).map((definition) => ({
      volumeId,
      layerKey: definition.key,
      displayName: definition.displayName,
      position: definition.position,
      orderingMode: "STRONGEST_TO_WEAKEST",
      vibe: null,
      constraints: null,
      narrativeFlavor: null
    }));
  }

  resolveLayerTree(layers: PersistedWorldLayerRecord[]): WorldLayerRecord[] {
    return [...layers]
      .sort((leftLayer, rightLayer) => leftLayer.position - rightLayer.position)
      .map((layer) => ({
        ...layer,
        orderingModeLabel: this.resolveOrderingModeLabel(layer.orderingMode)
      }));
  }

  normalizeLayerUpdate(input: UpdateWorldLayerInput): UpdateWorldLayerInput {
    return {
      volumeId: input.volumeId,
      layerKey: input.layerKey,
      orderingMode: input.orderingMode,
      vibe: this.normalizeInvariantField(input.vibe),
      constraints: this.normalizeInvariantField(input.constraints),
      narrativeFlavor: this.normalizeInvariantField(input.narrativeFlavor)
    };
  }

  resolveOrderingModeLabel(orderingMode: WorldOrderingMode): string {
    return orderingMode === "FIXED_CAP" ? "Fixed cap" : "Strongest to weakest";
  }

  private normalizeInvariantField(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const normalizedValue = value.trim();
    return normalizedValue.length === 0 ? null : normalizedValue;
  }
}
