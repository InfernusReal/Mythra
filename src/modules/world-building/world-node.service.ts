import { logError, logInfo, logWarn } from "../../lib/observability/console-logger";
import { scheduleReminder } from "../../lib/jobs/reminder-scheduler";
import { upsertWorldNodeSchema, worldNodeQuerySchema } from "./world-node.schema";
import { WORLD_NODE_REQUIRED_FIELDS } from "./world-node.types";
import type {
  PersistedWorldNodeRecord,
  UpsertWorldNodeInput,
  WorldLayerSummary,
  WorldNodeCollection,
  WorldNodeRecord,
  WorldNodeRequiredField,
  WorldNodeResult
} from "./world-node.types";
import type { WorldRepository } from "./world-layer.types";

function normalizeNodeField(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length === 0 ? null : normalizedValue;
}

export class WorldNodeService {
  constructor(private readonly repository: WorldRepository) {}

  async getWorldNodesByLayer(payload: unknown): Promise<WorldNodeResult<WorldNodeCollection>> {
    const parsedPayload = worldNodeQuerySchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "World node request is invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    try {
      const [volume, layer] = await Promise.all([
        this.repository.findVolumeSummaryById(parsedPayload.data.volumeId),
        this.repository.findLayerByKey(parsedPayload.data.volumeId, parsedPayload.data.layerKey)
      ]);

      if (!volume) {
        return {
          ok: false,
          error: {
            code: "VOLUME_NOT_FOUND",
            message: "The world-building workspace could not be found for this volume."
          }
        };
      }

      if (!layer) {
        return {
          ok: false,
          error: {
            code: "WORLD_LAYER_NOT_FOUND",
            message: "The requested world layer could not be found."
          }
        };
      }

      const nodes = await this.repository.listNodesByLayerId(layer.id);
      const mappedNodes = nodes.map((node) => this.mapNodeRecord(node));

      return {
        ok: true,
        data: {
          volume,
          layer,
          nodes: mappedNodes,
          emptyStateMessage:
            mappedNodes.length === 0 ? "No world nodes have been added to this layer yet." : null
        }
      };
    } catch (error) {
      logError("[P12][WorldNode] Returning safe fallback", {
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P12_WORLD_NODE_LOAD_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to load world nodes right now."
        }
      };
    }
  }

  async upsertWorldNode(payload: unknown): Promise<WorldNodeResult<WorldNodeCollection>> {
    const parsedPayload = upsertWorldNodeSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "World node details are invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P12][WorldNode] Node validation starting", {
      volumeId: parsedPayload.data.volumeId,
      layerKey: parsedPayload.data.layerKey,
      nodeId: parsedPayload.data.nodeId ?? null
    }); // SAFETY_LOG:P12_NODE_VALIDATION_START

    try {
      const [volume, layer] = await Promise.all([
        this.repository.findVolumeSummaryById(parsedPayload.data.volumeId),
        this.repository.findLayerByKey(parsedPayload.data.volumeId, parsedPayload.data.layerKey)
      ]);

      if (!volume) {
        return {
          ok: false,
          error: {
            code: "VOLUME_NOT_FOUND",
            message: "The world-building workspace could not be found for this volume."
          }
        };
      }

      if (!layer) {
        return {
          ok: false,
          error: {
            code: "WORLD_LAYER_NOT_FOUND",
            message: "The selected world layer could not be found."
          }
        };
      }

      if (parsedPayload.data.nodeId) {
        const existingNode = await this.repository.findNodeById(parsedPayload.data.nodeId);

        if (!existingNode) {
          return {
            ok: false,
            error: {
              code: "WORLD_NODE_NOT_FOUND",
              message: "The selected world node could not be found."
            }
          };
        }
      }

      const normalizedInput = this.normalizeInput(parsedPayload.data, layer.id);
      const missingRequiredFields = this.resolveMissingRequiredFields(normalizedInput);

      if (missingRequiredFields.length > 0) {
        logWarn("[P12][WorldNode] Missing required field detected", {
          volumeId: normalizedInput.volumeId,
          layerKey: parsedPayload.data.layerKey,
          nodeName: normalizedInput.name,
          missingRequiredFields
        }); // SAFETY_LOG:P12_MISSING_REQUIRED_FIELD
      }

      const now = new Date();
      const reminderSchedule =
        missingRequiredFields.length === 0
          ? {
              lastReminderQueuedAt: null,
              nextReminderDueAt: null
            }
          : {
              lastReminderQueuedAt: null,
              nextReminderDueAt: scheduleReminder({
                referenceDate: now,
                missingFieldCount: missingRequiredFields.length
              }).nextReminderDueAt
            };

      if (parsedPayload.data.nodeId) {
        await this.repository.updateNode({
          nodeId: parsedPayload.data.nodeId,
          ...normalizedInput,
          ...reminderSchedule
        });
      } else {
        await this.repository.createNode({
          ...normalizedInput,
          ...reminderSchedule
        });
      }

      return this.getWorldNodesByLayer({
        volumeId: parsedPayload.data.volumeId,
        layerKey: parsedPayload.data.layerKey
      });
    } catch (error) {
      logError("[P12][WorldNode] Returning safe fallback", {
        volumeId: parsedPayload.data.volumeId,
        layerKey: parsedPayload.data.layerKey,
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P12_WORLD_NODE_SAVE_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to save the world node right now."
        }
      };
    }
  }

  private normalizeInput(input: UpsertWorldNodeInput, layerId: string) {
    return {
      volumeId: input.volumeId,
      layerId,
      name: input.name.trim(),
      positionJustification: normalizeNodeField(input.positionJustification),
      advantages: normalizeNodeField(input.advantages),
      disadvantages: normalizeNodeField(input.disadvantages),
      relationships: normalizeNodeField(input.relationships),
      geographicalLocation: normalizeNodeField(input.geographicalLocation),
      traditions: normalizeNodeField(input.traditions),
      specialTraits: normalizeNodeField(input.specialTraits)
    };
  }

  private resolveMissingRequiredFields(input: {
    positionJustification: string | null;
    advantages: string | null;
    disadvantages: string | null;
    relationships: string | null;
    geographicalLocation: string | null;
    traditions: string | null;
  }): WorldNodeRequiredField[] {
    return WORLD_NODE_REQUIRED_FIELDS.filter((fieldName) => !input[fieldName]);
  }

  private mapNodeRecord(node: PersistedWorldNodeRecord): WorldNodeRecord {
    const missingRequiredFields = this.resolveMissingRequiredFields(node);
    const isComplete = missingRequiredFields.length === 0;

    return {
      ...node,
      missingRequiredFields,
      isComplete,
      completionLabel: isComplete
        ? "Complete"
        : `${missingRequiredFields.length} required fields still need completion`,
      lastReminderQueuedAtLabel: node.lastReminderQueuedAt ? node.lastReminderQueuedAt.toISOString() : null,
      nextReminderDueAtLabel: node.nextReminderDueAt ? node.nextReminderDueAt.toISOString() : null
    };
  }
}
