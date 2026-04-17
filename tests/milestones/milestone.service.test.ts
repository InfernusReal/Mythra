import { describe, expect, it, vi } from "vitest";

import { MilestoneService } from "../../src/modules/milestones/milestone.service";
import type {
  CreateMilestoneInput,
  MilestoneDetailRecord,
  MilestoneRecord,
  MilestoneRepository,
  VolumeSummary
} from "../../src/modules/milestones/milestone.types";

const volumeSummary: VolumeSummary = {
  id: "volume_123",
  title: "Volume One"
};

function buildMilestoneRecord(input: CreateMilestoneInput): MilestoneRecord {
  return {
    id: "milestone_123",
    volumeId: input.volumeId,
    title: input.title,
    summary: input.summary ?? null,
    createdAt: new Date("2026-04-17T00:00:00.000Z"),
    updatedAt: new Date("2026-04-17T00:00:00.000Z")
  };
}

function buildMilestoneDetail(input: CreateMilestoneInput): MilestoneDetailRecord {
  return {
    volume: volumeSummary,
    milestone: buildMilestoneRecord(input)
  };
}

function createRepositoryDouble(overrides: Partial<MilestoneRepository> = {}): MilestoneRepository {
  return {
    findVolumeById: async () => volumeSummary,
    listByVolumeId: async () => [],
    create: async (input: CreateMilestoneInput) => buildMilestoneRecord(input),
    findMilestoneDetailById: async () =>
      buildMilestoneDetail({
        volumeId: volumeSummary.id,
        title: "Milestone One",
        summary: "Conflict enters the volume."
      }),
    ...overrides
  };
}

describe("MilestoneService", () => {
  it("creates a milestone when the parent volume exists", async () => {
    const repository = createRepositoryDouble({
      create: vi.fn(async (input: CreateMilestoneInput) => buildMilestoneRecord(input))
    });
    const service = new MilestoneService(repository);

    const result = await service.createMilestone({
      volumeId: "volume_123",
      title: "  Inciting Turn  ",
      summary: "  First major shift.  "
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.volume.id).toBe("volume_123");
      expect(result.data.milestone.title).toBe("Inciting Turn");
      expect(result.data.milestone.summary).toBe("First major shift.");
    }

    expect(repository.create).toHaveBeenCalledWith({
      volumeId: "volume_123",
      title: "Inciting Turn",
      summary: "First major shift."
    });
  });

  it("returns a volume not found error when the parent volume is missing", async () => {
    const repository = createRepositoryDouble({
      findVolumeById: vi.fn(async () => null)
    });
    const service = new MilestoneService(repository);

    const result = await service.createMilestone({
      volumeId: "missing_volume",
      title: "Milestone Zero"
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "VOLUME_NOT_FOUND",
        message: "The parent volume could not be found."
      }
    });
  });

  it("returns a milestone graph collection for a valid volume", async () => {
    const repository = createRepositoryDouble({
      listByVolumeId: vi.fn(async () => [
        buildMilestoneRecord({
          volumeId: "volume_123",
          title: "Milestone One",
          summary: "Conflict enters the volume."
        })
      ])
    });
    const service = new MilestoneService(repository);

    const result = await service.getVolumeMilestones({
      volumeId: "volume_123"
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.volume.title).toBe("Volume One");
      expect(result.data.milestones).toHaveLength(1);
    }
  });

  it("returns milestone detail for navigation when the milestone exists", async () => {
    const repository = createRepositoryDouble();
    const service = new MilestoneService(repository);

    const result = await service.getMilestoneDetail({
      milestoneId: "milestone_123"
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.milestone.title).toBe("Milestone One");
      expect(result.data.volume.id).toBe("volume_123");
    }
  });
});
