export const WORLD_LAYER_KEYS = [
  "SPACE_UNIVERSE",
  "PLANETS",
  "KINGDOMS",
  "ORGANIZATIONS",
  "ADVENTURE_TEAMS"
] as const;

export const WORLD_ORDERING_MODES = ["STRONGEST_TO_WEAKEST", "FIXED_CAP"] as const;

export type WorldLayerKey = (typeof WORLD_LAYER_KEYS)[number];
export type WorldOrderingMode = (typeof WORLD_ORDERING_MODES)[number];

export type PersistedWorldLayerRecord = {
  id: string;
  volumeId: string;
  layerKey: WorldLayerKey;
  displayName: string;
  position: number;
  orderingMode: WorldOrderingMode;
  vibe: string | null;
  constraints: string | null;
  narrativeFlavor: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type WorldLayerRecord = PersistedWorldLayerRecord & {
  orderingModeLabel: string;
};

export type WorldVolumeSummary = {
  id: string;
  title: string;
  novelId: string;
  novelTitle: string;
};

export type WorldLayerTreeRecord = {
  volume: WorldVolumeSummary;
  layers: WorldLayerRecord[];
  emptyStateMessage: string | null;
};

export type CreateWorldLayerInput = {
  volumeId: string;
  layerKey: WorldLayerKey;
  displayName: string;
  position: number;
  orderingMode: WorldOrderingMode;
  vibe: string | null;
  constraints: string | null;
  narrativeFlavor: string | null;
};

export type UpdateWorldLayerInput = {
  volumeId: string;
  layerKey: WorldLayerKey;
  orderingMode: WorldOrderingMode;
  vibe: string | null;
  constraints: string | null;
  narrativeFlavor: string | null;
};

export type WorldLayerErrorCode = "VALIDATION_ERROR" | "VOLUME_NOT_FOUND" | "PERSISTENCE_ERROR";

export type WorldLayerError = {
  code: WorldLayerErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type WorldLayerResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: WorldLayerError;
    };

export interface WorldRepository {
  findVolumeSummaryById(volumeId: string): Promise<WorldVolumeSummary | null>;
  listLayersByVolumeId(volumeId: string): Promise<PersistedWorldLayerRecord[]>;
  createLayers(inputs: CreateWorldLayerInput[]): Promise<PersistedWorldLayerRecord[]>;
  updateLayer(input: UpdateWorldLayerInput): Promise<PersistedWorldLayerRecord>;
  findLayerByKey(volumeId: string, layerKey: WorldLayerKey): Promise<import("./world-node.types").WorldLayerSummary | null>;
  listNodesByLayerId(layerId: string): Promise<import("./world-node.types").PersistedWorldNodeRecord[]>;
  listNodesByVolumeId(volumeId: string): Promise<import("./world-node.types").PersistedWorldNodeRecord[]>;
  findNodeById(nodeId: string): Promise<import("./world-node.types").PersistedWorldNodeRecord | null>;
  createNode(input: {
    volumeId: string;
    layerId: string;
    name: string;
    positionJustification: string | null;
    advantages: string | null;
    disadvantages: string | null;
    relationships: string | null;
    geographicalLocation: string | null;
    traditions: string | null;
    specialTraits: string | null;
    lastReminderQueuedAt: Date | null;
    nextReminderDueAt: Date | null;
  }): Promise<import("./world-node.types").PersistedWorldNodeRecord>;
  updateNode(input: {
    nodeId: string;
    volumeId: string;
    layerId: string;
    name: string;
    positionJustification: string | null;
    advantages: string | null;
    disadvantages: string | null;
    relationships: string | null;
    geographicalLocation: string | null;
    traditions: string | null;
    specialTraits: string | null;
    lastReminderQueuedAt: Date | null;
    nextReminderDueAt: Date | null;
  }): Promise<import("./world-node.types").PersistedWorldNodeRecord>;
  updateNodeReminderSchedule(input: {
    nodeId: string;
    lastReminderQueuedAt: Date;
    nextReminderDueAt: Date;
  }): Promise<import("./world-node.types").PersistedWorldNodeRecord>;
  findSceneWorldLink(sceneId: string, worldNodeId: string): Promise<import("./world-reference.types").SceneWorldLinkRecord | null>;
  createSceneWorldLink(input: import("./world-reference.types").LinkWorldNodeToSceneInput): Promise<import("./world-reference.types").SceneWorldLinkRecord>;
  listWorldReferencesBySceneIds(sceneIds: string[]): Promise<import("./world-reference.types").WorldReferenceNodeRecord[]>;
}
