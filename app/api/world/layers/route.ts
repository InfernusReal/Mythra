import { NextResponse } from "next/server";

import { WorldLayerService } from "../../../../src/modules/world-building/world-layer.service";
import { WorldRuleEngineService } from "../../../../src/modules/world-building/world-rule-engine.service";
import { PrismaWorldRepository } from "../../../../src/modules/world-building/world.repository";

const worldLayerService = new WorldLayerService(new PrismaWorldRepository(), new WorldRuleEngineService());

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await worldLayerService.getVolumeWorldLayers({
      volumeId: searchParams.get("volumeId") ?? ""
    });
    const statusCode =
      !result.ok && result.error.code === "VOLUME_NOT_FOUND"
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
          message: "Unable to load world-building layers right now."
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await worldLayerService.updateWorldLayer(payload);
    const statusCode =
      !result.ok && result.error.code === "VOLUME_NOT_FOUND"
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
          message: "Unable to save world-layer settings right now."
        }
      },
      { status: 500 }
    );
  }
}
