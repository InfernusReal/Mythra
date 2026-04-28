import { logError, logInfo, logWarn } from "../../lib/observability/console-logger";
import { updateWorldLayerSchema, volumeWorldQuerySchema } from "./world-layer.schema";
import { WorldRuleEngineService } from "./world-rule-engine.service";
import type { WorldLayerResult, WorldLayerTreeRecord, WorldRepository } from "./world-layer.types";

export class WorldLayerService {
  constructor(
    private readonly repository: WorldRepository,
    private readonly ruleEngine: WorldRuleEngineService
  ) {}

  async getVolumeWorldLayers(payload: unknown): Promise<WorldLayerResult<WorldLayerTreeRecord>> {
    const parsedPayload = volumeWorldQuerySchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Volume id is invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P11][WorldLayer] Volume world load starting", {
      volumeId: parsedPayload.data.volumeId
    }); // SAFETY_LOG:P11_VOLUME_WORLD_LOAD

    try {
      const volume = await this.repository.findVolumeSummaryById(parsedPayload.data.volumeId);

      if (!volume) {
        return {
          ok: false,
          error: {
            code: "VOLUME_NOT_FOUND",
            message: "The world-building workspace could not be found for this volume."
          }
        };
      }

      const existingLayers = await this.repository.listLayersByVolumeId(parsedPayload.data.volumeId);
      const bootstrapLayers = this.ruleEngine.buildBootstrapLayers(parsedPayload.data.volumeId, existingLayers);

      logInfo("[P11][WorldLayer] Layer bootstrap evaluated", {
        volumeId: parsedPayload.data.volumeId,
        missingLayerCount: bootstrapLayers.length
      }); // SAFETY_LOG:P11_LAYER_BOOTSTRAP

      const storedLayers =
        bootstrapLayers.length > 0
          ? await this.repository.createLayers(bootstrapLayers)
          : existingLayers;

      if (storedLayers.length === 0) {
        logWarn("[P11][WorldLayer] Empty tree fallback returned", {
          volumeId: parsedPayload.data.volumeId
        }); // SAFETY_LOG:P11_EMPTY_TREE_FALLBACK

        return {
          ok: true,
          data: {
            volume,
            layers: [],
            emptyStateMessage: "World layers are not available yet for this volume."
          }
        };
      }

      const layers = this.ruleEngine.resolveLayerTree(storedLayers);
      const orderingModeCount = layers.reduce<Record<string, number>>((counts, layer) => {
        counts[layer.orderingMode] = (counts[layer.orderingMode] ?? 0) + 1;
        return counts;
      }, {});

      logInfo("[P11][WorldLayer] Ranking mode resolved", {
        volumeId: parsedPayload.data.volumeId,
        orderingModeCount
      }); // SAFETY_LOG:P11_RANKING_MODE_RESOLUTION_LOAD

      return {
        ok: true,
        data: {
          volume,
          layers,
          emptyStateMessage: null
        }
      };
    } catch (error) {
      logError("[P11][WorldLayer] Returning safe fallback", {
        volumeId: parsedPayload.data.volumeId,
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P11_WORLD_LOAD_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to load world-building layers right now."
        }
      };
    }
  }

  async updateWorldLayer(payload: unknown): Promise<WorldLayerResult<WorldLayerTreeRecord>> {
    const parsedPayload = updateWorldLayerSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "World layer details are invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    try {
      const volume = await this.repository.findVolumeSummaryById(parsedPayload.data.volumeId);

      if (!volume) {
        return {
          ok: false,
          error: {
            code: "VOLUME_NOT_FOUND",
            message: "The world-building workspace could not be found for this volume."
          }
        };
      }

      const normalizedPayload = this.ruleEngine.normalizeLayerUpdate(parsedPayload.data);

      logInfo("[P11][WorldLayer] Invariant fields parsed", {
        volumeId: normalizedPayload.volumeId,
        layerKey: normalizedPayload.layerKey,
        vibeLength: normalizedPayload.vibe?.length ?? 0,
        constraintsLength: normalizedPayload.constraints?.length ?? 0,
        narrativeFlavorLength: normalizedPayload.narrativeFlavor?.length ?? 0
      }); // SAFETY_LOG:P11_INVARIANT_PARSE

      logInfo("[P11][WorldLayer] Ranking mode resolved", {
        volumeId: normalizedPayload.volumeId,
        layerKey: normalizedPayload.layerKey,
        orderingMode: normalizedPayload.orderingMode
      }); // SAFETY_LOG:P11_RANKING_MODE_RESOLUTION_UPDATE

      await this.repository.updateLayer(normalizedPayload);

      return this.getVolumeWorldLayers({
        volumeId: normalizedPayload.volumeId
      });
    } catch (error) {
      logError("[P11][WorldLayer] Returning safe fallback", {
        volumeId: parsedPayload.data.volumeId,
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P11_WORLD_UPDATE_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to save world-layer settings right now."
        }
      };
    }
  }
}
