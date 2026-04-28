import { z } from "zod";

import { WORLD_LAYER_KEYS } from "./world-layer.types";

const optionalNodeField = z
  .string()
  .trim()
  .max(1200, "Field is too long.")
  .optional()
  .transform((value) => {
    if (!value || value.length === 0) {
      return null;
    }

    return value;
  });

export const worldNodeQuerySchema = z.object({
  volumeId: z.string().trim().min(1, "Volume id is required."),
  layerKey: z.enum(WORLD_LAYER_KEYS)
});

export const upsertWorldNodeSchema = z.object({
  nodeId: z.string().trim().min(1, "Node id is invalid.").optional(),
  volumeId: z.string().trim().min(1, "Volume id is required."),
  layerKey: z.enum(WORLD_LAYER_KEYS),
  name: z.string().trim().min(1, "Node name is required.").max(180, "Node name is too long."),
  positionJustification: optionalNodeField,
  advantages: optionalNodeField,
  disadvantages: optionalNodeField,
  relationships: optionalNodeField,
  geographicalLocation: optionalNodeField,
  traditions: optionalNodeField,
  specialTraits: optionalNodeField
});

export const worldReminderScanSchema = z.object({
  volumeId: z.string().trim().min(1, "Volume id is required.")
});
