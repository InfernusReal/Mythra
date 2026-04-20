import type { ChapterResult } from "./chapter.types";
import type { NextSceneSuggestionRecord } from "../scenes/next-scene.service";

export type ChapterGuidanceIndicator = {
  code: "MISSING_OUTLINE" | "MISSING_REFERENCES" | "MILESTONE_INCOMPLETE";
  severity: "INFO" | "WARNING";
  title: string;
  description: string;
  count: number;
  deferred?: boolean;
};

export type ChapterProgressSummary = {
  milestoneId: string;
  milestoneTitle: string;
  totalScenes: number;
  linkedScenes: number;
  remainingScenes: number;
  chapterCount: number;
  completionState: "COMPLETE" | "INCOMPLETE";
  summaryLabel: string;
};

export type ChapterGuidanceRecord = {
  chapterId: string;
  indicators: ChapterGuidanceIndicator[];
  nextSceneSuggestion: NextSceneSuggestionRecord | null;
  progressSummary: ChapterProgressSummary;
  generatedAt: string;
};

export type ChapterGuidanceResult = ChapterResult<ChapterGuidanceRecord>;
