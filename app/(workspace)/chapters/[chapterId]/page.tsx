import { notFound } from "next/navigation";

import { ChapterEditor } from "../../../../src/components/chapters/chapter-editor";
import {
  ChapterEditorService,
  createReadonlyChapterEditorFallback
} from "../../../../src/modules/chapters/chapter-editor.service";
import {
  ChapterFormattingService,
  type ChapterFormattingPreferences
} from "../../../../src/modules/chapters/chapter-formatting.service";
import type { ChapterStructureCommandInput } from "../../../../src/modules/chapters/chapter-editor.types";
import {
  PrismaChapterFormattingRepository,
  PrismaChapterRepository
} from "../../../../src/modules/chapters/chapter.repository";
import { WorldReferenceService } from "../../../../src/modules/world-building/world-reference.service";
import { PrismaWorldRepository } from "../../../../src/modules/world-building/world.repository";

type ChapterEditorPageProps = {
  params: Promise<{
    chapterId: string;
  }>;
};

const chapterEditorService = new ChapterEditorService(new PrismaChapterRepository());
const chapterFormattingService = new ChapterFormattingService(new PrismaChapterFormattingRepository());
const worldReferenceService = new WorldReferenceService(
  new PrismaChapterRepository(),
  new PrismaWorldRepository()
);

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
  const initialWorldContextResult = initialEditor.chapter
    ? await worldReferenceService.getChapterWorldContext({
        chapterId: initialEditor.chapter.id
      })
    : null;
  const initialWorldContext = initialWorldContextResult?.ok ? initialWorldContextResult.data : null;

  async function addSceneAction(input: ChapterStructureCommandInput) {
    "use server";

    return chapterEditorService.addSceneToChapter(input);
  }

  async function removeSceneAction(input: ChapterStructureCommandInput) {
    "use server";

    return chapterEditorService.removeSceneFromChapter(input);
  }

  async function updateFormattingAction(input: {
    chapterId: string;
    fontFamily: ChapterFormattingPreferences["fontFamily"];
    fontSize: number;
    lineHeight: number;
  }) {
    "use server";

    return chapterFormattingService.updateChapterFormatting(input);
  }

  return (
    <ChapterEditor
      initialEditor={initialEditor}
      initialWorldContext={initialWorldContext}
      updateFormattingAction={updateFormattingAction}
      addSceneAction={addSceneAction}
      removeSceneAction={removeSceneAction}
    />
  );
}
