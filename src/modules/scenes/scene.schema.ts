import { z } from "zod";

const sceneOutlineSchema = z.string().trim().min(1, "Outline is required.").max(4000, "Outline is too long.");
const sceneExplanationSchema = z
  .string()
  .trim()
  .min(1, "Explanation is required.")
  .max(4000, "Explanation is too long.");

export const milestoneIdParamSchema = z.object({
  milestoneId: z.string().trim().min(1, "Milestone id is required.")
});

export const sceneIdParamSchema = z.object({
  sceneId: z.string().trim().min(1, "Scene id is required.")
});

export const sceneMilestoneQuerySchema = z.object({
  milestoneId: z.string().trim().min(1, "Milestone id is required.")
});

export const createSceneSchema = z.object({
  milestoneId: z.string().trim().min(1, "Milestone id is required."),
  outline: sceneOutlineSchema,
  explanation: sceneExplanationSchema
});

export const updateSceneSchema = z.object({
  sceneId: z.string().trim().min(1, "Scene id is required."),
  outline: sceneOutlineSchema,
  explanation: sceneExplanationSchema
});

export const createSceneGraphEdgeSchema = z
  .object({
    milestoneId: z.string().trim().min(1, "Milestone id is required."),
    fromSceneId: z.string().trim().min(1, "Source scene id is required."),
    toSceneId: z.string().trim().min(1, "Target scene id is required."),
    relationship: z.string().trim().min(1, "Relationship is required.").max(120, "Relationship is too long.")
  })
  .superRefine((value, context) => {
    if (value.fromSceneId === value.toSceneId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["toSceneId"],
        message: "A scene cannot connect to itself."
      });
    }
  });
