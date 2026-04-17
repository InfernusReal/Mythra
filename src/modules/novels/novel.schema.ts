import { z } from "zod";

export const createNovelSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120, "Title is too long."),
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
});

export type CreateNovelSchemaInput = z.infer<typeof createNovelSchema>;
