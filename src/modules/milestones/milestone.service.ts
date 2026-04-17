import { logError, logInfo, logWarn } from "../../lib/observability/console-logger";
import { createMilestoneSchema, milestoneIdParamSchema, volumeIdQuerySchema } from "./milestone.schema";
import type { MilestoneDetailRecord, MilestoneGraphCollection, MilestoneRepository, MilestoneResult } from "./milestone.types";

export class MilestoneService {
  constructor(private readonly repository: MilestoneRepository) {}

  async getVolumeMilestones(payload: unknown): Promise<MilestoneResult<MilestoneGraphCollection>> {
    const parsedVolumeId = volumeIdQuerySchema.safeParse(payload);

    if (!parsedVolumeId.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Volume id is invalid.",
          fieldErrors: parsedVolumeId.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P03][MilestoneGraph] Volume fetch starting", {
      volumeId: parsedVolumeId.data.volumeId
    }); // SAFETY_LOG:P03_MILESTONE_VOLUME_FETCH

    const volume = await this.repository.findVolumeById(parsedVolumeId.data.volumeId);

    if (!volume) {
      logWarn("[P03][MilestoneGraph] Empty-state fallback", {
        volumeId: parsedVolumeId.data.volumeId,
        reason: "Parent volume not found"
      }); // SAFETY_LOG:P03_MILESTONE_EMPTY_STATE

      return {
        ok: false,
        error: {
          code: "VOLUME_NOT_FOUND",
          message: "The parent volume could not be found."
        }
      };
    }

    const milestones = await this.repository.listByVolumeId(parsedVolumeId.data.volumeId);

    logInfo("[P03][MilestoneGraph] Milestone list loaded", {
      volumeId: parsedVolumeId.data.volumeId,
      count: milestones.length
    }); // SAFETY_LOG:P03_MILESTONE_LIST_LOAD

    logInfo("[P03][MilestoneGraph] Graph render data built", {
      volumeId: parsedVolumeId.data.volumeId,
      cardCount: milestones.length
    }); // SAFETY_LOG:P03_MILESTONE_GRAPH_BUILD

    return {
      ok: true,
      data: {
        volume,
        milestones
      }
    };
  }

  async createMilestone(payload: unknown): Promise<MilestoneResult<MilestoneDetailRecord>> {
    const parsedPayload = createMilestoneSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Milestone details are invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P03][MilestoneGraph] Volume fetch starting", {
      volumeId: parsedPayload.data.volumeId
    }); // SAFETY_LOG:P03_MILESTONE_CREATE_VOLUME_FETCH

    const volume = await this.repository.findVolumeById(parsedPayload.data.volumeId);

    if (!volume) {
      logWarn("[P03][MilestoneGraph] Empty-state fallback", {
        volumeId: parsedPayload.data.volumeId,
        reason: "Cannot create milestone without parent volume"
      }); // SAFETY_LOG:P03_MILESTONE_CREATE_EMPTY_STATE

      return {
        ok: false,
        error: {
          code: "VOLUME_NOT_FOUND",
          message: "The parent volume could not be found."
        }
      };
    }

    try {
      const milestone = await this.repository.create(parsedPayload.data);

      return {
        ok: true,
        data: {
          volume,
          milestone
        }
      };
    } catch (error) {
      logError("[P03][MilestoneGraph] Safe fallback returned", {
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P03_MILESTONE_CREATE_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to create the milestone right now."
        }
      };
    }
  }

  async getMilestoneDetail(payload: unknown): Promise<MilestoneResult<MilestoneDetailRecord>> {
    const parsedMilestoneId = milestoneIdParamSchema.safeParse(payload);

    if (!parsedMilestoneId.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Milestone id is invalid.",
          fieldErrors: parsedMilestoneId.error.flatten().fieldErrors
        }
      };
    }

    const detail = await this.repository.findMilestoneDetailById(parsedMilestoneId.data.milestoneId);

    if (!detail) {
      return {
        ok: false,
        error: {
          code: "MILESTONE_NOT_FOUND",
          message: "The milestone detail could not be found."
        }
      };
    }

    logInfo("[P03][MilestoneGraph] Navigation target resolved", {
      milestoneId: parsedMilestoneId.data.milestoneId
    }); // SAFETY_LOG:P03_MILESTONE_NAVIGATION

    return {
      ok: true,
      data: detail
    };
  }
}
