import { describe, expect, it, vi } from "vitest";

import { NovelService } from "../../src/modules/novels/novel.service";
import type { CreateNovelInput, NovelRecord, NovelRepository } from "../../src/modules/novels/novel.types";

function buildNovelRecord(input: CreateNovelInput): NovelRecord {
  return {
    id: "novel_123",
    title: input.title,
    description: input.description ?? null,
    createdAt: new Date("2026-04-17T00:00:00.000Z"),
    updatedAt: new Date("2026-04-17T00:00:00.000Z")
  };
}

function createRepositoryDouble(overrides: Partial<NovelRepository> = {}): NovelRepository {
  return {
    create: async (input: CreateNovelInput) => buildNovelRecord(input),
    ...overrides
  };
}

describe("NovelService", () => {
  it("creates a novel with validated payload data", async () => {
    const repository = createRepositoryDouble({
      create: vi.fn(async (input: CreateNovelInput) => buildNovelRecord(input))
    });
    const service = new NovelService(repository);

    const result = await service.createNovel({
      title: "  The Ember Trial  ",
      description: "  Book one root record.  "
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.title).toBe("The Ember Trial");
      expect(result.data.description).toBe("Book one root record.");
    }

    expect(repository.create).toHaveBeenCalledWith({
      title: "The Ember Trial",
      description: "Book one root record."
    });
  });

  it("returns a validation error when the title is missing", async () => {
    const repository = createRepositoryDouble();
    const service = new NovelService(repository);

    const result = await service.createNovel({
      title: "   ",
      description: "Invalid input"
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.fieldErrors?.title).toBeDefined();
    }
  });

  it("returns a persistence fallback when the repository throws", async () => {
    const repository = createRepositoryDouble({
      create: vi.fn(async () => {
        throw new Error("database unavailable");
      })
    });
    const service = new NovelService(repository);

    const result = await service.createNovel({
      title: "The Broken Save"
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "PERSISTENCE_ERROR",
        message: "Unable to create the novel right now."
      }
    });
  });
});
