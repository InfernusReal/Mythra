import { describe, expect, it } from "vitest";

import type { ChapterSceneSummary } from "../../src/modules/chapters/chapter.types";
import { NextSceneService } from "../../src/modules/scenes/next-scene.service";
import type { SceneGraphEdgeRecord } from "../../src/modules/scenes/scene.types";

const availableScenes: ChapterSceneSummary[] = [
  {
    id: "scene_002",
    milestoneId: "milestone_123",
    outline: "The convoy breaks for the eastern ridge.",
    explanation: "The escort tries to punch through the ambush line."
  },
  {
    id: "scene_003",
    milestoneId: "milestone_123",
    outline: "The reserve unit arrives too late.",
    explanation: "Late reinforcements reach the ravine after the main clash."
  }
];

describe("NextSceneService", () => {
  it("prefers a graph-connected next scene when one is available", () => {
    const service = new NextSceneService();
    const graphEdges: SceneGraphEdgeRecord[] = [
      {
        id: "edge_001",
        milestoneId: "milestone_123",
        fromSceneId: "scene_001",
        toSceneId: "scene_002",
        relationship: "ESCALATES_TO",
        createdAt: new Date("2026-04-20T00:00:00.000Z"),
        updatedAt: new Date("2026-04-20T00:00:00.000Z")
      }
    ];

    const result = service.resolveNextScene({
      linkedSceneIdsInOrder: ["scene_001"],
      availableScenes,
      graphEdges
    });

    expect(result).toEqual({
      sceneId: "scene_002",
      outline: "The convoy breaks for the eastern ridge.",
      explanation: "The escort tries to punch through the ambush line.",
      relationship: "ESCALATES_TO",
      resolutionSource: "GRAPH_EDGE",
      reasonLabel: "Recommended by the scene graph via escalates_to."
    });
  });

  it("falls back to the first available scene when the graph cannot resolve a next step", () => {
    const service = new NextSceneService();

    const result = service.resolveNextScene({
      linkedSceneIdsInOrder: ["scene_001"],
      availableScenes,
      graphEdges: []
    });

    expect(result).toEqual({
      sceneId: "scene_002",
      outline: "The convoy breaks for the eastern ridge.",
      explanation: "The escort tries to punch through the ambush line.",
      relationship: null,
      resolutionSource: "FIRST_AVAILABLE",
      reasonLabel: "Next available scene in milestone order."
    });
  });

  it("returns null when the chapter already covers all available scenes", () => {
    const service = new NextSceneService();

    const result = service.resolveNextScene({
      linkedSceneIdsInOrder: ["scene_001", "scene_002"],
      availableScenes: [],
      graphEdges: []
    });

    expect(result).toBeNull();
  });
});
