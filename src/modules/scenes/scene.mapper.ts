import type { SceneRecord } from "./scene.types";

export function formatSceneLabel(scene: SceneRecord, index: number): string {
  return `Scene ${index + 1}`;
}
