import { describe, expect, it } from "vitest";

import { SceneGraphService } from "../../src/modules/scenes/scene-graph.service";
import type {
  CreateSceneGraphEdgeInput,
  SceneGraphEdgeRecord,
  SceneMilestoneSummary,
  SceneRecord,
  SceneRepository
} from "../../src/modules/scenes/scene.types";

const milestoneSummary: SceneMilestoneSummary = {
  id: "milestone_123",
  title: "Conflict Escalation",
  volumeId: "volume_123"
};

const sceneOne: SceneRecord = {
  id: "scene_001",
  milestoneId: milestoneSummary.id,
  outline: "The ambush begins in the ravine.",
  explanation: "The enemy strikes before the escort can regroup.",
  createdAt: new Date("2026-04-17T00:00:00.000Z"),
  updatedAt: new Date("2026-04-17T00:00:00.000Z")
};

const sceneTwo: SceneRecord = {
  id: "scene_002",
  milestoneId: milestoneSummary.id,
  outline: "The escort tries to break through.",
  explanation: "The defenders push toward higher ground and lose two carts.",
  createdAt: new Date("2026-04-17T00:01:00.000Z"),
  updatedAt: new Date("2026-04-17T00:01:00.000Z")
};

const edgeRecord: SceneGraphEdgeRecord = {
  id: "edge_001",
  milestoneId: milestoneSummary.id,
  fromSceneId: sceneOne.id,
  toSceneId: sceneTwo.id,
  relationship: "Escalates into retreat",
  createdAt: new Date("2026-04-17T00:02:00.000Z"),
  updatedAt: new Date("2026-04-17T00:02:00.000Z")
};

function createRepositoryDouble(overrides: Partial<SceneRepository> = {}): SceneRepository {
  return {
    findMilestoneById: async () => milestoneSummary,
    listScenesByMilestoneId: async () => [sceneOne, sceneTwo],
    findSceneById: async (sceneId: string) => [sceneOne, sceneTwo].find((scene) => scene.id === sceneId) ?? null,
    createScene: async () => {
      throw new Error("Not implemented in scene graph service test double.");
    },
    updateScene: async () => {
      throw new Error("Not implemented in scene graph service test double.");
    },
    listGraphEdgesByMilestoneId: async () => [edgeRecord],
    findGraphEdgeByNodes: async () => null,
    createGraphEdge: async (input: CreateSceneGraphEdgeInput) => ({
      id: "edge_002",
      milestoneId: input.milestoneId,
      fromSceneId: input.fromSceneId,
      toSceneId: input.toSceneId,
      relationship: input.relationship,
      createdAt: new Date("2026-04-17T00:03:00.000Z"),
      updatedAt: new Date("2026-04-17T00:03:00.000Z")
    }),
    ...overrides
  };
}

describe("SceneGraphService", () => {
  it("returns a graph read model for a valid milestone", async () => {
    const service = new SceneGraphService(createRepositoryDouble());

    const result = await service.getMilestoneSceneGraph({
      milestoneId: "milestone_123"
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.milestone.title).toBe("Conflict Escalation");
      expect(result.data.scenes).toHaveLength(2);
      expect(result.data.relationships).toEqual([
        {
          id: "edge_001",
          fromSceneId: "scene_001",
          toSceneId: "scene_002",
          relationship: "Escalates into retreat",
          fromSceneOutline: "The ambush begins in the ravine.",
          toSceneOutline: "The escort tries to break through."
        }
      ]);
    }
  });

  it("returns an empty graph safely when the milestone has no scenes yet", async () => {
    const service = new SceneGraphService(
      createRepositoryDouble({
        listScenesByMilestoneId: async () => [],
        listGraphEdgesByMilestoneId: async () => []
      })
    );

    const result = await service.getMilestoneSceneGraph({
      milestoneId: "milestone_123"
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.scenes).toEqual([]);
      expect(result.data.relationships).toEqual([]);
    }
  });

  it("creates a graph edge when both scenes belong to the milestone", async () => {
    const service = new SceneGraphService(createRepositoryDouble());

    const result = await service.createGraphEdge({
      milestoneId: "milestone_123",
      fromSceneId: "scene_001",
      toSceneId: "scene_002",
      relationship: "Escalates into retreat"
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.relationships).toHaveLength(1);
      expect(result.data.relationships[0].relationship).toBe("Escalates into retreat");
    }
  });

  it("blocks a duplicate scene transition", async () => {
    const service = new SceneGraphService(
      createRepositoryDouble({
        findGraphEdgeByNodes: async () => edgeRecord
      })
    );

    const result = await service.createGraphEdge({
      milestoneId: "milestone_123",
      fromSceneId: "scene_001",
      toSceneId: "scene_002",
      relationship: "Escalates into retreat"
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "GRAPH_EDGE_NOT_ALLOWED",
        message: "That scene transition already exists."
      }
    });
  });
});
