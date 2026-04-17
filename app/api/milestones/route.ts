import { NextResponse } from "next/server";

import { PrismaMilestoneRepository } from "../../../src/modules/milestones/milestone.repository";
import { MilestoneService } from "../../../src/modules/milestones/milestone.service";

const milestoneService = new MilestoneService(new PrismaMilestoneRepository());

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const volumeId = searchParams.get("volumeId") ?? "";

  const result = await milestoneService.getVolumeMilestones({ volumeId });
  const statusCode =
    !result.ok && result.error.code === "VOLUME_NOT_FOUND"
      ? 404
      : !result.ok && result.error.code === "VALIDATION_ERROR"
        ? 400
        : 200;

  return NextResponse.json(result, { status: statusCode });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await milestoneService.createMilestone(payload);
    const statusCode =
      !result.ok && result.error.code === "VOLUME_NOT_FOUND"
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
          message: "Unable to create the milestone right now."
        }
      },
      { status: 500 }
    );
  }
}
