import { describe, expect, it, vi } from "vitest";

import { SceneService } from "../../src/modules/scenes/scene.service";
import type {
  CreateSceneInput,
  SceneMilestoneSummary,
  SceneRecord,
  SceneRepository,
  UpdateSceneInput
} from "../../src/modules/scenes/scene.types";

const milestoneSummary: SceneMilestoneSummary = {
  id: "milestone_123",
  title: "Conflict Escalation",
  volumeId: "volume_123"
};

function buildSceneRecord(input: CreateSceneInput, sceneId = "scene_123"): SceneRecord {
  return {
    id: sceneId,
    milestoneId: input.milestoneId,
    outline: input.outline,
    explanation: input.explanation,
    createdAt: new Date("2026-04-17T00:00:00.000Z"),
    updatedAt: new Date("2026-04-17T00:00:00.000Z")
  };
}

function createRepositoryDouble(overrides: Partial<SceneRepository> = {}): SceneRepository {
  return {
    findMilestoneById: async () => milestoneSummary,
    listScenesByMilestoneId: async () => [],
    findSceneById: async () =>
      buildSceneRecord({
        milestoneId: milestoneSummary.id,
        outline: "Initial outline",
        explanation: "Initial explanation"
      }),
    createScene: async (input: CreateSceneInput) => buildSceneRecord(input),
    updateScene: async (input: UpdateSceneInput) =>
      buildSceneRecord(
        {
          milestoneId: milestoneSummary.id,
          outline: input.outline,
          explanation: input.explanation
        },
        input.sceneId
      ),
    listGraphEdgesByMilestoneId: async () => [],
    findGraphEdgeByNodes: async () => null,
    createGraphEdge: async () => {
      throw new Error("Not implemented in scene service test double.");
    },
    ...overrides
  };
}

describe("SceneService", () => {
  it("creates a scene when the parent milestone exists", async () => {
    const repository = createRepositoryDouble({
      createScene: vi.fn(async (input: CreateSceneInput) => buildSceneRecord(input))
    });
    const service = new SceneService(repository);

    const result = await service.createScene({
      milestoneId: "milestone_123",
      outline: "  Ambush begins at the ravine.  ",
      explanation: "  The attackers spring the trap and isolate the lead group.  "
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.scene.outline).toBe("Ambush begins at the ravine.");
      expect(result.data.scene.explanation).toBe("The attackers spring the trap and isolate the lead group.");
      expect(result.data.milestone.id).toBe("milestone_123");
    }

    expect(repository.createScene).toHaveBeenCalledWith({
      milestoneId: "milestone_123",
      outline: "Ambush begins at the ravine.",
      explanation: "The attackers spring the trap and isolate the lead group."
    });
  });

  it("returns a validation error when the outline is missing", async () => {
    const service = new SceneService(createRepositoryDouble());

    const result = await service.createScene({
      milestoneId: "milestone_123",
      outline: "   ",
      explanation: "Attackers spring the trap."
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Scene details are invalid.",
        fieldErrors: {
          outline: ["Outline is required."]
        }
      }
    });
  });

  it("updates an existing scene", async () => {
    const repository = createRepositoryDouble({
      updateScene: vi.fn(async (input: UpdateSceneInput) =>
        buildSceneRecord(
          {
            milestoneId: milestoneSummary.id,
            outline: input.outline,
            explanation: input.explanation
          },
          input.sceneId
        )
      )
    });
    const service = new SceneService(repository);

    const result = await service.updateScene({
      sceneId: "scene_123",
      outline: "  Ambush intensifies.  ",
      explanation: "  The defenders break formation and lose their supply path.  "
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.scene.id).toBe("scene_123");
      expect(result.data.scene.outline).toBe("Ambush intensifies.");
      expect(result.data.scene.explanation).toBe("The defenders break formation and lose their supply path.");
    }

    expect(repository.updateScene).toHaveBeenCalledWith({
      sceneId: "scene_123",
      outline: "Ambush intensifies.",
      explanation: "The defenders break formation and lose their supply path."
    });
  });
});
