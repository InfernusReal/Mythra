import { describe, expect, it } from "vitest";

import { MilestoneCompletionService } from "../../src/modules/milestones/milestone-completion.service";

describe("MilestoneCompletionService", () => {
  it("marks a milestone complete when all scenes are complete", () => {
    const service = new MilestoneCompletionService();

    const result = service.evaluateCompletion({
      sceneCount: 5,
      completedSceneCount: 5
    });

    expect(result).toEqual({
      sceneCount: 5,
      completedSceneCount: 5,
      status: "COMPLETE",
      canMarkComplete: true,
      blockedReason: null
    });
  });

  it("keeps a milestone incomplete when scenes remain unfinished", () => {
    const service = new MilestoneCompletionService();

    const result = service.evaluateCompletion({
      sceneCount: 5,
      completedSceneCount: 3
    });

    expect(result).toEqual({
      sceneCount: 5,
      completedSceneCount: 3,
      status: "INCOMPLETE",
      canMarkComplete: false,
      blockedReason: "All scenes must be complete before the milestone can be complete."
    });
  });

  it("keeps a milestone incomplete when no scenes exist yet", () => {
    const service = new MilestoneCompletionService();

    const result = service.evaluateCompletion({
      sceneCount: 0,
      completedSceneCount: 0
    });

    expect(result).toEqual({
      sceneCount: 0,
      completedSceneCount: 0,
      status: "INCOMPLETE",
      canMarkComplete: false,
      blockedReason: "All scenes must be complete before the milestone can be complete."
    });
  });
});
