import { describe, expect, it } from "vitest";

import { sanitizeDocFileName } from "../../src/lib/export/doc-exporter";
import {
  ChapterExportService,
  type ChapterExportRepository
} from "../../src/modules/chapters/chapter-export.service";
import {
  ChapterFormattingService,
  type ChapterFormattingRepository
} from "../../src/modules/chapters/chapter-formatting.service";
import type { ChapterRecord } from "../../src/modules/chapters/chapter.types";

const chapterRecord: ChapterRecord = {
  id: "chapter_123",
  milestoneId: "milestone_123",
  title: "Chapter Twelve: Ravine Ambush?",
  body: "The convoy entered the ravine.\n\nThe first horn sounded.",
  wordCount: 9,
  savedVersion: 2,
  maxWordCount: 3000,
  fontFamily: "Georgia",
  fontSize: 16,
  lineHeight: 1.7,
  createdAt: new Date("2026-04-26T00:00:00.000Z"),
  updatedAt: new Date("2026-04-26T00:00:00.000Z")
};

function createFormattingRepositoryDouble(options: {
  chapter?: ChapterRecord | null;
} = {}): ChapterFormattingRepository {
  const chapter = options.chapter === undefined ? { ...chapterRecord } : options.chapter;

  return {
    findChapterById: async () => chapter,
    updateChapterFormatting: async (input) => {
      if (!chapter) {
        throw new Error("CHAPTER_NOT_FOUND");
      }

      Object.assign(chapter, input.preferences);
      return chapter;
    }
  };
}

function createExportRepositoryDouble(options: {
  chapter?: ChapterRecord | null;
  throwOnFind?: boolean;
} = {}): ChapterExportRepository {
  const chapter = options.chapter === undefined ? { ...chapterRecord } : options.chapter;

  return {
    findChapterById: async () => {
      if (options.throwOnFind) {
        throw new Error("DATABASE_DOWN");
      }

      return chapter;
    }
  };
}

describe("ChapterFormattingService", () => {
  it("persists structured formatting preferences", async () => {
    const service = new ChapterFormattingService(createFormattingRepositoryDouble());

    const result = await service.updateChapterFormatting({
      chapterId: chapterRecord.id,
      fontFamily: "Lora",
      fontSize: 18,
      lineHeight: 1.8
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.preferences).toEqual({
        fontFamily: "Lora",
        fontSize: 18,
        lineHeight: 1.8
      });
      expect(result.data.chapter).toMatchObject({
        fontFamily: "Lora",
        fontSize: 18,
        lineHeight: 1.8
      });
    }
  });
});

describe("ChapterExportService", () => {
  it("exports a chapter as a sanitized Word-compatible doc payload", async () => {
    const service = new ChapterExportService(createExportRepositoryDouble());

    const result = await service.exportChapterAsDoc({
      chapterId: chapterRecord.id
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.fileName).toBe("Chapter-Twelve-Ravine-Ambush.doc");
      expect(result.data.contentType).toContain("application/msword");
      expect(result.data.body).toContain("<h1>Chapter Twelve: Ravine Ambush?</h1>");
      expect(result.data.body).toContain("<p>The convoy entered the ravine.</p>");
    }
  });

  it("sanitizes unsafe export filenames", () => {
    expect(sanitizeDocFileName("  Chapter <> 12 / Final?  ")).toBe("Chapter-12-Final.doc");
  });

  it("returns a safe fallback when export generation fails", async () => {
    const service = new ChapterExportService(
      createExportRepositoryDouble({
        throwOnFind: true
      })
    );

    const result = await service.exportChapterAsDoc({
      chapterId: chapterRecord.id
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "PERSISTENCE_ERROR",
        message: "Unable to export this chapter right now."
      }
    });
  });
});
