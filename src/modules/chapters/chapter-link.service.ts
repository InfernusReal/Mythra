import { logError, logInfo, logWarn } from "../../lib/observability/console-logger";
import { linkScenesToChapterSchema } from "./chapter.schema";
import type {
  ChapterRepository,
  ChapterResult,
  ChapterWorkspaceRecord
} from "./chapter.types";

export class ChapterLinkService {
  constructor(private readonly repository: ChapterRepository) {}

  async linkScenesToChapter(payload: unknown): Promise<ChapterResult<ChapterWorkspaceRecord>> {
    const parsedPayload = linkScenesToChapterSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Chapter scene link details are invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P06][ChapterLink] Scene link resolution starting", {
      chapterId: parsedPayload.data.chapterId,
      sceneCount: parsedPayload.data.sceneIds.length
    }); // SAFETY_LOG:P06_SCENE_LINK_RESOLUTION

    try {
      // Section: Resolve chapter and scene ownership inside one repository transaction
      const milestoneId = await this.repository.runInTransaction(async (transaction) => {
        const chapter = await transaction.findChapterById(parsedPayload.data.chapterId);

        if (!chapter) {
          throw new Error("CHAPTER_NOT_FOUND");
        }

        const scenes = await transaction.listScenesByMilestoneId(chapter.milestoneId);
        const sceneMap = new Map(scenes.map((scene) => [scene.id, scene]));

        for (const sceneId of parsedPayload.data.sceneIds) {
          if (!sceneMap.has(sceneId)) {
            throw new Error("SCENE_NOT_FOUND");
          }

          const existingLink = await transaction.findChapterSceneLink(chapter.id, sceneId);

          if (existingLink) {
            logWarn("[P06][ChapterLink] Duplicate link prevented", {
              chapterId: chapter.id,
              sceneId
            }); // SAFETY_LOG:P06_CHAPTER_DUPLICATE_LINK_PREVENTION

            throw new Error("DUPLICATE_SCENE_LINK");
          }
        }

        await transaction.createChapterSceneLinks(chapter.id, parsedPayload.data.sceneIds);
        return chapter.milestoneId;
      });

      const workspace = await this.repository.findMilestoneById(milestoneId);

      if (!workspace) {
        return {
          ok: false,
          error: {
            code: "MILESTONE_NOT_FOUND",
            message: "The parent milestone could not be found."
          }
        };
      }

      const [chapters, availableScenes, chapterSceneLinks] = await Promise.all([
        this.repository.listChaptersByMilestoneId(milestoneId),
        this.repository.listScenesByMilestoneId(milestoneId),
        this.repository.listChapterSceneLinksByMilestoneId(milestoneId)
      ]);

      logInfo("[P06][ChapterLink] Scene link transaction committed", {
        chapterId: parsedPayload.data.chapterId,
        sceneCount: parsedPayload.data.sceneIds.length
      }); // SAFETY_LOG:P06_CHAPTER_LINK_SUCCESS

      return {
        ok: true,
        data: {
          milestone: workspace,
          chapters,
          availableScenes,
          chapterSceneLinks
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

        if (error.message === "SCENE_NOT_FOUND") {
          return {
            ok: false,
            error: {
              code: "SCENE_NOT_FOUND",
              message: "All selected scenes must belong to the chapter milestone."
            }
          };
        }

        if (error.message === "DUPLICATE_SCENE_LINK") {
          return {
            ok: false,
            error: {
              code: "DUPLICATE_SCENE_LINK",
              message: "One or more selected scenes are already linked to this chapter."
            }
          };
        }
      }

      logError("[P06][ChapterLink] Returning transaction fallback", {
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P06_CHAPTER_LINK_TRANSACTION_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to link scenes to the chapter right now."
        }
      };
    }
  }
}
