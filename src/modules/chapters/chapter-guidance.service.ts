import { logError, logInfo, logWarn } from "../../lib/observability/console-logger";
import { chapterEditorQuerySchema } from "./chapter.schema";
import type {
  ChapterRepository,
  ChapterSceneLinkDetail,
  ChapterSceneSummary
} from "./chapter.types";
import type { ChapterGuidanceIndicator, ChapterGuidanceRecord, ChapterGuidanceResult, ChapterProgressSummary } from "./chapter-guidance.types";
import type { SceneGraphEdgeRecord } from "../scenes/scene.types";
import { NextSceneService } from "../scenes/next-scene.service";

type ChapterGuidanceSceneGraphSource = {
  listGraphEdgesByMilestoneId(milestoneId: string): Promise<SceneGraphEdgeRecord[]>;
};

export class ChapterGuidanceService {
  constructor(
    private readonly repository: ChapterRepository,
    private readonly sceneGraphSource: ChapterGuidanceSceneGraphSource,
    private readonly nextSceneService: NextSceneService
  ) {}

  async getChapterGuidance(payload: unknown): Promise<ChapterGuidanceResult> {
    const parsedPayload = chapterEditorQuerySchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Chapter guidance details are invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P10][Guidance] Guidance assembly starting", {
      chapterId: parsedPayload.data.chapterId
    }); // SAFETY_LOG:P10_GUIDANCE_ASSEMBLY

    try {
      const chapter = await this.repository.findChapterById(parsedPayload.data.chapterId);

      if (!chapter) {
        return {
          ok: false,
          error: {
            code: "CHAPTER_NOT_FOUND",
            message: "The chapter guidance could not be loaded because the chapter was not found."
          }
        };
      }

      const [milestone, scenes, chapterSceneLinks, graphEdges] = await Promise.all([
        this.repository.findMilestoneById(chapter.milestoneId),
        this.repository.listScenesByMilestoneId(chapter.milestoneId),
        this.repository.listChapterSceneLinksByMilestoneId(chapter.milestoneId),
        this.sceneGraphSource.listGraphEdgesByMilestoneId(chapter.milestoneId)
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

      const chapterLinks = chapterSceneLinks
        .filter((link) => link.chapterId === chapter.id)
        .sort((leftLink, rightLink) => leftLink.sortOrder - rightLink.sortOrder);
      const linkedSceneIdsForChapter = new Set(chapterLinks.map((link) => link.sceneId));
      const availableScenes = scenes.filter((scene) => !linkedSceneIdsForChapter.has(scene.id));
      const missingOutlineCount = scenes.filter((scene) => scene.outline.trim().length === 0).length;

      logWarn("[P10][Guidance] Missing outline detection completed", {
        chapterId: chapter.id,
        missingOutlineCount
      }); // SAFETY_LOG:P10_MISSING_OUTLINE_DETECTION

      const referenceCheckDeferred = chapterLinks.length > 0;

      logWarn("[P10][Guidance] Missing reference detection deferred", {
        chapterId: chapter.id,
        linkedSceneCount: chapterLinks.length,
        referenceCheckDeferred
      }); // SAFETY_LOG:P10_MISSING_REFERENCE_DETECTION

      const nextSceneSuggestion = this.nextSceneService.resolveNextScene({
        linkedSceneIdsInOrder: chapterLinks.map((link) => link.sceneId),
        availableScenes,
        graphEdges
      });
      const progressSummary = this.buildProgressSummary(milestone.id, milestone.title, scenes, chapterSceneLinks);
      const indicators = this.buildIndicators({
        missingOutlineCount,
        linkedSceneCount: chapterLinks.length,
        remainingScenes: progressSummary.remainingScenes
      });

      logInfo("[P10][Guidance] Safe summary render prepared", {
        chapterId: chapter.id,
        indicatorCount: indicators.length,
        remainingScenes: progressSummary.remainingScenes
      }); // SAFETY_LOG:P10_SAFE_SUMMARY_RENDER

      const record: ChapterGuidanceRecord = {
        chapterId: chapter.id,
        indicators,
        nextSceneSuggestion,
        progressSummary,
        generatedAt: new Date().toISOString()
      };

      return {
        ok: true,
        data: record
      };
    } catch (error) {
      logError("[P10][Guidance] Returning safe fallback", {
        chapterId: parsedPayload.data.chapterId,
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P10_GUIDANCE_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to load chapter guidance right now."
        }
      };
    }
  }

  private buildIndicators(input: {
    missingOutlineCount: number;
    linkedSceneCount: number;
    remainingScenes: number;
  }): ChapterGuidanceIndicator[] {
    const indicators: ChapterGuidanceIndicator[] = [];

    if (input.missingOutlineCount > 0) {
      indicators.push({
        code: "MISSING_OUTLINE",
        severity: "WARNING",
        title: "Scene outlines still need completion",
        description: `${input.missingOutlineCount} scene outlines are still blank inside this milestone.`,
        count: input.missingOutlineCount
      });
    }

    if (input.linkedSceneCount > 0) {
      indicators.push({
        code: "MISSING_REFERENCES",
        severity: "INFO",
        title: "World-reference coverage is not verified yet",
        description:
          "Linked scenes do not yet have verified world-reference coverage because the world context layer is scheduled for a later phase.",
        count: input.linkedSceneCount,
        deferred: true
      });
    }

    if (input.remainingScenes > 0) {
      indicators.push({
        code: "MILESTONE_INCOMPLETE",
        severity: "WARNING",
        title: "Milestone still has unlinked scenes",
        description: `${input.remainingScenes} scenes are still outside chapter structure in this milestone.`,
        count: input.remainingScenes
      });
    }

    return indicators;
  }

  private buildProgressSummary(
    milestoneId: string,
    milestoneTitle: string,
    scenes: ChapterSceneSummary[],
    chapterSceneLinks: ChapterSceneLinkDetail[]
  ): ChapterProgressSummary {
    const linkedSceneCount = new Set(chapterSceneLinks.map((link) => link.sceneId)).size;
    const remainingScenes = Math.max(scenes.length - linkedSceneCount, 0);
    const chapterCount = new Set(chapterSceneLinks.map((link) => link.chapterId)).size;

    return {
      milestoneId,
      milestoneTitle,
      totalScenes: scenes.length,
      linkedScenes: linkedSceneCount,
      remainingScenes,
      chapterCount,
      completionState: scenes.length > 0 && remainingScenes === 0 ? "COMPLETE" : "INCOMPLETE",
      summaryLabel: `Milestone progress: ${linkedSceneCount}/${scenes.length} scenes linked across ${chapterCount} chapters.`
    };
  }
}
