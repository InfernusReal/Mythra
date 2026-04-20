import { logError, logInfo, logWarn } from "../../lib/observability/console-logger";
import { evaluateWordLimit } from "../../lib/guards/word-limit";
import { chapterEditorQuerySchema, chapterStructureCommandSchema } from "./chapter.schema";
import type {
  ChapterRepository,
  ChapterResult,
  ChapterSceneSummary
} from "./chapter.types";
import type {
  ChapterEditorRecord,
  ChapterEditorResult,
  ChapterEditorSceneItem,
  ChapterQuickReferenceItem
} from "./chapter-editor.types";

function buildSceneMarkers(sortOrder: number, outline: string) {
  const markerLabel = `${sortOrder.toString().padStart(2, "0")} ${outline}`;

  return {
    startMarker: `[[SCENE_START:${markerLabel}]]`,
    endMarker: `[[SCENE_END:${markerLabel}]]`
  };
}

export function createReadonlyChapterEditorFallback(statusMessage: string): ChapterEditorRecord {
  return {
    chapter: null,
    milestone: null,
    editorMode: "READ_ONLY",
    statusMessage,
    draftTemplate: "",
    savedVersion: 0,
    wordCount: 0,
    maxWordCount: 0,
    remainingWords: 0,
    lastSavedAt: null,
    sceneStack: [],
    availableScenes: [],
    quickReferences: [],
    outlineAutoOpenSceneIds: []
  };
}

export class ChapterEditorService {
  constructor(private readonly repository: ChapterRepository) {}

  async getChapterEditorWorkspace(payload: unknown): Promise<ChapterEditorResult> {
    const parsedPayload = chapterEditorQuerySchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Chapter editor details are invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P08][ChapterEditor] Chapter load starting", {
      chapterId: parsedPayload.data.chapterId
    }); // SAFETY_LOG:P08_CHAPTER_LOAD

    try {
      const chapter = await this.repository.findChapterById(parsedPayload.data.chapterId);

      if (!chapter) {
        return {
          ok: false,
          error: {
            code: "CHAPTER_NOT_FOUND",
            message: "The chapter editor could not be loaded because the chapter was not found."
          }
        };
      }

      const [milestone, availableScenes, chapterSceneLinks] = await Promise.all([
        this.repository.findMilestoneById(chapter.milestoneId),
        this.repository.listScenesByMilestoneId(chapter.milestoneId),
        this.repository.listChapterSceneLinksByMilestoneId(chapter.milestoneId)
      ]);

      if (!milestone) {
        return {
          ok: false,
          error: {
            code: "MILESTONE_NOT_FOUND",
            message: "The parent milestone could not be found."
          }
        };
      }

      const record = this.buildEditorRecord({
        chapter,
        milestone,
        availableScenes,
        chapterSceneLinks
      });

      logInfo("[P08][ChapterEditor] Scene stack hydrated", {
        chapterId: chapter.id,
        linkedSceneCount: record.sceneStack.length
      }); // SAFETY_LOG:P08_SCENE_STACK_HYDRATE

      logInfo("[P08][ChapterEditor] Quick references hydrated", {
        chapterId: chapter.id,
        referenceCount: record.quickReferences.length
      }); // SAFETY_LOG:P08_QUICK_REFERENCE_HYDRATE

      logInfo("[P08][ChapterEditor] Connected outlines auto-opened", {
        chapterId: chapter.id,
        autoOpenSceneIds: record.outlineAutoOpenSceneIds
      }); // SAFETY_LOG:P08_OUTLINE_AUTO_OPEN

      return {
        ok: true,
        data: record
      };
    } catch (error) {
      logError("[P08][ChapterEditor] Readonly fallback returned", {
        chapterId: parsedPayload.data.chapterId,
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P08_EDITOR_SAFE_READONLY_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "The chapter editor is temporarily unavailable. A safe read-only fallback was used."
        }
      };
    }
  }

  async addSceneToChapter(payload: unknown): Promise<ChapterResult<ChapterEditorRecord>> {
    const parsedPayload = chapterStructureCommandSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "The chapter structure command is invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P08][ChapterEditor] Structure command executing", {
      chapterId: parsedPayload.data.chapterId,
      sceneId: parsedPayload.data.sceneId,
      command: "ADD_SCENE"
    }); // SAFETY_LOG:P08_STRUCTURE_COMMAND_EXECUTION

    try {
      await this.repository.runInTransaction(async (transaction) => {
        const chapter = await transaction.findChapterById(parsedPayload.data.chapterId);

        if (!chapter) {
          throw new Error("CHAPTER_NOT_FOUND");
        }

        const scenes = await transaction.listScenesByMilestoneId(chapter.milestoneId);
        const targetScene = scenes.find((scene) => scene.id === parsedPayload.data.sceneId);

        if (!targetScene) {
          throw new Error("SCENE_NOT_FOUND");
        }

        const existingLink = await transaction.findChapterSceneLink(chapter.id, targetScene.id);

        if (existingLink) {
          throw new Error("DUPLICATE_SCENE_LINK");
        }

        await transaction.createChapterSceneLinks(chapter.id, [targetScene.id]);
      });

      return this.getChapterEditorWorkspace({
        chapterId: parsedPayload.data.chapterId
      });
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
              message: "The selected scene must belong to the chapter milestone."
            }
          };
        }

        if (error.message === "DUPLICATE_SCENE_LINK") {
          return {
            ok: false,
            error: {
              code: "DUPLICATE_SCENE_LINK",
              message: "The selected scene is already linked to this chapter."
            }
          };
        }
      }

      logError("[P08][ChapterEditor] Readonly fallback returned", {
        chapterId: parsedPayload.data.chapterId,
        sceneId: parsedPayload.data.sceneId,
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P08_EDITOR_SAFE_READONLY_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to update the chapter structure right now."
        }
      };
    }
  }

  async removeSceneFromChapter(payload: unknown): Promise<ChapterResult<ChapterEditorRecord>> {
    const parsedPayload = chapterStructureCommandSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "The chapter structure command is invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P08][ChapterEditor] Structure command executing", {
      chapterId: parsedPayload.data.chapterId,
      sceneId: parsedPayload.data.sceneId,
      command: "REMOVE_SCENE"
    }); // SAFETY_LOG:P08_STRUCTURE_COMMAND_EXECUTION

    try {
      await this.repository.runInTransaction(async (transaction) => {
        const chapter = await transaction.findChapterById(parsedPayload.data.chapterId);

        if (!chapter) {
          throw new Error("CHAPTER_NOT_FOUND");
        }

        const existingLink = await transaction.findChapterSceneLink(chapter.id, parsedPayload.data.sceneId);

        if (!existingLink) {
          logWarn("[P08][ChapterEditor] Linked scene not found during remove", {
            chapterId: parsedPayload.data.chapterId,
            sceneId: parsedPayload.data.sceneId
          }); // SAFETY_LOG:P08_EDITOR_SAFE_READONLY_FALLBACK

          throw new Error("SCENE_LINK_NOT_FOUND");
        }

        await transaction.deleteChapterSceneLink(chapter.id, parsedPayload.data.sceneId);
        await transaction.normalizeChapterSceneLinkSortOrder(chapter.id);
      });

      return this.getChapterEditorWorkspace({
        chapterId: parsedPayload.data.chapterId
      });
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

        if (error.message === "SCENE_LINK_NOT_FOUND") {
          return {
            ok: false,
            error: {
              code: "SCENE_LINK_NOT_FOUND",
              message: "The selected scene is not currently linked to this chapter."
            }
          };
        }
      }

      logError("[P08][ChapterEditor] Readonly fallback returned", {
        chapterId: parsedPayload.data.chapterId,
        sceneId: parsedPayload.data.sceneId,
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P08_EDITOR_SAFE_READONLY_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to update the chapter structure right now."
        }
      };
    }
  }

  private buildEditorRecord(input: {
    chapter: NonNullable<ChapterEditorRecord["chapter"]>;
    milestone: NonNullable<ChapterEditorRecord["milestone"]>;
    availableScenes: ChapterSceneSummary[];
    chapterSceneLinks: Awaited<ReturnType<ChapterRepository["listChapterSceneLinksByMilestoneId"]>>;
  }): ChapterEditorRecord {
    const linkedSceneDetails = input.chapterSceneLinks
      .filter((link) => link.chapterId === input.chapter.id)
      .sort((leftLink, rightLink) => leftLink.sortOrder - rightLink.sortOrder);

    const sceneStack: ChapterEditorSceneItem[] = linkedSceneDetails.map((link) => {
      const markers = buildSceneMarkers(link.sortOrder, link.sceneOutline);

      return {
        sceneId: link.sceneId,
        outline: link.sceneOutline,
        explanation: link.sceneExplanation,
        sortOrder: link.sortOrder,
        startMarker: markers.startMarker,
        endMarker: markers.endMarker,
        autoOpen: true
      };
    });

    const linkedSceneIds = new Set(sceneStack.map((scene) => scene.sceneId));
    const quickReferences: ChapterQuickReferenceItem[] = sceneStack.map((scene) => ({
      sceneId: scene.sceneId,
      label: `Scene ${scene.sortOrder}`,
      outline: scene.outline,
      explanation: scene.explanation,
      startMarker: scene.startMarker,
      endMarker: scene.endMarker
    }));

    const sceneDraftTemplate =
      sceneStack.length === 0
        ? ""
        : sceneStack.map((scene) => `${scene.startMarker}\n${scene.outline}\n\n${scene.endMarker}`).join("\n\n");
    const wordLimitEvaluation = evaluateWordLimit(input.chapter.body, input.chapter.maxWordCount);
    const draftTemplate = input.chapter.body.length > 0 ? input.chapter.body : sceneDraftTemplate;

    return {
      chapter: input.chapter,
      milestone: input.milestone,
      editorMode: "ACTIVE",
      statusMessage:
        sceneStack.length === 0
          ? "No scenes are linked to this chapter yet. Add a scene from the structure toolbar to begin."
          : "Editor workspace ready.",
      draftTemplate,
      savedVersion: input.chapter.savedVersion,
      wordCount: wordLimitEvaluation.wordCount,
      maxWordCount: wordLimitEvaluation.maxWordCount,
      remainingWords: wordLimitEvaluation.remainingWords,
      lastSavedAt: input.chapter.updatedAt.toISOString(),
      sceneStack,
      availableScenes: input.availableScenes.filter((scene) => !linkedSceneIds.has(scene.id)),
      quickReferences,
      outlineAutoOpenSceneIds: sceneStack.map((scene) => scene.sceneId)
    };
  }
}
