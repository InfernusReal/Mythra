import { logInfo } from "../../lib/observability/console-logger";
import type { MilestoneCompletionEvaluation } from "./milestone-rules.types";

type EvaluateMilestoneCompletionInput = {
  sceneCount: number;
  completedSceneCount: number;
};

export class MilestoneCompletionService {
  evaluateCompletion(input: EvaluateMilestoneCompletionInput): MilestoneCompletionEvaluation {
    logInfo("[P04][MilestoneRules] Scene completion count evaluated", {
      sceneCount: input.sceneCount,
      completedSceneCount: input.completedSceneCount
    }); // SAFETY_LOG:P04_MILESTONE_SCENE_COMPLETION_COUNT

    const allScenesComplete = input.sceneCount > 0 && input.completedSceneCount === input.sceneCount;

    return {
      sceneCount: input.sceneCount,
      completedSceneCount: input.completedSceneCount,
      status: allScenesComplete ? "COMPLETE" : "INCOMPLETE",
      canMarkComplete: allScenesComplete,
      blockedReason: allScenesComplete ? null : "All scenes must be complete before the milestone can be complete."
    };
  }
}
