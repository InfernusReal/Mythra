import { NextResponse } from "next/server";

import { logError, logInfo } from "../../../src/lib/observability/console-logger";
import { PrismaNovelRepository } from "../../../src/modules/novels/novel.repository";
import { NovelService } from "../../../src/modules/novels/novel.service";

const novelService = new NovelService(new PrismaNovelRepository());

export async function POST(request: Request) {
  logInfo("[P01][NovelCreate] Request received", {
    method: request.method
  }); // SAFETY_LOG:P01_NOVEL_CREATE_REQUEST

  try {
    const payload = await request.json();
    const result = await novelService.createNovel(payload);

    if (!result.ok) {
      const statusCode = result.error.code === "VALIDATION_ERROR" ? 400 : 500;

      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 201 });
  } catch {
    logError("[P01][NovelCreate] Returning route fallback", {
      reason: "Request payload could not be processed"
    }); // SAFETY_LOG:P01_NOVEL_CREATE_ROUTE_FALLBACK

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to create the novel right now."
        }
      },
      { status: 500 }
    );
  }
}
