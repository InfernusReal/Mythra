import { evaluateSaveConflict } from "../../lib/guards/save-conflict";
import { logError, logInfo, logWarn } from "../../lib/observability/console-logger";
import { saveChapterDraftSchema } from "./chapter.schema";
import { ChapterGuardrailsService } from "./chapter-guardrails.service";
import type { ChapterRecord, ChapterRepository, ChapterResult } from "./chapter.types";

export type ChapterSaveMode = "AUTO" | "MANUAL";

export type ChapterSaveRecord = {
  chapter: ChapterRecord;
  saveMode: ChapterSaveMode;
  saveState: "SAVED";
  savedAt: string;
  wordCount: number;
  maxWordCount: number;
  remainingWords: number;
};

export class ChapterSaveService {
  constructor(
    private readonly repository: ChapterRepository,
    private readonly guardrailsService: ChapterGuardrailsService
  ) {}

  async saveChapterDraft(payload: unknown): Promise<ChapterResult<ChapterSaveRecord>> {
    const parsedPayload = saveChapterDraftSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Chapter save details are invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    if (parsedPayload.data.saveMode === "AUTO") {
      logInfo("[P09][ChapterSave] Autosave triggered", {
        chapterId: parsedPayload.data.chapterId
      }); // SAFETY_LOG:P09_AUTOSAVE_TRIGGER
    } else {
      logInfo("[P09][ChapterSave] Manual save triggered", {
        chapterId: parsedPayload.data.chapterId
      }); // SAFETY_LOG:P09_MANUAL_SAVE_TRIGGER
    }

    try {
      const saveRecord = await this.repository.runInTransaction(async (transaction) => {
        const chapter = await transaction.findChapterById(parsedPayload.data.chapterId);

        if (!chapter) {
          throw new Error("CHAPTER_NOT_FOUND");
        }

        const guardrailRecord = this.guardrailsService.evaluateDraft({
          body: parsedPayload.data.body,
          maxWordCount: chapter.maxWordCount
        });

        logInfo("[P09][ChapterSave] Current word count evaluated", {
          chapterId: chapter.id,
          wordCount: guardrailRecord.wordCount,
          maxWordCount: guardrailRecord.maxWordCount
        }); // SAFETY_LOG:P09_CURRENT_WORD_COUNT

        if (guardrailRecord.isOverLimit) {
          logWarn("[P09][ChapterSave] Word limit threshold breached", {
            chapterId: chapter.id,
            wordCount: guardrailRecord.wordCount,
            maxWordCount: guardrailRecord.maxWordCount
          }); // SAFETY_LOG:P09_THRESHOLD_BREACH

          throw new Error("WORD_LIMIT_REACHED");
        }

        const conflictEvaluation = evaluateSaveConflict({
          expectedSavedVersion: parsedPayload.data.expectedSavedVersion,
          currentSavedVersion: chapter.savedVersion
        });

        if (conflictEvaluation.hasConflict) {
          logWarn("[P09][ChapterSave] Stale write blocked", {
            chapterId: chapter.id,
            expectedSavedVersion: parsedPayload.data.expectedSavedVersion,
            currentSavedVersion: chapter.savedVersion
          }); // SAFETY_LOG:P09_STALE_WRITE_BLOCK

          throw new Error("SAVE_CONFLICT");
        }

        const savedChapter = await transaction.updateChapterDraft({
          chapterId: chapter.id,
          body: parsedPayload.data.body,
          wordCount: guardrailRecord.wordCount,
          savedVersion: chapter.savedVersion + 1
        });

        return {
          chapter: savedChapter,
          guardrailRecord
        };
      });

      logInfo("[P09][ChapterSave] Save state transitioned", {
        chapterId: saveRecord.chapter.id,
        saveMode: parsedPayload.data.saveMode,
        savedVersion: saveRecord.chapter.savedVersion
      }); // SAFETY_LOG:P09_SAVE_STATE_TRANSITION

      return {
        ok: true,
        data: {
          chapter: saveRecord.chapter,
          saveMode: parsedPayload.data.saveMode,
          saveState: "SAVED",
          savedAt: saveRecord.chapter.updatedAt.toISOString(),
          wordCount: saveRecord.guardrailRecord.wordCount,
          maxWordCount: saveRecord.guardrailRecord.maxWordCount,
          remainingWords: saveRecord.guardrailRecord.remainingWords
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "CHAPTER_NOT_FOUND") {
          return {
            ok: false,
            error: {
              code: "CHAPTER_NOT_FOUND",
              message: "The chapter could not be found."
            }
          };
        }

        if (error.message === "WORD_LIMIT_REACHED") {
          const chapter = await this.repository.findChapterById(parsedPayload.data.chapterId);
          const guardrailRecord = this.guardrailsService.evaluateDraft({
            body: parsedPayload.data.body,
            maxWordCount: chapter?.maxWordCount
          });

          return {
            ok: false,
            error: {
              code: "WORD_LIMIT_REACHED",
              message: `This chapter reached the hard limit of ${guardrailRecord.maxWordCount} words.`,
              details: {
                wordCount: guardrailRecord.wordCount,
                maxWordCount: guardrailRecord.maxWordCount,
                remainingWords: guardrailRecord.remainingWords
              }
            }
          };
        }

        if (error.message === "SAVE_CONFLICT") {
          const chapter = await this.repository.findChapterById(parsedPayload.data.chapterId);

          return {
            ok: false,
            error: {
              code: "SAVE_CONFLICT",
              message: "A newer server draft exists. Local draft was preserved for recovery.",
              details: {
                currentSavedVersion: chapter?.savedVersion ?? parsedPayload.data.expectedSavedVersion,
                serverBody: chapter?.body ?? "",
                updatedAt: chapter?.updatedAt.toISOString() ?? null
              }
            }
          };
        }
      }

      logError("[P09][ChapterSave] Local draft fallback requested", {
        chapterId: parsedPayload.data.chapterId,
        saveMode: parsedPayload.data.saveMode,
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P09_LOCAL_DRAFT_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to save the chapter right now. The local draft should be preserved."
        }
      };
    }
  }
}
