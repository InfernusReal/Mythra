import type { WorldLayerKey } from "./world-layer.types";
import type { WorldNodeRequiredField } from "./world-node.types";

export type SceneWorldLinkRecord = {
  id: string;
  sceneId: string;
  worldNodeId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type LinkWorldNodeToSceneInput = {
  sceneId: string;
  worldNodeId: string;
};

export type WorldReferenceNodeRecord = {
  sceneId: string;
  worldNodeId: string;
  nodeName: string;
  layerKey: WorldLayerKey;
  layerName: string;
  positionJustification: string | null;
  advantages: string | null;
  disadvantages: string | null;
  relationships: string | null;
  geographicalLocation: string | null;
  traditions: string | null;
  specialTraits: string | null;
  missingRequiredFields: WorldNodeRequiredField[];
  isComplete: boolean;
};

export type ChapterWorldContextScene = {
  sceneId: string;
  sceneOutline: string;
  sceneSortOrder: number;
  nodes: WorldReferenceNodeRecord[];
};

export type ChapterWorldContextRecord = {
  chapterId: string;
  scenes: ChapterWorldContextScene[];
  referencedNodeCount: number;
  emptyStateMessage: string | null;
};

export type WorldReferenceErrorCode =
  | "VALIDATION_ERROR"
  | "CHAPTER_NOT_FOUND"
  | "SCENE_NOT_FOUND"
  | "WORLD_NODE_NOT_FOUND"
  | "WORLD_REFERENCE_NOT_ALLOWED"
  | "DUPLICATE_WORLD_REFERENCE"
  | "PERSISTENCE_ERROR";

export type WorldReferenceError = {
  code: WorldReferenceErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type WorldReferenceResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: WorldReferenceError;
    };
