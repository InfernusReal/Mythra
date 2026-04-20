import { logError, logInfo, logWarn } from "../../lib/observability/console-logger";
import { MilestoneCompletionService } from "./milestone-completion.service";
import { evaluateMilestoneRulesSchema } from "./milestone-rules.schema";
import type {
  EvaluateMilestoneRulesInput,
  MilestoneChapterCapEvaluation,
  MilestoneRulesEvaluation
} from "./milestone-rules.types";
import type { MilestoneRepository, MilestoneResult } from "./milestone.types";

export class MilestoneRulesService {
  constructor(
    private readonly repository: MilestoneRepository,
    private readonly completionService: MilestoneCompletionService
  ) {}

  async evaluateRules(
    milestoneId: string,
    payload: unknown
  ): Promise<MilestoneResult<MilestoneRulesEvaluation>> {
    logInfo("[P04][MilestoneRules] Rule evaluation start", {
      milestoneId
    }); // SAFETY_LOG:P04_MILESTONE_RULE_EVALUATION_START

    const parsedPayload = evaluateMilestoneRulesSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Milestone rule input is invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    const milestone = await this.repository.findMilestoneById(milestoneId);

    if (!milestone) {
      return {
        ok: false,
        error: {
          code: "MILESTONE_NOT_FOUND",
          message: "The milestone rule target could not be found."
        }
      };
    }

    try {
      const chapterRule = this.evaluateChapterCap(milestone.maxChaptersPerMilestone, parsedPayload.data);
      const completion = this.completionService.evaluateCompletion({
        sceneCount: parsedPayload.data.sceneCount,
        completedSceneCount: parsedPayload.data.completedSceneCount
      });

      if (!chapterRule.canProceed || !completion.canMarkComplete) {
        logWarn("[P04][MilestoneRules] Blocked transition", {
          milestoneId,
          chapterBlocked: !chapterRule.canProceed,
          completionBlocked: !completion.canMarkComplete
        }); // SAFETY_LOG:P04_MILESTONE_BLOCKED_TRANSITION
      }

      return {
        ok: true,
        data: {
          milestone: {
            id: milestone.id,
            title: milestone.title,
            maxChaptersPerMilestone: milestone.maxChaptersPerMilestone
          },
          chapterRule,
          completion
        }
      };
    } catch (error) {
      logError("[P04][MilestoneRules] Safe error response", {
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P04_MILESTONE_SAFE_ERROR_RESPONSE

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to evaluate milestone rules right now."
        }
      };
    }
  }

  private evaluateChapterCap(
    maxChaptersPerMilestone: number | null,
    payload: EvaluateMilestoneRulesInput
  ): MilestoneChapterCapEvaluation {
    const proposedChapterCount = payload.proposedChapterCount ?? payload.existingChapterCount;
    const withinCap =
      maxChaptersPerMilestone === null ? true : proposedChapterCount <= maxChaptersPerMilestone;

    logInfo("[P04][MilestoneRules] Chapter cap check", {
      maxChaptersPerMilestone,
      existingChapterCount: payload.existingChapterCount,
      proposedChapterCount
    }); // SAFETY_LOG:P04_MILESTONE_CHAPTER_CAP_CHECK

    return {
      maxChaptersPerMilestone,
      existingChapterCount: payload.existingChapterCount,
      proposedChapterCount,
      canProceed: withinCap,
      blockedReason: withinCap ? null : "The milestone chapter cap would be exceeded."
    };
  }
}
