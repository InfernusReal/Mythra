import { z } from "zod";

export const evaluateMilestoneRulesSchema = z
  .object({
    existingChapterCount: z.coerce.number().int().min(0, "Existing chapter count cannot be negative."),
    proposedChapterCount: z.coerce.number().int().min(0, "Proposed chapter count cannot be negative.").optional(),
    sceneCount: z.coerce.number().int().min(0, "Scene count cannot be negative."),
    completedSceneCount: z.coerce.number().int().min(0, "Completed scene count cannot be negative.")
  })
  .superRefine((value, context) => {
    const proposedChapterCount = value.proposedChapterCount ?? value.existingChapterCount;

    if (proposedChapterCount < value.existingChapterCount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["proposedChapterCount"],
        message: "Proposed chapter count cannot move backwards."
      });
    }

    if (value.completedSceneCount > value.sceneCount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["completedSceneCount"],
        message: "Completed scene count cannot exceed total scene count."
      });
    }
  });

export const milestoneRulesParamsSchema = z.object({
  milestoneId: z.string().trim().min(1, "Milestone id is required.")
});
