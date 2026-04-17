import { z } from "zod";

export const createVolumeSchema = z.object({
  novelId: z.string().trim().min(1, "Novel id is required."),
  title: z.string().trim().min(1, "Title is required.").max(120, "Title is too long."),
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
});

export const novelIdQuerySchema = z.object({
  novelId: z.string().trim().min(1, "Novel id is required.")
});

export const volumeIdParamSchema = z.object({
  volumeId: z.string().trim().min(1, "Volume id is required.")
});
