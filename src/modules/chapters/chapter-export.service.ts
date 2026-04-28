import { logError, logInfo } from "../../lib/observability/console-logger";
import { createDocExportPayload, type DocExportPayload } from "../../lib/export/doc-exporter";
import { normalizeChapterFormatting } from "./chapter-formatting.service";
import { chapterEditorQuerySchema } from "./chapter.schema";
import type { ChapterRecord, ChapterResult } from "./chapter.types";

export interface ChapterExportRepository {
  findChapterById(chapterId: string): Promise<ChapterRecord | null>;
}

export class ChapterExportService {
  constructor(private readonly repository: ChapterExportRepository) {}

  async exportChapterAsDoc(payload: unknown): Promise<ChapterResult<DocExportPayload>> {
    const parsedPayload = chapterEditorQuerySchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Chapter export request is invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P14][ChapterExport] Export request received", {
      chapterId: parsedPayload.data.chapterId
    }); // SAFETY_LOG:P14_EXPORT_REQUEST

    try {
      const chapter = await this.repository.findChapterById(parsedPayload.data.chapterId);

      if (!chapter) {
        return {
          ok: false,
          error: {
            code: "CHAPTER_NOT_FOUND",
            message: "The chapter could not be found for export."
          }
        };
      }

      const preferences = normalizeChapterFormatting(chapter);

      logInfo("[P14][ChapterExport] Document generation starting", {
        chapterId: chapter.id,
        titleLength: chapter.title.length,
        wordCount: chapter.wordCount
      }); // SAFETY_LOG:P14_DOCUMENT_GENERATION_START

      const exportPayload = createDocExportPayload({
        title: chapter.title,
        body: chapter.body,
        preferences
      });

      logInfo("[P14][ChapterExport] Document generation succeeded", {
        chapterId: chapter.id,
        fileName: exportPayload.fileName
      }); // SAFETY_LOG:P14_DOCUMENT_GENERATION_SUCCESS

      return {
        ok: true,
        data: exportPayload
      };
    } catch (error) {
      logError("[P14][ChapterExport] Download-safe fallback returned", {
        chapterId: parsedPayload.data.chapterId,
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P14_DOWNLOAD_SAFE_ERROR_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to export this chapter right now."
        }
      };
    }
  }
}
