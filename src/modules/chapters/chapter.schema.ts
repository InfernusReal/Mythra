import { z } from "zod";

export const chapterMilestoneQuerySchema = z.object({
  milestoneId: z.string().trim().min(1, "Milestone id is required.")
});

export const chapterEditorQuerySchema = z.object({
  chapterId: z.string().trim().min(1, "Chapter id is required.")
});

export const saveChapterDraftSchema = z.object({
  chapterId: z.string().trim().min(1, "Chapter id is required."),
  body: z.string(),
  expectedSavedVersion: z.number().int().min(0, "Expected saved version is invalid."),
  saveMode: z.enum(["AUTO", "MANUAL"])
});

export const createChapterSchema = z.object({
  milestoneId: z.string().trim().min(1, "Milestone id is required."),
  title: z.string().trim().min(1, "Title is required.").max(180, "Title is too long.")
});

export const chapterStructureCommandSchema = z.object({
  chapterId: z.string().trim().min(1, "Chapter id is required."),
  sceneId: z.string().trim().min(1, "Scene id is required.")
});

export const linkScenesToChapterSchema = z.object({
  chapterId: z.string().trim().min(1, "Chapter id is required."),
  sceneIds: z
    .array(z.string().trim().min(1, "Scene id is required."))
    .min(1, "At least one scene must be selected.")
    .superRefine((sceneIds, context) => {
      const uniqueIds = new Set(sceneIds);

      if (uniqueIds.size !== sceneIds.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sceneIds"],
          message: "Duplicate scene ids are not allowed in one linking request."
        });
      }
    })
});
