import { logError, logInfo, logWarn } from "../../lib/observability/console-logger";
import { createSceneSchema, updateSceneSchema } from "./scene.schema";
import type {
  SceneDetailRecord,
  SceneRepository,
  SceneResult
} from "./scene.types";

export class SceneService {
  constructor(private readonly repository: SceneRepository) {}

  async createScene(payload: unknown): Promise<SceneResult<SceneDetailRecord>> {
    const parsedPayload = createSceneSchema.safeParse(payload);

    if (!parsedPayload.success) {
      this.logOutlineMissing(parsedPayload.error.flatten().fieldErrors.outline);

      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Scene details are invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    this.logSceneValidation({ milestoneId: parsedPayload.data.milestoneId });

    logInfo("[P05][SceneAuthoring] Milestone lookup starting", {
      milestoneId: parsedPayload.data.milestoneId
    }); // SAFETY_LOG:P05_SCENE_PARENT_LOOKUP

    const milestone = await this.repository.findMilestoneById(parsedPayload.data.milestoneId);

    if (!milestone) {
      return {
        ok: false,
        error: {
          code: "MILESTONE_NOT_FOUND",
          message: "The parent milestone could not be found."
        }
      };
    }

    try {
      const scene = await this.repository.createScene(parsedPayload.data);

      return {
        ok: true,
        data: {
          milestone,
          scene
        }
      };
    } catch (error) {
      logError("[P05][SceneAuthoring] Safe create fallback", {
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P05_SCENE_CREATE_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to create the scene right now."
        }
      };
    }
  }

  async updateScene(payload: unknown): Promise<SceneResult<SceneDetailRecord>> {
    const parsedPayload = updateSceneSchema.safeParse(payload);

    if (!parsedPayload.success) {
      this.logOutlineMissing(parsedPayload.error.flatten().fieldErrors.outline);

      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Scene details are invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    this.logSceneValidation({ sceneId: parsedPayload.data.sceneId });

    const existingScene = await this.repository.findSceneById(parsedPayload.data.sceneId);

    if (!existingScene) {
      return {
        ok: false,
        error: {
          code: "SCENE_NOT_FOUND",
          message: "The scene could not be found."
        }
      };
    }

    const milestone = await this.repository.findMilestoneById(existingScene.milestoneId);

    if (!milestone) {
      return {
        ok: false,
        error: {
          code: "MILESTONE_NOT_FOUND",
          message: "The parent milestone could not be found."
        }
      };
    }

    try {
      const scene = await this.repository.updateScene(parsedPayload.data);

      return {
        ok: true,
        data: {
          milestone,
          scene
        }
      };
    } catch (error) {
      logError("[P05][SceneAuthoring] Safe update fallback", {
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P05_SCENE_UPDATE_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to update the scene right now."
        }
      };
    }
  }

  private logOutlineMissing(fieldErrors: string[] | undefined) {
    if (!fieldErrors) {
      return;
    }

    logWarn("[P05][SceneAuthoring] Outline missing failure", {
      fieldErrors
    }); // SAFETY_LOG:P05_SCENE_OUTLINE_MISSING
  }

  private logSceneValidation(context: Record<string, string>) {
    logInfo("[P05][SceneAuthoring] Scene validation passed", context); // SAFETY_LOG:P05_SCENE_VALIDATION
  }
}
