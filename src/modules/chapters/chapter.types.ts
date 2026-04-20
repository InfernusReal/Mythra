export type ChapterMilestoneSummary = {
  id: string;
  title: string;
  volumeId: string;
  maxChaptersPerMilestone: number | null;
};

export type ChapterRecord = {
  id: string;
  milestoneId: string;
  title: string;
  body: string;
  wordCount: number;
  savedVersion: number;
  maxWordCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ChapterSceneSummary = {
  id: string;
  milestoneId: string;
  outline: string;
  explanation: string;
};

export type ChapterSceneLinkRecord = {
  id: string;
  chapterId: string;
  sceneId: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ChapterSceneLinkDetail = {
  id: string;
  chapterId: string;
  sceneId: string;
  sortOrder: number;
  sceneOutline: string;
  sceneExplanation: string;
};

export type ChapterWorkspaceRecord = {
  milestone: ChapterMilestoneSummary;
  chapters: ChapterRecord[];
  availableScenes: ChapterSceneSummary[];
  chapterSceneLinks: ChapterSceneLinkDetail[];
};

export type ChapterDetailRecord = {
  milestone: ChapterMilestoneSummary;
  chapter: ChapterRecord;
};

export type CreateChapterInput = {
  milestoneId: string;
  title: string;
};

export type LinkScenesToChapterInput = {
  chapterId: string;
  sceneIds: string[];
};

export type ChapterErrorCode =
  | "VALIDATION_ERROR"
  | "MILESTONE_NOT_FOUND"
  | "CHAPTER_NOT_FOUND"
  | "SCENE_NOT_FOUND"
  | "SCENE_LINK_NOT_FOUND"
  | "CHAPTER_LIMIT_REACHED"
  | "WORD_LIMIT_REACHED"
  | "DUPLICATE_SCENE_LINK"
  | "SAVE_CONFLICT"
  | "PERSISTENCE_ERROR";

export type ChapterError = {
  code: ChapterErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
  details?: Record<string, unknown>;
};

export type ChapterResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: ChapterError;
    };

export interface ChapterTransactionRepository {
  countChaptersByMilestoneId(milestoneId: string): Promise<number>;
  createChapter(input: CreateChapterInput): Promise<ChapterRecord>;
  findChapterById(chapterId: string): Promise<ChapterRecord | null>;
  listScenesByMilestoneId(milestoneId: string): Promise<ChapterSceneSummary[]>;
  findChapterSceneLink(chapterId: string, sceneId: string): Promise<ChapterSceneLinkRecord | null>;
  createChapterSceneLinks(chapterId: string, sceneIds: string[]): Promise<ChapterSceneLinkRecord[]>;
  deleteChapterSceneLink(chapterId: string, sceneId: string): Promise<void>;
  normalizeChapterSceneLinkSortOrder(chapterId: string): Promise<void>;
  updateChapterDraft(input: {
    chapterId: string;
    body: string;
    wordCount: number;
    savedVersion: number;
  }): Promise<ChapterRecord>;
}

export interface ChapterRepository extends ChapterTransactionRepository {
  findMilestoneById(milestoneId: string): Promise<ChapterMilestoneSummary | null>;
  listChaptersByMilestoneId(milestoneId: string): Promise<ChapterRecord[]>;
  listChapterSceneLinksByMilestoneId(milestoneId: string): Promise<ChapterSceneLinkDetail[]>;
  runInTransaction<T>(handler: (transaction: ChapterTransactionRepository) => Promise<T>): Promise<T>;
}
