import { NextResponse } from "next/server";

import { PrismaChapterRepository } from "../../../../src/modules/chapters/chapter.repository";
import { ChapterLinkService } from "../../../../src/modules/chapters/chapter-link.service";

const chapterLinkService = new ChapterLinkService(new PrismaChapterRepository());

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await chapterLinkService.linkScenesToChapter(payload);
    const statusCode =
      !result.ok &&
      (result.error.code === "MILESTONE_NOT_FOUND" ||
        result.error.code === "CHAPTER_NOT_FOUND" ||
        result.error.code === "SCENE_NOT_FOUND")
        ? 404
        : !result.ok &&
            (result.error.code === "VALIDATION_ERROR" || result.error.code === "DUPLICATE_SCENE_LINK")
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
          message: "Unable to link scenes to the chapter right now."
        }
      },
      { status: 500 }
    );
  }
}
