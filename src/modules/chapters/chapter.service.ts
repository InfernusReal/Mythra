import { logError, logInfo } from "../../lib/observability/console-logger";
import { chapterMilestoneQuerySchema, createChapterSchema } from "./chapter.schema";
import type {
  ChapterDetailRecord,
  ChapterRepository,
  ChapterResult,
  ChapterWorkspaceRecord
} from "./chapter.types";

export class ChapterService {
  constructor(private readonly repository: ChapterRepository) {}

  async getMilestoneChapterWorkspace(payload: unknown): Promise<ChapterResult<ChapterWorkspaceRecord>> {
    const parsedPayload = chapterMilestoneQuerySchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Milestone id is invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    const milestone = await this.repository.findMilestoneById(parsedPayload.data.milestoneId);

    if (!milestone) {
      return {
        ok: false,
        error: {
          code: "MILESTONE_NOT_FOUND",
          message: "The parent milestone could not be found."
        }
      };
    }

    const [chapters, availableScenes, chapterSceneLinks] = await Promise.all([
      this.repository.listChaptersByMilestoneId(parsedPayload.data.milestoneId),
      this.repository.listScenesByMilestoneId(parsedPayload.data.milestoneId),
      this.repository.listChapterSceneLinksByMilestoneId(parsedPayload.data.milestoneId)
    ]);

    return {
      ok: true,
      data: {
        milestone,
        chapters,
        availableScenes,
        chapterSceneLinks
      }
    };
  }

  async createChapter(payload: unknown): Promise<ChapterResult<ChapterDetailRecord>> {
    logInfo("[P06][ChapterCreate] Starting service flow", {
      hasPayload: payload !== null && payload !== undefined
    }); // SAFETY_LOG:P06_CHAPTER_CREATE_START

    const parsedPayload = createChapterSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Chapter details are invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P06][ChapterCreate] Metadata validation passed", {
      milestoneId: parsedPayload.data.milestoneId,
      titleLength: parsedPayload.data.title.length
    }); // SAFETY_LOG:P06_CHAPTER_METADATA_VALIDATION

    const milestone = await this.repository.findMilestoneById(parsedPayload.data.milestoneId);

    if (!milestone) {
      return {
        ok: false,
        error: {
          code: "MILESTONE_NOT_FOUND",
          message: "The parent milestone could not be found."
        }
      };
    }

    try {
      // Section: Create chapters inside a repository-owned transaction boundary
      const chapter = await this.repository.runInTransaction(async (transaction) => {
        const chapterCount = await transaction.countChaptersByMilestoneId(parsedPayload.data.milestoneId);

        if (
          milestone.maxChaptersPerMilestone !== null &&
          chapterCount >= milestone.maxChaptersPerMilestone
        ) {
          throw new Error("CHAPTER_LIMIT_REACHED");
        }

        return transaction.createChapter(parsedPayload.data);
      });

      logInfo("[P06][ChapterCreate] Success response prepared", {
        chapterId: chapter.id,
        milestoneId: chapter.milestoneId
      }); // SAFETY_LOG:P06_CHAPTER_CREATE_SUCCESS

      return {
        ok: true,
        data: {
          milestone,
          chapter
        }
      };
    } catch (error) {
      if (error instanceof Error && error.message === "CHAPTER_LIMIT_REACHED") {
        return {
          ok: false,
          error: {
            code: "CHAPTER_LIMIT_REACHED",
            message: "The milestone chapter cap has already been reached."
          }
        };
      }

      logError("[P06][ChapterCreate] Returning transaction fallback", {
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P06_CHAPTER_TRANSACTION_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to create the chapter right now."
        }
      };
    }
  }
}
