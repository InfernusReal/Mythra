import { NextResponse } from "next/server";

import { WorldNodeService } from "../../../../src/modules/world-building/world-node.service";
import { PrismaWorldRepository } from "../../../../src/modules/world-building/world.repository";

const worldNodeService = new WorldNodeService(new PrismaWorldRepository());

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await worldNodeService.getWorldNodesByLayer({
      volumeId: searchParams.get("volumeId") ?? "",
      layerKey: searchParams.get("layerKey") ?? ""
    });
    const statusCode =
      !result.ok && (result.error.code === "VOLUME_NOT_FOUND" || result.error.code === "WORLD_LAYER_NOT_FOUND")
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
          message: "Unable to load world nodes right now."
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await worldNodeService.upsertWorldNode(payload);
    const statusCode =
      !result.ok &&
      (result.error.code === "VOLUME_NOT_FOUND" ||
        result.error.code === "WORLD_LAYER_NOT_FOUND" ||
        result.error.code === "WORLD_NODE_NOT_FOUND")
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
          message: "Unable to save the world node right now."
        }
      },
      { status: 500 }
    );
  }
}
