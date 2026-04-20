import { prisma } from "../../lib/database/prisma";
import { logError, logInfo, logWarn } from "../../lib/observability/console-logger";
import {
  mapContinueTarget,
  mapMilestoneProgress,
  mapNextScenes
} from "./today-queue.mapper";
import type {
  TodayQueueDataSource,
  TodayQueueRawChapter,
  TodayQueueRawProgress,
  TodayQueueRecord,
  TodayQueueResult
} from "./today-queue.types";

class PrismaTodayQueueDataSource implements TodayQueueDataSource {
  async findActiveChapter(): Promise<TodayQueueRawChapter | null> {
    return prisma.chapter.findFirst({
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        milestone: {
          select: {
            id: true,
            title: true,
            volume: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        sceneLinks: {
          orderBy: {
            sortOrder: "asc"
          },
          include: {
            scene: {
              select: {
                id: true,
                outline: true
              }
            }
          }
        }
      }
    });
  }

  async findMilestoneProgress(milestoneId: string): Promise<TodayQueueRawProgress | null> {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            scenes: true,
            chapters: true
          }
        }
      }
    });

    if (!milestone) {
      return null;
    }

    const linkedSceneRows = await prisma.chapterSceneLink.findMany({
      where: {
        chapter: {
          milestoneId
        }
      },
      select: {
        sceneId: true
      }
    });

    const linkedScenes = new Set(linkedSceneRows.map((row) => row.sceneId)).size;

    return {
      milestoneId: milestone.id,
      milestoneTitle: milestone.title,
      totalScenes: milestone._count.scenes,
      linkedScenes,
      chapterCount: milestone._count.chapters
    };
  }
}

export class TodayQueueService {
  constructor(private readonly dataSource: TodayQueueDataSource) {}

  async getTodayQueue(): Promise<TodayQueueResult<TodayQueueRecord>> {
    logInfo("[P07][TodayQueue] Queue assembly start", {
      source: "today-queue-service"
    }); // SAFETY_LOG:P07_QUEUE_ASSEMBLY_START

    try {
      const activeChapter = await this.dataSource.findActiveChapter();

      if (!activeChapter) {
        logWarn("[P07][TodayQueue] Continue target fallback", {
          reason: "No active chapter found"
        }); // SAFETY_LOG:P07_CONTINUE_TARGET_FALLBACK

        logWarn("[P07][TodayQueue] Empty queue fallback", {
          reason: "No chapters exist yet"
        }); // SAFETY_LOG:P07_EMPTY_QUEUE_FALLBACK

        return {
          ok: true,
          data: {
            continueTarget: null,
            nextScenes: [],
            milestoneProgress: null,
            queueLabel: "Today's Writing Queue",
            emptyStateMessage: "No active chapter exists yet. Create and link a chapter to start the writing queue."
          }
        };
      }

      logInfo("[P07][TodayQueue] Active draft resolved", {
        chapterId: activeChapter.id,
        milestoneId: activeChapter.milestone.id
      }); // SAFETY_LOG:P07_ACTIVE_DRAFT_RESOLUTION

      const [nextScenes, progress] = await Promise.all([
        Promise.resolve(mapNextScenes(activeChapter)),
        this.dataSource.findMilestoneProgress(activeChapter.milestone.id)
      ]);

      logInfo("[P07][TodayQueue] Next scenes resolved", {
        chapterId: activeChapter.id,
        nextSceneCount: nextScenes.length
      }); // SAFETY_LOG:P07_NEXT_SCENE_RESOLUTION

      return {
        ok: true,
        data: {
          continueTarget: mapContinueTarget(activeChapter),
          nextScenes,
          milestoneProgress: progress ? mapMilestoneProgress(progress) : null,
          queueLabel: "Today's Writing Queue",
          emptyStateMessage: null
        }
      };
    } catch (error) {
      logError("[P07][TodayQueue] Queue load fallback", {
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P07_QUEUE_LOAD_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to load today's writing queue right now."
        }
      };
    }
  }
}

export function createTodayQueueService(): TodayQueueService {
  return new TodayQueueService(new PrismaTodayQueueDataSource());
}
