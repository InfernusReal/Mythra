import { NextResponse } from "next/server";

import { PrismaChapterRepository } from "../../../src/modules/chapters/chapter.repository";
import { ChapterService } from "../../../src/modules/chapters/chapter.service";

const chapterService = new ChapterService(new PrismaChapterRepository());

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const milestoneId = searchParams.get("milestoneId") ?? "";

  const result = await chapterService.getMilestoneChapterWorkspace({ milestoneId });
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
    const result = await chapterService.createChapter(payload);
    const statusCode =
      !result.ok && result.error.code === "MILESTONE_NOT_FOUND"
        ? 404
        : !result.ok &&
            (result.error.code === "VALIDATION_ERROR" || result.error.code === "CHAPTER_LIMIT_REACHED")
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
          message: "Unable to create the chapter right now."
        }
      },
      { status: 500 }
    );
  }
}
