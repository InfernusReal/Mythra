import { NextResponse } from "next/server";

import { ChapterGuardrailsService } from "../../../../../src/modules/chapters/chapter-guardrails.service";
import { ChapterSaveService } from "../../../../../src/modules/chapters/chapter-save.service";
import { PrismaChapterRepository } from "../../../../../src/modules/chapters/chapter.repository";

const chapterSaveService = new ChapterSaveService(
  new PrismaChapterRepository(),
  new ChapterGuardrailsService()
);

type ChapterSaveRouteProps = {
  params: Promise<{
    chapterId: string;
  }>;
};

export async function POST(request: Request, { params }: ChapterSaveRouteProps) {
  try {
    const [resolvedParams, payload] = await Promise.all([params, request.json()]);
    const result = await chapterSaveService.saveChapterDraft({
      ...payload,
      chapterId: resolvedParams.chapterId
    });
    const statusCode =
      !result.ok && result.error.code === "CHAPTER_NOT_FOUND"
        ? 404
        : !result.ok && result.error.code === "SAVE_CONFLICT"
          ? 409
          : !result.ok && (result.error.code === "VALIDATION_ERROR" || result.error.code === "WORD_LIMIT_REACHED")
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
          message: "Unable to save the chapter right now. The local draft should be preserved."
        }
      },
      { status: 500 }
    );
  }
}
