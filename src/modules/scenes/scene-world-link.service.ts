import { logError, logInfo } from "../../lib/observability/console-logger";
import type { WorldRepository } from "../world-building/world-layer.types";
import { linkWorldNodeToSceneSchema } from "../world-building/world-reference.schema";
import type {
  SceneWorldLinkRecord,
  WorldReferenceResult
} from "../world-building/world-reference.types";
import type { SceneRepository } from "./scene.types";

export class SceneWorldLinkService {
  constructor(
    private readonly sceneRepository: SceneRepository,
    private readonly worldRepository: WorldRepository
  ) {}

  async linkWorldNodeToScene(payload: unknown): Promise<WorldReferenceResult<SceneWorldLinkRecord>> {
    const parsedPayload = linkWorldNodeToSceneSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Scene-world reference details are invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P13][SceneWorldLink] Scene-world lookup starting", {
      sceneId: parsedPayload.data.sceneId,
      worldNodeId: parsedPayload.data.worldNodeId
    }); // SAFETY_LOG:P13_SCENE_WORLD_LOOKUP

    try {
      const [scene, worldNode, existingLink] = await Promise.all([
        this.sceneRepository.findSceneById(parsedPayload.data.sceneId),
        this.worldRepository.findNodeById(parsedPayload.data.worldNodeId),
        this.worldRepository.findSceneWorldLink(parsedPayload.data.sceneId, parsedPayload.data.worldNodeId)
      ]);

      if (!scene) {
        return {
          ok: false,
          error: {
            code: "SCENE_NOT_FOUND",
            message: "The selected scene could not be found."
          }
        };
      }

      if (!worldNode) {
        return {
          ok: false,
          error: {
            code: "WORLD_NODE_NOT_FOUND",
            message: "The selected world node could not be found."
          }
        };
      }

      if (existingLink) {
        return {
          ok: false,
          error: {
            code: "DUPLICATE_WORLD_REFERENCE",
            message: "This world node is already linked to the selected scene."
          }
        };
      }

      const milestone = await this.sceneRepository.findMilestoneById(scene.milestoneId);

      if (!milestone || milestone.volumeId !== worldNode.volumeId) {
        return {
          ok: false,
          error: {
            code: "WORLD_REFERENCE_NOT_ALLOWED",
            message: "World nodes can only be linked to scenes inside the same volume."
          }
        };
      }

      const link = await this.worldRepository.createSceneWorldLink(parsedPayload.data);

      return {
        ok: true,
        data: link
      };
    } catch (error) {
      logError("[P13][SceneWorldLink] Returning safe fallback", {
        sceneId: parsedPayload.data.sceneId,
        worldNodeId: parsedPayload.data.worldNodeId,
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P13_SCENE_WORLD_LINK_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to link the world reference right now."
        }
      };
    }
  }
}
