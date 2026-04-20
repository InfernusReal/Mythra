import { notFound } from "next/navigation";

import { ChapterEditor } from "../../../../src/components/chapters/chapter-editor";
import {
  ChapterEditorService,
  createReadonlyChapterEditorFallback
} from "../../../../src/modules/chapters/chapter-editor.service";
import type { ChapterStructureCommandInput } from "../../../../src/modules/chapters/chapter-editor.types";
import { PrismaChapterRepository } from "../../../../src/modules/chapters/chapter.repository";

type ChapterEditorPageProps = {
  params: Promise<{
    chapterId: string;
  }>;
};

const chapterEditorService = new ChapterEditorService(new PrismaChapterRepository());

export default async function ChapterEditorPage({ params }: ChapterEditorPageProps) {
  const resolvedParams = await params;
  const initialResult = await chapterEditorService.getChapterEditorWorkspace({
    chapterId: resolvedParams.chapterId
  });

  if (!initialResult.ok && initialResult.error.code === "CHAPTER_NOT_FOUND") {
    notFound();
  }

  const initialEditor =
    initialResult.ok
      ? initialResult.data
      : createReadonlyChapterEditorFallback(
          initialResult.error.message ?? "The chapter editor is unavailable right now."
        );

  async function addSceneAction(input: ChapterStructureCommandInput) {
    "use server";

    return chapterEditorService.addSceneToChapter(input);
  }

  async function removeSceneAction(input: ChapterStructureCommandInput) {
    "use server";

    return chapterEditorService.removeSceneFromChapter(input);
  }

  return (
    <ChapterEditor
      initialEditor={initialEditor}
      addSceneAction={addSceneAction}
      removeSceneAction={removeSceneAction}
    />
  );
}
