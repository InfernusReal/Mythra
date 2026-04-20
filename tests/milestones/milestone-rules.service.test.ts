import { describe, expect, it } from "vitest";

import { MilestoneCompletionService } from "../../src/modules/milestones/milestone-completion.service";
import { PrismaMilestoneRepository } from "../../src/modules/milestones/milestone.repository";
import { MilestoneRulesService } from "../../src/modules/milestones/milestone-rules.service";
import type { MilestoneRecord, MilestoneRepository, VolumeSummary } from "../../src/modules/milestones/milestone.types";

const volumeSummary: VolumeSummary = {
  id: "volume_123",
  title: "Volume One"
};

const milestoneRecord: MilestoneRecord = {
  id: "milestone_123",
  volumeId: volumeSummary.id,
  title: "Conflict Escalation",
  summary: "Pressure rises inside the volume.",
  maxChaptersPerMilestone: 3,
  createdAt: new Date("2026-04-17T00:00:00.000Z"),
  updatedAt: new Date("2026-04-17T00:00:00.000Z")
};

function createRepositoryDouble(overrides: Partial<MilestoneRepository> = {}): MilestoneRepository {
  return {
    findVolumeById: async () => volumeSummary,
    listByVolumeId: async () => [milestoneRecord],
    create: async () => milestoneRecord,
    findMilestoneDetailById: async () => ({
      volume: volumeSummary,
      milestone: milestoneRecord
    }),
    findMilestoneById: async () => milestoneRecord,
    ...overrides
  };
}

describe("MilestoneRulesService", () => {
  it("allows a chapter transition that stays within the chapter cap", async () => {
    const service = new MilestoneRulesService(createRepositoryDouble(), new MilestoneCompletionService());

    const result = await service.evaluateRules("milestone_123", {
      existingChapterCount: 2,
      proposedChapterCount: 3,
      sceneCount: 4,
      completedSceneCount: 4
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.chapterRule.canProceed).toBe(true);
      expect(result.data.chapterRule.blockedReason).toBeNull();
      expect(result.data.completion.status).toBe("COMPLETE");
    }
  });

  it("blocks a chapter transition that would exceed the cap", async () => {
    const service = new MilestoneRulesService(createRepositoryDouble(), new MilestoneCompletionService());

    const result = await service.evaluateRules("milestone_123", {
      existingChapterCount: 3,
      proposedChapterCount: 4,
      sceneCount: 4,
      completedSceneCount: 3
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.chapterRule.canProceed).toBe(false);
      expect(result.data.chapterRule.blockedReason).toBe("The milestone chapter cap would be exceeded.");
      expect(result.data.completion.status).toBe("INCOMPLETE");
    }
  });

  it("returns not found when the milestone does not exist", async () => {
    const service = new MilestoneRulesService(
      createRepositoryDouble({
        findMilestoneById: async () => null
      }),
      new MilestoneCompletionService()
    );

    const result = await service.evaluateRules("missing_milestone", {
      existingChapterCount: 0,
      sceneCount: 0,
      completedSceneCount: 0
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "MILESTONE_NOT_FOUND",
        message: "The milestone rule target could not be found."
      }
    });
  });
});
