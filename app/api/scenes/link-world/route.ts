import { NextResponse } from "next/server";

import { PrismaSceneRepository } from "../../../../src/modules/scenes/scene.repository";
import { SceneWorldLinkService } from "../../../../src/modules/scenes/scene-world-link.service";
import { PrismaWorldRepository } from "../../../../src/modules/world-building/world.repository";

const sceneWorldLinkService = new SceneWorldLinkService(
  new PrismaSceneRepository(),
  new PrismaWorldRepository()
);

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await sceneWorldLinkService.linkWorldNodeToScene(payload);
    const statusCode =
      !result.ok &&
      (result.error.code === "SCENE_NOT_FOUND" || result.error.code === "WORLD_NODE_NOT_FOUND")
        ? 404
        : !result.ok &&
            (result.error.code === "VALIDATION_ERROR" ||
              result.error.code === "DUPLICATE_WORLD_REFERENCE" ||
              result.error.code === "WORLD_REFERENCE_NOT_ALLOWED")
          ? 400
          : !result.ok
            ? 500
            : 201;

    return NextResponse.json(result, { status: statusCode });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to link the world reference right now."
        }
      },
      { status: 500 }
    );
  }
}
