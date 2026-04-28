import { z } from "zod";

import { WORLD_LAYER_KEYS, WORLD_ORDERING_MODES } from "./world-layer.types";

const invariantField = z
  .string()
  .trim()
  .max(600, "Field is too long.")
  .optional()
  .transform((value) => {
    if (!value || value.length === 0) {
      return null;
    }

    return value;
  });

export const volumeWorldQuerySchema = z.object({
  volumeId: z.string().trim().min(1, "Volume id is required.")
});

export const updateWorldLayerSchema = z.object({
  volumeId: z.string().trim().min(1, "Volume id is required."),
  layerKey: z.enum(WORLD_LAYER_KEYS),
  orderingMode: z.enum(WORLD_ORDERING_MODES),
  vibe: invariantField,
  constraints: invariantField,
  narrativeFlavor: invariantField
});
