import type {
  TodayQueueContinueTarget,
  TodayQueueMilestoneProgress,
  TodayQueueRawChapter,
  TodayQueueRawProgress,
  TodayQueueSceneItem
} from "./today-queue.types";

export function mapContinueTarget(chapter: TodayQueueRawChapter): TodayQueueContinueTarget {
  return {
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    milestoneId: chapter.milestone.id,
    milestoneTitle: chapter.milestone.title,
    volumeId: chapter.milestone.volume.id,
    volumeTitle: chapter.milestone.volume.title,
    href: `/chapters/${chapter.id}`
  };
}

export function mapNextScenes(chapter: TodayQueueRawChapter): TodayQueueSceneItem[] {
  return chapter.sceneLinks.map((link) => ({
    sceneId: link.scene.id,
    outline: link.scene.outline,
    sortOrder: link.sortOrder
  }));
}

export function mapMilestoneProgress(progress: TodayQueueRawProgress): TodayQueueMilestoneProgress {
  const remainingScenes = Math.max(progress.totalScenes - progress.linkedScenes, 0);

  return {
    milestoneId: progress.milestoneId,
    milestoneTitle: progress.milestoneTitle,
    totalScenes: progress.totalScenes,
    linkedScenes: progress.linkedScenes,
    remainingScenes,
    chapterCount: progress.chapterCount,
    progressLabel: `${progress.linkedScenes}/${progress.totalScenes} scenes linked into chapters`
  };
}
