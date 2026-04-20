export type TodayQueueContinueTarget = {
  chapterId: string;
  chapterTitle: string;
  milestoneId: string;
  milestoneTitle: string;
  volumeId: string;
  volumeTitle: string;
  href: string;
};

export type TodayQueueSceneItem = {
  sceneId: string;
  outline: string;
  sortOrder: number;
};

export type TodayQueueMilestoneProgress = {
  milestoneId: string;
  milestoneTitle: string;
  totalScenes: number;
  linkedScenes: number;
  remainingScenes: number;
  chapterCount: number;
  progressLabel: string;
};

export type TodayQueueRecord = {
  continueTarget: TodayQueueContinueTarget | null;
  nextScenes: TodayQueueSceneItem[];
  milestoneProgress: TodayQueueMilestoneProgress | null;
  queueLabel: string;
  emptyStateMessage: string | null;
};

export type TodayQueueErrorCode = "PERSISTENCE_ERROR";

export type TodayQueueError = {
  code: TodayQueueErrorCode;
  message: string;
};

export type TodayQueueResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: TodayQueueError;
    };

export type TodayQueueRawChapter = {
  id: string;
  title: string;
  updatedAt: Date;
  milestone: {
    id: string;
    title: string;
    volume: {
      id: string;
      title: string;
    };
  };
  sceneLinks: Array<{
    sortOrder: number;
    scene: {
      id: string;
      outline: string;
    };
  }>;
};

export type TodayQueueRawProgress = {
  milestoneId: string;
  milestoneTitle: string;
  totalScenes: number;
  linkedScenes: number;
  chapterCount: number;
};

export interface TodayQueueDataSource {
  findActiveChapter(): Promise<TodayQueueRawChapter | null>;
  findMilestoneProgress(milestoneId: string): Promise<TodayQueueRawProgress | null>;
}
