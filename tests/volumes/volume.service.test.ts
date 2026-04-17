import { describe, expect, it, vi } from "vitest";

import { VolumeService } from "../../src/modules/volumes/volume.service";
import type {
  CreateVolumeInput,
  NovelSummary,
  VolumeRecord,
  VolumeRepository,
  VolumeWorkspaceRecord
} from "../../src/modules/volumes/volume.types";

const novelSummary: NovelSummary = {
  id: "novel_123",
  title: "The Ember Trial"
};

function buildVolumeRecord(input: CreateVolumeInput): VolumeRecord {
  return {
    id: "volume_123",
    novelId: input.novelId,
    title: input.title,
    description: input.description ?? null,
    createdAt: new Date("2026-04-17T00:00:00.000Z"),
    updatedAt: new Date("2026-04-17T00:00:00.000Z")
  };
}

function buildWorkspaceRecord(input: CreateVolumeInput): VolumeWorkspaceRecord {
  return {
    novel: novelSummary,
    volume: buildVolumeRecord(input)
  };
}

function createRepositoryDouble(overrides: Partial<VolumeRepository> = {}): VolumeRepository {
  return {
    findNovelById: async () => novelSummary,
    listByNovelId: async () => [],
    create: async (input: CreateVolumeInput) => buildVolumeRecord(input),
    findVolumeWorkspaceById: async (volumeId: string) =>
      buildWorkspaceRecord({
        novelId: novelSummary.id,
        title: `Volume ${volumeId}`,
        description: "Workspace shell"
      }),
    ...overrides
  };
}

describe("VolumeService", () => {
  it("creates a volume when the parent novel exists", async () => {
    const repository = createRepositoryDouble({
      create: vi.fn(async (input: CreateVolumeInput) => buildVolumeRecord(input))
    });
    const service = new VolumeService(repository);

    const result = await service.createVolume({
      novelId: "novel_123",
      title: "  Volume One  ",
      description: "  Opening arc.  "
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.novel.id).toBe("novel_123");
      expect(result.data.volume.title).toBe("Volume One");
      expect(result.data.volume.description).toBe("Opening arc.");
    }

    expect(repository.create).toHaveBeenCalledWith({
      novelId: "novel_123",
      title: "Volume One",
      description: "Opening arc."
    });
  });

  it("returns a missing-parent error when the novel does not exist", async () => {
    const repository = createRepositoryDouble({
      findNovelById: vi.fn(async () => null)
    });
    const service = new VolumeService(repository);

    const result = await service.createVolume({
      novelId: "missing_novel",
      title: "Volume Zero"
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "NOVEL_NOT_FOUND",
        message: "The parent novel could not be found."
      }
    });
  });

  it("returns a novel-scoped collection for a valid parent novel", async () => {
    const repository = createRepositoryDouble({
      listByNovelId: vi.fn(async () => [
        buildVolumeRecord({
          novelId: "novel_123",
          title: "Volume One",
          description: "Opening arc."
        })
      ])
    });
    const service = new VolumeService(repository);

    const result = await service.getNovelVolumes({
      novelId: "novel_123"
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.novel.title).toBe("The Ember Trial");
      expect(result.data.volumes).toHaveLength(1);
    }
  });

  it("returns the volume workspace shell data for a valid volume", async () => {
    const repository = createRepositoryDouble();
    const service = new VolumeService(repository);

    const result = await service.getVolumeWorkspace({
      volumeId: "volume_123"
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.novel.title).toBe("The Ember Trial");
      expect(result.data.volume.id).toBe("volume_123");
    }
  });
});
