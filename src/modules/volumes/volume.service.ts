import { logError, logInfo, logWarn } from "../../lib/observability/console-logger";
import { createVolumeSchema, novelIdQuerySchema, volumeIdParamSchema } from "./volume.schema";
import type { VolumeCollection, VolumeRepository, VolumeResult, VolumeWorkspaceRecord } from "./volume.types";

export class VolumeService {
  constructor(private readonly repository: VolumeRepository) {}

  async getNovelVolumes(payload: unknown): Promise<VolumeResult<VolumeCollection>> {
    const parsedNovelId = novelIdQuerySchema.safeParse(payload);

    if (!parsedNovelId.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Novel id is invalid.",
          fieldErrors: parsedNovelId.error.flatten().fieldErrors
        }
      };
    }

    const novel = await this.repository.findNovelById(parsedNovelId.data.novelId);

    if (!novel) {
      return {
        ok: false,
        error: {
          code: "NOVEL_NOT_FOUND",
          message: "The parent novel could not be found."
        }
      };
    }

    const volumes = await this.repository.listByNovelId(parsedNovelId.data.novelId);

    return {
      ok: true,
      data: {
        novel,
        volumes
      }
    };
  }

  async createVolume(payload: unknown): Promise<VolumeResult<VolumeWorkspaceRecord>> {
    const parsedPayload = createVolumeSchema.safeParse(payload);

    if (!parsedPayload.success) {
      logWarn("[P02][VolumeCreate] Payload validation failed", {
        fieldErrors: parsedPayload.error.flatten().fieldErrors
      }); // SAFETY_LOG:P02_VOLUME_VALIDATION_FAILED

      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Volume details are invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P02][VolumeCreate] Payload validation passed", {
      novelId: parsedPayload.data.novelId,
      titleLength: parsedPayload.data.title.length
    }); // SAFETY_LOG:P02_VOLUME_VALIDATED

    logInfo("[P02][VolumeCreate] Novel lookup starting", {
      novelId: parsedPayload.data.novelId
    }); // SAFETY_LOG:P02_VOLUME_PARENT_LOOKUP

    const novel = await this.repository.findNovelById(parsedPayload.data.novelId);

    if (!novel) {
      logWarn("[P02][VolumeCreate] Missing parent fallback", {
        novelId: parsedPayload.data.novelId
      }); // SAFETY_LOG:P02_VOLUME_PARENT_CREATE_FALLBACK

      return {
        ok: false,
        error: {
          code: "NOVEL_NOT_FOUND",
          message: "The parent novel could not be found."
        }
      };
    }

    try {
      logInfo("[P02][VolumeCreate] Volume creation attempt", {
        novelId: parsedPayload.data.novelId,
        title: parsedPayload.data.title
      }); // SAFETY_LOG:P02_VOLUME_CREATE_ATTEMPT

      const volume = await this.repository.create(parsedPayload.data);

      logInfo("[P02][VolumeCreate] Success response ready", {
        volumeId: volume.id
      }); // SAFETY_LOG:P02_VOLUME_CREATE_SUCCESS

      return {
        ok: true,
        data: {
          novel,
          volume
        }
      };
    } catch (error) {
      logError("[P02][VolumeCreate] Returning safe fallback", {
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P02_VOLUME_CREATE_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to create the volume right now."
        }
      };
    }
  }

  async getVolumeWorkspace(payload: unknown): Promise<VolumeResult<VolumeWorkspaceRecord>> {
    const parsedVolumeId = volumeIdParamSchema.safeParse(payload);

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

    const workspace = await this.repository.findVolumeWorkspaceById(parsedVolumeId.data.volumeId);

    if (!workspace) {
      return {
        ok: false,
        error: {
          code: "VOLUME_NOT_FOUND",
          message: "The volume workspace could not be found."
        }
      };
    }

    return {
      ok: true,
      data: workspace
    };
  }
}
