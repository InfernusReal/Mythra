import { NextResponse } from "next/server";

import { ChapterGuidanceService } from "../../../../../src/modules/chapters/chapter-guidance.service";
import { PrismaChapterRepository } from "../../../../../src/modules/chapters/chapter.repository";
import { PrismaSceneRepository } from "../../../../../src/modules/scenes/scene.repository";
import { NextSceneService } from "../../../../../src/modules/scenes/next-scene.service";

const chapterGuidanceService = new ChapterGuidanceService(
  new PrismaChapterRepository(),
  new PrismaSceneRepository(),
  new NextSceneService()
);

type ChapterGuidanceRouteProps = {
  params: Promise<{
    chapterId: string;
  }>;
};

export async function GET(_: Request, { params }: ChapterGuidanceRouteProps) {
  try {
    const resolvedParams = await params;
    const result = await chapterGuidanceService.getChapterGuidance({
      chapterId: resolvedParams.chapterId
    });
    const statusCode =
      !result.ok && result.error.code === "CHAPTER_NOT_FOUND"
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
          message: "Unable to load chapter guidance right now."
        }
      },
      { status: 500 }
    );
  }
}
