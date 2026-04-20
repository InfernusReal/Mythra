import { NextResponse } from "next/server";

import { PrismaSceneRepository } from "../../../../src/modules/scenes/scene.repository";
import { SceneGraphService } from "../../../../src/modules/scenes/scene-graph.service";

const sceneGraphService = new SceneGraphService(new PrismaSceneRepository());

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const milestoneId = searchParams.get("milestoneId") ?? "";

  const result = await sceneGraphService.getMilestoneSceneGraph({ milestoneId });
  const statusCode =
    !result.ok && result.error.code === "MILESTONE_NOT_FOUND"
      ? 404
      : !result.ok && result.error.code === "VALIDATION_ERROR"
        ? 400
        : 200;

  return NextResponse.json(result, { status: statusCode });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await sceneGraphService.createGraphEdge(payload);
    const statusCode =
      !result.ok &&
      (result.error.code === "MILESTONE_NOT_FOUND" || result.error.code === "SCENE_NOT_FOUND")
        ? 404
        : !result.ok &&
            (result.error.code === "VALIDATION_ERROR" || result.error.code === "GRAPH_EDGE_NOT_ALLOWED")
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
          message: "Unable to update the scene graph right now."
        }
      },
      { status: 500 }
    );
  }
}
