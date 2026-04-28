import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/database/prisma";
import type {
  ChapterMilestoneSummary,
  ChapterRecord,
  ChapterRepository,
  ChapterSceneLinkDetail,
  ChapterSceneLinkRecord,
  ChapterSceneSummary,
  ChapterTransactionRepository,
  CreateChapterInput
} from "./chapter.types";
import type {
  ChapterFormattingPreferences,
  ChapterFormattingRepository
} from "./chapter-formatting.service";
import type { ChapterExportRepository } from "./chapter-export.service";

class PrismaChapterTransactionRepository implements ChapterTransactionRepository {
  constructor(private readonly transactionClient: Prisma.TransactionClient) {}

  async countChaptersByMilestoneId(milestoneId: string): Promise<number> {
    return this.transactionClient.chapter.count({
      where: { milestoneId }
    });
  }

  async createChapter(input: CreateChapterInput): Promise<ChapterRecord> {
    return this.transactionClient.chapter.create({
      data: {
        milestoneId: input.milestoneId,
        title: input.title
      }
    });
  }

  async findChapterById(chapterId: string): Promise<ChapterRecord | null> {
    return this.transactionClient.chapter.findUnique({
      where: { id: chapterId }
    });
  }

  async updateChapterDraft(input: {
    chapterId: string;
    body: string;
    wordCount: number;
    savedVersion: number;
  }): Promise<ChapterRecord> {
    return this.transactionClient.chapter.update({
      where: { id: input.chapterId },
      data: {
        body: input.body,
        wordCount: input.wordCount,
        savedVersion: input.savedVersion
      }
    });
  }

  async listScenesByMilestoneId(milestoneId: string): Promise<ChapterSceneSummary[]> {
    return this.transactionClient.scene.findMany({
      where: { milestoneId },
      orderBy: {
        createdAt: "asc"
      },
      select: {
        id: true,
        milestoneId: true,
        outline: true,
        explanation: true
      }
    });
  }

  async findChapterSceneLink(chapterId: string, sceneId: string): Promise<ChapterSceneLinkRecord | null> {
    return this.transactionClient.chapterSceneLink.findUnique({
      where: {
        chapterId_sceneId: {
          chapterId,
          sceneId
        }
      }
    });
  }

  async createChapterSceneLinks(chapterId: string, sceneIds: string[]): Promise<ChapterSceneLinkRecord[]> {
    const existingLinks = await this.transactionClient.chapterSceneLink.findMany({
      where: { chapterId },
      orderBy: {
        sortOrder: "asc"
      }
    });
    const startingSortOrder =
      existingLinks.length > 0 ? existingLinks[existingLinks.length - 1].sortOrder + 1 : 1;

    return Promise.all(
      sceneIds.map((sceneId, index) =>
        this.transactionClient.chapterSceneLink.create({
          data: {
            chapterId,
            sceneId,
            sortOrder: startingSortOrder + index
          }
        })
      )
    );
  }

  async deleteChapterSceneLink(chapterId: string, sceneId: string): Promise<void> {
    await this.transactionClient.chapterSceneLink.delete({
      where: {
        chapterId_sceneId: {
          chapterId,
          sceneId
        }
      }
    });
  }

  async normalizeChapterSceneLinkSortOrder(chapterId: string): Promise<void> {
    const links = await this.transactionClient.chapterSceneLink.findMany({
      where: { chapterId },
      orderBy: {
        sortOrder: "asc"
      }
    });

    await Promise.all(
      links.map((link, index) =>
        this.transactionClient.chapterSceneLink.update({
          where: { id: link.id },
          data: {
            sortOrder: index + 1
          }
        })
      )
    );
  }
}

export class PrismaChapterRepository implements ChapterRepository {
  async findMilestoneById(milestoneId: string): Promise<ChapterMilestoneSummary | null> {
    return prisma.milestone.findUnique({
      where: { id: milestoneId },
      select: {
        id: true,
        title: true,
        volumeId: true,
        maxChaptersPerMilestone: true
      }
    });
  }

  async listChaptersByMilestoneId(milestoneId: string): Promise<ChapterRecord[]> {
    return prisma.chapter.findMany({
      where: { milestoneId },
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  async listScenesByMilestoneId(milestoneId: string): Promise<ChapterSceneSummary[]> {
    return prisma.scene.findMany({
      where: { milestoneId },
      orderBy: {
        createdAt: "asc"
      },
      select: {
        id: true,
        milestoneId: true,
        outline: true,
        explanation: true
      }
    });
  }

  async countChaptersByMilestoneId(milestoneId: string): Promise<number> {
    return prisma.chapter.count({
      where: { milestoneId }
    });
  }

  async createChapter(input: CreateChapterInput): Promise<ChapterRecord> {
    return prisma.chapter.create({
      data: {
        milestoneId: input.milestoneId,
        title: input.title
      }
    });
  }

  async findChapterById(chapterId: string): Promise<ChapterRecord | null> {
    return prisma.chapter.findUnique({
      where: { id: chapterId }
    });
  }

  async updateChapterDraft(input: {
    chapterId: string;
    body: string;
    wordCount: number;
    savedVersion: number;
  }): Promise<ChapterRecord> {
    return prisma.chapter.update({
      where: { id: input.chapterId },
      data: {
        body: input.body,
        wordCount: input.wordCount,
        savedVersion: input.savedVersion
      }
    });
  }

  async listChapterSceneLinksByMilestoneId(milestoneId: string): Promise<ChapterSceneLinkDetail[]> {
    const links = await prisma.chapterSceneLink.findMany({
      where: {
        chapter: {
          milestoneId
        }
      },
      include: {
        scene: {
          select: {
            outline: true,
            explanation: true
          }
        }
      },
      orderBy: {
        sortOrder: "asc"
      }
    });

    return links.map((link: (typeof links)[number]) => ({
      id: link.id,
      chapterId: link.chapterId,
      sceneId: link.sceneId,
      sortOrder: link.sortOrder,
      sceneOutline: link.scene.outline,
      sceneExplanation: link.scene.explanation
    }));
  }

  async findChapterSceneLink(chapterId: string, sceneId: string): Promise<ChapterSceneLinkRecord | null> {
    return prisma.chapterSceneLink.findUnique({
      where: {
        chapterId_sceneId: {
          chapterId,
          sceneId
        }
      }
    });
  }

  async createChapterSceneLinks(chapterId: string, sceneIds: string[]): Promise<ChapterSceneLinkRecord[]> {
    const transactionRepository = new PrismaChapterTransactionRepository(prisma);
    return transactionRepository.createChapterSceneLinks(chapterId, sceneIds);
  }

  async deleteChapterSceneLink(chapterId: string, sceneId: string): Promise<void> {
    const transactionRepository = new PrismaChapterTransactionRepository(prisma);
    await transactionRepository.deleteChapterSceneLink(chapterId, sceneId);
  }

  async normalizeChapterSceneLinkSortOrder(chapterId: string): Promise<void> {
    const transactionRepository = new PrismaChapterTransactionRepository(prisma);
    await transactionRepository.normalizeChapterSceneLinkSortOrder(chapterId);
  }

  async runInTransaction<T>(handler: (transaction: ChapterTransactionRepository) => Promise<T>): Promise<T> {
    return prisma.$transaction(async (transactionClient) => {
      const transactionRepository = new PrismaChapterTransactionRepository(transactionClient);
      return handler(transactionRepository);
    });
  }
}

export class PrismaChapterFormattingRepository implements ChapterFormattingRepository {
  async findChapterById(chapterId: string): Promise<ChapterRecord | null> {
    return prisma.chapter.findUnique({
      where: { id: chapterId }
    });
  }

  async updateChapterFormatting(input: {
    chapterId: string;
    preferences: ChapterFormattingPreferences;
  }): Promise<ChapterRecord> {
    return prisma.chapter.update({
      where: { id: input.chapterId },
      data: {
        fontFamily: input.preferences.fontFamily,
        fontSize: input.preferences.fontSize,
        lineHeight: input.preferences.lineHeight
      }
    });
  }
}

export class PrismaChapterExportRepository implements ChapterExportRepository {
  async findChapterById(chapterId: string): Promise<ChapterRecord | null> {
    return prisma.chapter.findUnique({
      where: { id: chapterId }
    });
  }
}
