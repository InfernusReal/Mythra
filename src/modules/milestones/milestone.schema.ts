import { z } from "zod";

export const createMilestoneSchema = z.object({
  volumeId: z.string().trim().min(1, "Volume id is required."),
  title: z.string().trim().min(1, "Title is required.").max(120, "Title is too long."),
  summary: z
    .string()
    .trim()
    .max(2000, "Summary is too long.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
});

export const volumeIdQuerySchema = z.object({
  volumeId: z.string().trim().min(1, "Volume id is required.")
});

export const milestoneIdParamSchema = z.object({
  milestoneId: z.string().trim().min(1, "Milestone id is required.")
});
