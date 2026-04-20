import { logInfo, logWarn } from "../../lib/observability/console-logger";
import type { ChapterSceneSummary } from "../chapters/chapter.types";
import type { SceneGraphEdgeRecord } from "./scene.types";

export type NextSceneSuggestionRecord = {
  sceneId: string;
  outline: string;
  explanation: string;
  relationship: string | null;
  resolutionSource: "GRAPH_EDGE" | "FIRST_AVAILABLE";
  reasonLabel: string;
};

type ResolveNextSceneInput = {
  linkedSceneIdsInOrder: string[];
  availableScenes: ChapterSceneSummary[];
  graphEdges: SceneGraphEdgeRecord[];
};

export class NextSceneService {
  resolveNextScene(input: ResolveNextSceneInput): NextSceneSuggestionRecord | null {
    if (input.availableScenes.length === 0) {
      logWarn("[P10][NextScene] No suggestion fallback used", {
        reason: "No available scenes remain for this chapter."
      }); // SAFETY_LOG:P10_NO_SUGGESTION_FALLBACK_EMPTY_STATE

      return null;
    }

    const availableSceneMap = new Map(input.availableScenes.map((scene) => [scene.id, scene]));
    const lastLinkedSceneId =
      input.linkedSceneIdsInOrder.length > 0 ? input.linkedSceneIdsInOrder[input.linkedSceneIdsInOrder.length - 1] : null;
    const graphEdgeCandidate =
      lastLinkedSceneId === null
        ? null
        : input.graphEdges.find(
            (edge) => edge.fromSceneId === lastLinkedSceneId && availableSceneMap.has(edge.toSceneId)
          ) ?? null;

    const resolvedScene =
      graphEdgeCandidate === null ? input.availableScenes[0] : availableSceneMap.get(graphEdgeCandidate.toSceneId) ?? null;

    if (!resolvedScene) {
      logWarn("[P10][NextScene] No suggestion fallback used", {
        reason: "No available scene could be resolved from the current milestone."
      }); // SAFETY_LOG:P10_NO_SUGGESTION_FALLBACK_RESOLUTION

      return null;
    }

    const suggestion: NextSceneSuggestionRecord = {
      sceneId: resolvedScene.id,
      outline: resolvedScene.outline,
      explanation: resolvedScene.explanation,
      relationship: graphEdgeCandidate?.relationship ?? null,
      resolutionSource: graphEdgeCandidate === null ? "FIRST_AVAILABLE" : "GRAPH_EDGE",
      reasonLabel:
        graphEdgeCandidate === null
          ? "Next available scene in milestone order."
          : `Recommended by the scene graph via ${graphEdgeCandidate.relationship.toLowerCase()}.`
    };

    logInfo("[P10][NextScene] Suggestion resolved", {
      sceneId: suggestion.sceneId,
      source: suggestion.resolutionSource,
      relationship: suggestion.relationship
    }); // SAFETY_LOG:P10_NEXT_SCENE_RESOLUTION

    return suggestion;
  }
}
