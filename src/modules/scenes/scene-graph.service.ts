import { logError, logInfo, logWarn } from "../../lib/observability/console-logger";
import { createSceneGraphEdgeSchema, sceneMilestoneQuerySchema } from "./scene.schema";
import type {
  CreateSceneGraphEdgeInput,
  SceneGraphCollection,
  SceneGraphRelationship,
  SceneRecord,
  SceneRepository,
  SceneResult
} from "./scene.types";

export class SceneGraphService {
  constructor(private readonly repository: SceneRepository) {}

  async getMilestoneSceneGraph(payload: unknown): Promise<SceneResult<SceneGraphCollection>> {
    const parsedPayload = sceneMilestoneQuerySchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Milestone id is invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

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

    const [scenes, edges] = await Promise.all([
      this.repository.listScenesByMilestoneId(parsedPayload.data.milestoneId),
      this.repository.listGraphEdgesByMilestoneId(parsedPayload.data.milestoneId)
    ]);

    if (scenes.length === 0) {
      logWarn("[P05][SceneGraph] Degraded empty-graph fallback", {
        milestoneId: parsedPayload.data.milestoneId
      }); // SAFETY_LOG:P05_SCENE_EMPTY_GRAPH_FALLBACK
    }

    const relationships = this.buildRelationships(scenes, edges);

    logInfo("[P05][SceneGraph] Graph rebuild completed", {
      milestoneId: parsedPayload.data.milestoneId,
      sceneCount: scenes.length,
      relationshipCount: relationships.length
    }); // SAFETY_LOG:P05_SCENE_GRAPH_REBUILD

    return {
      ok: true,
      data: {
        milestone,
        scenes,
        relationships
      }
    };
  }

  async createGraphEdge(payload: unknown): Promise<SceneResult<SceneGraphCollection>> {
    const parsedPayload = createSceneGraphEdgeSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Scene graph relationship is invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P05][SceneGraph] Graph edge create request", {
      milestoneId: parsedPayload.data.milestoneId,
      fromSceneId: parsedPayload.data.fromSceneId,
      toSceneId: parsedPayload.data.toSceneId
    }); // SAFETY_LOG:P05_SCENE_GRAPH_EDGE_REQUEST

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

    const [fromScene, toScene, existingEdge] = await Promise.all([
      this.repository.findSceneById(parsedPayload.data.fromSceneId),
      this.repository.findSceneById(parsedPayload.data.toSceneId),
      this.repository.findGraphEdgeByNodes(parsedPayload.data.fromSceneId, parsedPayload.data.toSceneId)
    ]);

    if (!fromScene || !toScene) {
      return {
        ok: false,
        error: {
          code: "SCENE_NOT_FOUND",
          message: "Both scenes must exist before they can be connected."
        }
      };
    }

    if (fromScene.milestoneId !== milestone.id || toScene.milestoneId !== milestone.id) {
      return {
        ok: false,
        error: {
          code: "GRAPH_EDGE_NOT_ALLOWED",
          message: "Scenes can only be linked inside the same milestone."
        }
      };
    }

    if (existingEdge) {
      return {
        ok: false,
        error: {
          code: "GRAPH_EDGE_NOT_ALLOWED",
          message: "That scene transition already exists."
        }
      };
    }

    try {
      await this.repository.createGraphEdge(parsedPayload.data);
      return this.getMilestoneSceneGraph({
        milestoneId: parsedPayload.data.milestoneId
      });
    } catch (error) {
      logError("[P05][SceneGraph] Safe graph fallback", {
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P05_SCENE_GRAPH_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to update the scene graph right now."
        }
      };
    }
  }

  private buildRelationships(
    scenes: SceneRecord[],
    edges: Awaited<ReturnType<SceneRepository["listGraphEdgesByMilestoneId"]>>
  ): SceneGraphRelationship[] {
    const sceneMap = new Map(scenes.map((scene) => [scene.id, scene]));

    return edges.flatMap((edge) => {
      const fromScene = sceneMap.get(edge.fromSceneId);
      const toScene = sceneMap.get(edge.toSceneId);

      if (!fromScene || !toScene) {
        return [];
      }

      return [
        {
          id: edge.id,
          fromSceneId: edge.fromSceneId,
          toSceneId: edge.toSceneId,
          relationship: edge.relationship,
          fromSceneOutline: fromScene.outline,
          toSceneOutline: toScene.outline
        }
      ];
    });
  }
}
