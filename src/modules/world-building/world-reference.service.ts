import { logError, logInfo, logWarn } from "../../lib/observability/console-logger";
import type { ChapterRepository } from "../chapters/chapter.types";
import type { WorldRepository } from "./world-layer.types";
import { chapterWorldContextQuerySchema } from "./world-reference.schema";
import type {
  ChapterWorldContextRecord,
  ChapterWorldContextScene,
  WorldReferenceResult
} from "./world-reference.types";

export class WorldReferenceService {
  constructor(
    private readonly chapterRepository: ChapterRepository,
    private readonly worldRepository: WorldRepository
  ) {}

  async getChapterWorldContext(payload: unknown): Promise<WorldReferenceResult<ChapterWorldContextRecord>> {
    const parsedPayload = chapterWorldContextQuerySchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Chapter world-context request is invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P13][WorldReference] Reference resolution starting", {
      chapterId: parsedPayload.data.chapterId
    }); // SAFETY_LOG:P13_REFERENCE_RESOLUTION_START

    try {
      const chapter = await this.chapterRepository.findChapterById(parsedPayload.data.chapterId);

      if (!chapter) {
        return {
          ok: false,
          error: {
            code: "CHAPTER_NOT_FOUND",
            message: "The chapter world context could not be loaded because the chapter was not found."
          }
        };
      }

      const chapterSceneLinks = await this.chapterRepository.listChapterSceneLinksByMilestoneId(chapter.milestoneId);
      const activeSceneLinks = chapterSceneLinks
        .filter((link) => link.chapterId === chapter.id)
        .sort((leftLink, rightLink) => leftLink.sortOrder - rightLink.sortOrder);
      const sceneIds = activeSceneLinks.map((link) => link.sceneId);
      const references = await this.worldRepository.listWorldReferencesBySceneIds(sceneIds);
      const referencesBySceneId = new Map<string, typeof references>();

      for (const reference of references) {
        const currentReferences = referencesBySceneId.get(reference.sceneId) ?? [];
        currentReferences.push(reference);
        referencesBySceneId.set(reference.sceneId, currentReferences);
      }

      const scenes: ChapterWorldContextScene[] = activeSceneLinks.map((link) => ({
        sceneId: link.sceneId,
        sceneOutline: link.sceneOutline,
        sceneSortOrder: link.sortOrder,
        nodes: referencesBySceneId.get(link.sceneId) ?? []
      }));
      const referencedNodeCount = references.length;

      if (referencedNodeCount === 0) {
        logWarn("[P13][WorldReference] Missing reference fallback returned", {
          chapterId: chapter.id,
          linkedSceneCount: activeSceneLinks.length
        }); // SAFETY_LOG:P13_MISSING_REFERENCE_FALLBACK
      }

      logInfo("[P13][WorldReference] Reference resolution completed", {
        chapterId: chapter.id,
        sceneCount: scenes.length,
        referencedNodeCount
      }); // SAFETY_LOG:P13_REFERENCE_RESOLUTION_SUCCESS

      return {
        ok: true,
        data: {
          chapterId: chapter.id,
          scenes,
          referencedNodeCount,
          emptyStateMessage:
            referencedNodeCount === 0
              ? "No world nodes are linked to this chapter's scenes yet."
              : null
        }
      };
    } catch (error) {
      logError("[P13][WorldReference] Returning safe fallback", {
        chapterId: parsedPayload.data.chapterId,
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P13_REFERENCE_RESOLUTION_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to load chapter world context right now."
        }
      };
    }
  }
}
