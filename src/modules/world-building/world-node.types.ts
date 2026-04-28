import type { WorldLayerKey, WorldVolumeSummary } from "./world-layer.types";

export const WORLD_NODE_REQUIRED_FIELDS = [
  "positionJustification",
  "advantages",
  "disadvantages",
  "relationships",
  "geographicalLocation",
  "traditions"
] as const;

export type WorldNodeRequiredField = (typeof WORLD_NODE_REQUIRED_FIELDS)[number];

export type PersistedWorldNodeRecord = {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
};

export type WorldLayerSummary = {
  id: string;
  volumeId: string;
  layerKey: WorldLayerKey;
  displayName: string;
  position: number;
};

export type WorldNodeRecord = PersistedWorldNodeRecord & {
  missingRequiredFields: WorldNodeRequiredField[];
  isComplete: boolean;
  completionLabel: string;
  lastReminderQueuedAtLabel: string | null;
  nextReminderDueAtLabel: string | null;
};

export type WorldNodeCollection = {
  volume: WorldVolumeSummary;
  layer: WorldLayerSummary;
  nodes: WorldNodeRecord[];
  emptyStateMessage: string | null;
};

export type UpsertWorldNodeInput = {
  nodeId?: string;
  volumeId: string;
  layerKey: WorldLayerKey;
  name: string;
  positionJustification: string | null;
  advantages: string | null;
  disadvantages: string | null;
  relationships: string | null;
  geographicalLocation: string | null;
  traditions: string | null;
  specialTraits: string | null;
};

export type WorldReminderQueuedRecord = {
  nodeId: string;
  nodeName: string;
  layerKey: WorldLayerKey;
  missingRequiredFields: WorldNodeRequiredField[];
  queuedAt: string;
  nextReminderDueAt: string;
  intervalDays: 1 | 2;
};

export type WorldReminderScanRecord = {
  volume: WorldVolumeSummary;
  scannedNodeCount: number;
  queuedReminderCount: number;
  reminders: WorldReminderQueuedRecord[];
};

export type WorldNodeErrorCode =
  | "VALIDATION_ERROR"
  | "VOLUME_NOT_FOUND"
  | "WORLD_LAYER_NOT_FOUND"
  | "WORLD_NODE_NOT_FOUND"
  | "PERSISTENCE_ERROR";

export type WorldNodeError = {
  code: WorldNodeErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type WorldNodeResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: WorldNodeError;
    };
