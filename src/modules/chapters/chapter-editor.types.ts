import type {
  ChapterMilestoneSummary,
  ChapterRecord,
  ChapterResult,
  ChapterSceneSummary
} from "./chapter.types";

export type ChapterEditorMode = "ACTIVE" | "READ_ONLY";

export type ChapterEditorSceneItem = {
  sceneId: string;
  outline: string;
  explanation: string;
  sortOrder: number;
  startMarker: string;
  endMarker: string;
  autoOpen: boolean;
};

export type ChapterQuickReferenceItem = {
  sceneId: string;
  label: string;
  outline: string;
  explanation: string;
  startMarker: string;
  endMarker: string;
};

export type ChapterEditorRecord = {
  chapter: ChapterRecord | null;
  milestone: ChapterMilestoneSummary | null;
  editorMode: ChapterEditorMode;
  statusMessage: string;
  draftTemplate: string;
  savedVersion: number;
  wordCount: number;
  maxWordCount: number;
  remainingWords: number;
  lastSavedAt: string | null;
  sceneStack: ChapterEditorSceneItem[];
  availableScenes: ChapterSceneSummary[];
  quickReferences: ChapterQuickReferenceItem[];
  outlineAutoOpenSceneIds: string[];
};

export type ChapterStructureCommandInput = {
  chapterId: string;
  sceneId: string;
};

export type ChapterEditorResult = ChapterResult<ChapterEditorRecord>;
