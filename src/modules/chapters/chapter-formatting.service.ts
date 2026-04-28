import { logError, logInfo } from "../../lib/observability/console-logger";
import { chapterFormattingSchema } from "./chapter.schema";
import type { ChapterRecord, ChapterResult } from "./chapter.types";

export type ChapterFormattingPreferences = {
  fontFamily: "Georgia" | "Merriweather" | "Lora" | "Source Serif 4";
  fontSize: number;
  lineHeight: number;
};

export type ChapterFormattingRecord = {
  chapter: ChapterRecord;
  preferences: ChapterFormattingPreferences;
};

export interface ChapterFormattingRepository {
  findChapterById(chapterId: string): Promise<ChapterRecord | null>;
  updateChapterFormatting(input: {
    chapterId: string;
    preferences: ChapterFormattingPreferences;
  }): Promise<ChapterRecord>;
}

export const DEFAULT_CHAPTER_FORMATTING: ChapterFormattingPreferences = {
  fontFamily: "Georgia",
  fontSize: 16,
  lineHeight: 1.7
};

export function normalizeChapterFormatting(chapter: ChapterRecord | null): ChapterFormattingPreferences {
  if (!chapter) {
    return DEFAULT_CHAPTER_FORMATTING;
  }

  return {
    fontFamily: resolveFontFamily(chapter.fontFamily),
    fontSize: chapter.fontSize ?? DEFAULT_CHAPTER_FORMATTING.fontSize,
    lineHeight: chapter.lineHeight ?? DEFAULT_CHAPTER_FORMATTING.lineHeight
  };
}

function resolveFontFamily(fontFamily: string | undefined): ChapterFormattingPreferences["fontFamily"] {
  const allowedFonts: ChapterFormattingPreferences["fontFamily"][] = [
    "Georgia",
    "Merriweather",
    "Lora",
    "Source Serif 4"
  ];

  return allowedFonts.includes(fontFamily as ChapterFormattingPreferences["fontFamily"])
    ? (fontFamily as ChapterFormattingPreferences["fontFamily"])
    : DEFAULT_CHAPTER_FORMATTING.fontFamily;
}

export class ChapterFormattingService {
  constructor(private readonly repository: ChapterFormattingRepository) {}

  async updateChapterFormatting(payload: unknown): Promise<ChapterResult<ChapterFormattingRecord>> {
    const parsedPayload = chapterFormattingSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Chapter formatting details are invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P14][ChapterFormatting] Formatting payload normalized", {
      chapterId: parsedPayload.data.chapterId,
      fontFamily: parsedPayload.data.fontFamily,
      fontSize: parsedPayload.data.fontSize,
      lineHeight: parsedPayload.data.lineHeight
    }); // SAFETY_LOG:P14_FORMATTING_PAYLOAD_NORMALIZE

    try {
      const chapter = await this.repository.findChapterById(parsedPayload.data.chapterId);

      if (!chapter) {
        return {
          ok: false,
          error: {
            code: "CHAPTER_NOT_FOUND",
            message: "The chapter formatting preferences could not be saved because the chapter was not found."
          }
        };
      }

      const preferences: ChapterFormattingPreferences = {
        fontFamily: parsedPayload.data.fontFamily,
        fontSize: parsedPayload.data.fontSize,
        lineHeight: parsedPayload.data.lineHeight
      };
      const updatedChapter = await this.repository.updateChapterFormatting({
        chapterId: chapter.id,
        preferences
      });

      return {
        ok: true,
        data: {
          chapter: updatedChapter,
          preferences
        }
      };
    } catch (error) {
      logError("[P14][ChapterFormatting] Formatting-safe fallback returned", {
        chapterId: parsedPayload.data.chapterId,
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P14_FORMATTING_SAFE_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to save chapter formatting right now."
        }
      };
    }
  }
}
