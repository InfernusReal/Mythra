import { NextResponse } from "next/server";

import { PrismaSceneRepository } from "../../../src/modules/scenes/scene.repository";
import { SceneService } from "../../../src/modules/scenes/scene.service";

const sceneService = new SceneService(new PrismaSceneRepository());

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await sceneService.createScene(payload);
    const statusCode =
      !result.ok && result.error.code === "MILESTONE_NOT_FOUND"
        ? 404
        : !result.ok && result.error.code === "VALIDATION_ERROR"
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
          message: "Unable to create the scene right now."
        }
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = await request.json();
    const result = await sceneService.updateScene(payload);
    const statusCode =
      !result.ok && (result.error.code === "SCENE_NOT_FOUND" || result.error.code === "MILESTONE_NOT_FOUND")
        ? 404
        : !result.ok && result.error.code === "VALIDATION_ERROR"
          ? 400
          : !result.ok
            ? 500
            : 200;

    return NextResponse.json(result, { status: statusCode });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to update the scene right now."
        }
      },
      { status: 500 }
    );
  }
}
