import { prisma } from "../../lib/database/prisma";
import type { CreateNovelInput, NovelRecord, NovelRepository } from "./novel.types";

export class PrismaNovelRepository implements NovelRepository {
  async create(input: CreateNovelInput): Promise<NovelRecord> {
    const novel = await prisma.novel.create({
      data: {
        title: input.title,
        description: input.description ?? null
      }
    });

    return novel;
  }
}
