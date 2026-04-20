import type { MilestoneRecord } from "./milestone.types";

export type MilestoneCompletionStatus = "COMPLETE" | "INCOMPLETE";

export type EvaluateMilestoneRulesInput = {
  existingChapterCount: number;
  proposedChapterCount?: number;
  sceneCount: number;
  completedSceneCount: number;
};

export type MilestoneChapterCapEvaluation = {
  maxChaptersPerMilestone: number | null;
  existingChapterCount: number;
  proposedChapterCount: number;
  canProceed: boolean;
  blockedReason: string | null;
};

export type MilestoneCompletionEvaluation = {
  sceneCount: number;
  completedSceneCount: number;
  status: MilestoneCompletionStatus;
  canMarkComplete: boolean;
  blockedReason: string | null;
};

export type MilestoneRulesEvaluation = {
  milestone: Pick<MilestoneRecord, "id" | "title" | "maxChaptersPerMilestone">;
  chapterRule: MilestoneChapterCapEvaluation;
  completion: MilestoneCompletionEvaluation;
};
