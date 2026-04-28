import { logError, logInfo, logWarn } from "../../lib/observability/console-logger";
import { scheduleReminder, shouldQueueReminder } from "../../lib/jobs/reminder-scheduler";
import { worldReminderScanSchema } from "./world-node.schema";
import { WORLD_NODE_REQUIRED_FIELDS } from "./world-node.types";
import type {
  PersistedWorldNodeRecord,
  WorldNodeRequiredField,
  WorldNodeResult,
  WorldReminderQueuedRecord,
  WorldReminderScanRecord
} from "./world-node.types";
import type { WorldRepository } from "./world-layer.types";

function resolveMissingRequiredFields(node: PersistedWorldNodeRecord): WorldNodeRequiredField[] {
  return WORLD_NODE_REQUIRED_FIELDS.filter((fieldName) => {
    const value = node[fieldName];

    if (!value) {
      return true;
    }

    return value.trim().length === 0;
  });
}

export class WorldReminderService {
  constructor(private readonly repository: WorldRepository) {}

  async queueIncompleteNodeReminders(payload: unknown): Promise<WorldNodeResult<WorldReminderScanRecord>> {
    const parsedPayload = worldReminderScanSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Reminder scan request is invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P12][WorldReminder] Reminder scan starting", {
      volumeId: parsedPayload.data.volumeId
    }); // SAFETY_LOG:P12_REMINDER_SCAN

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

      const [layers, nodes] = await Promise.all([
        this.repository.listLayersByVolumeId(parsedPayload.data.volumeId),
        this.repository.listNodesByVolumeId(parsedPayload.data.volumeId)
      ]);
      const layerKeyById = new Map(layers.map((layer) => [layer.id, layer.layerKey]));
      const now = new Date();
      const reminders: WorldReminderQueuedRecord[] = [];

      for (const node of nodes) {
        const missingRequiredFields = resolveMissingRequiredFields(node);

        if (missingRequiredFields.length === 0) {
          continue;
        }

        if (!shouldQueueReminder(node.nextReminderDueAt, now)) {
          logWarn("[P12][WorldReminder] Reminder safe skip fallback", {
            nodeId: node.id,
            nodeName: node.name,
            reason: "Node reminder is not due yet."
          }); // SAFETY_LOG:P12_REMINDER_SAFE_SKIP_FALLBACK

          continue;
        }

        const reminderSchedule = scheduleReminder({
          referenceDate: now,
          missingFieldCount: missingRequiredFields.length
        });

        await this.repository.updateNodeReminderSchedule({
          nodeId: node.id,
          lastReminderQueuedAt: now,
          nextReminderDueAt: reminderSchedule.nextReminderDueAt
        });

        const layerKey = layerKeyById.get(node.layerId);

        if (!layerKey) {
          logWarn("[P12][WorldReminder] Reminder safe skip fallback", {
            nodeId: node.id,
            nodeName: node.name,
            reason: "Node layer mapping could not be resolved."
          }); // SAFETY_LOG:P12_REMINDER_SAFE_SKIP_FALLBACK_LAYER_MAP

          continue;
        }

        logInfo("[P12][WorldReminder] Reminder queued", {
          nodeId: node.id,
          nodeName: node.name,
          missingRequiredFieldCount: missingRequiredFields.length,
          intervalDays: reminderSchedule.intervalDays
        }); // SAFETY_LOG:P12_REMINDER_QUEUED

        reminders.push({
          nodeId: node.id,
          nodeName: node.name,
          layerKey,
          missingRequiredFields,
          queuedAt: now.toISOString(),
          nextReminderDueAt: reminderSchedule.nextReminderDueAt.toISOString(),
          intervalDays: reminderSchedule.intervalDays
        });
      }

      return {
        ok: true,
        data: {
          volume,
          scannedNodeCount: nodes.length,
          queuedReminderCount: reminders.length,
          reminders
        }
      };
    } catch (error) {
      logError("[P12][WorldReminder] Returning safe fallback", {
        volumeId: parsedPayload.data.volumeId,
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P12_REMINDER_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to queue world-node reminders right now."
        }
      };
    }
  }
}
