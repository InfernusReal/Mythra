import { NextResponse } from "next/server";

import { PrismaVolumeRepository } from "../../../src/modules/volumes/volume.repository";
import { VolumeService } from "../../../src/modules/volumes/volume.service";

const volumeService = new VolumeService(new PrismaVolumeRepository());

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const novelId = searchParams.get("novelId") ?? "";

  const result = await volumeService.getNovelVolumes({ novelId });
  const statusCode =
    !result.ok && result.error.code === "NOVEL_NOT_FOUND"
      ? 404
      : !result.ok && result.error.code === "VALIDATION_ERROR"
        ? 400
        : 200;

  return NextResponse.json(result, { status: statusCode });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await volumeService.createVolume(payload);

    if (!result.ok) {
      const statusCode =
        result.error.code === "VALIDATION_ERROR" ? 400 : result.error.code === "NOVEL_NOT_FOUND" ? 404 : 500;

      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to create the volume right now."
        }
      },
      { status: 500 }
    );
  }
}
