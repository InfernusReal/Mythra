export type SceneRecord = {
  id: string;
  milestoneId: string;
  outline: string;
  explanation: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SceneMilestoneSummary = {
  id: string;
  title: string;
  volumeId: string;
};

export type SceneGraphEdgeRecord = {
  id: string;
  milestoneId: string;
  fromSceneId: string;
  toSceneId: string;
  relationship: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SceneGraphRelationship = {
  id: string;
  fromSceneId: string;
  toSceneId: string;
  relationship: string;
  fromSceneOutline: string;
  toSceneOutline: string;
};

export type SceneGraphCollection = {
  milestone: SceneMilestoneSummary;
  scenes: SceneRecord[];
  relationships: SceneGraphRelationship[];
};

export type SceneDetailRecord = {
  milestone: SceneMilestoneSummary;
  scene: SceneRecord;
};

export type CreateSceneInput = {
  milestoneId: string;
  outline: string;
  explanation: string;
};

export type UpdateSceneInput = {
  sceneId: string;
  outline: string;
  explanation: string;
};

export type CreateSceneGraphEdgeInput = {
  milestoneId: string;
  fromSceneId: string;
  toSceneId: string;
  relationship: string;
};

export type SceneErrorCode =
  | "VALIDATION_ERROR"
  | "MILESTONE_NOT_FOUND"
  | "SCENE_NOT_FOUND"
  | "GRAPH_EDGE_NOT_ALLOWED"
  | "PERSISTENCE_ERROR";

export type SceneError = {
  code: SceneErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type SceneResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: SceneError;
    };

export interface SceneRepository {
  findMilestoneById(milestoneId: string): Promise<SceneMilestoneSummary | null>;
  listScenesByMilestoneId(milestoneId: string): Promise<SceneRecord[]>;
  findSceneById(sceneId: string): Promise<SceneRecord | null>;
  createScene(input: CreateSceneInput): Promise<SceneRecord>;
  updateScene(input: UpdateSceneInput): Promise<SceneRecord>;
  listGraphEdgesByMilestoneId(milestoneId: string): Promise<SceneGraphEdgeRecord[]>;
  findGraphEdgeByNodes(fromSceneId: string, toSceneId: string): Promise<SceneGraphEdgeRecord | null>;
  createGraphEdge(input: CreateSceneGraphEdgeInput): Promise<SceneGraphEdgeRecord>;
}
