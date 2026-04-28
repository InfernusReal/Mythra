import { NextResponse } from "next/server";

import { ChapterExportService } from "../../../../../src/modules/chapters/chapter-export.service";
import { PrismaChapterExportRepository } from "../../../../../src/modules/chapters/chapter.repository";

const chapterExportService = new ChapterExportService(new PrismaChapterExportRepository());

type ChapterExportRouteProps = {
  params: Promise<{
    chapterId: string;
  }>;
};

export async function GET(_: Request, { params }: ChapterExportRouteProps) {
  try {
    const resolvedParams = await params;
    const result = await chapterExportService.exportChapterAsDoc({
      chapterId: resolvedParams.chapterId
    });

    if (!result.ok) {
      const statusCode =
        result.error.code === "CHAPTER_NOT_FOUND"
          ? 404
          : result.error.code === "VALIDATION_ERROR"
            ? 400
            : 500;

      return NextResponse.json(result, { status: statusCode });
    }

    return new Response(result.data.body, {
      status: 200,
      headers: {
        "Content-Type": result.data.contentType,
        "Content-Disposition": `attachment; filename="${result.data.fileName}"`
      }
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to export this chapter right now."
        }
      },
      { status: 500 }
    );
  }
}
