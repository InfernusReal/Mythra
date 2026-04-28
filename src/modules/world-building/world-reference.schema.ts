import { z } from "zod";

export const linkWorldNodeToSceneSchema = z.object({
  sceneId: z.string().trim().min(1, "Scene id is required."),
  worldNodeId: z.string().trim().min(1, "World node id is required.")
});

export const chapterWorldContextQuerySchema = z.object({
  chapterId: z.string().trim().min(1, "Chapter id is required.")
});
