import { prisma } from "../../lib/database/prisma";
import type {
  CreateVolumeInput,
  NovelSummary,
  VolumeRecord,
  VolumeRepository,
  VolumeWorkspaceRecord
} from "./volume.types";

export class PrismaVolumeRepository implements VolumeRepository {
  async findNovelById(novelId: string): Promise<NovelSummary | null> {
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      select: {
        id: true,
        title: true
      }
    });

    return novel;
  }

  async listByNovelId(novelId: string): Promise<VolumeRecord[]> {
    return prisma.volume.findMany({
      where: { novelId },
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  async create(input: CreateVolumeInput): Promise<VolumeRecord> {
    return prisma.volume.create({
      data: {
        novelId: input.novelId,
        title: input.title,
        description: input.description ?? null
      }
    });
  }

  async findVolumeWorkspaceById(volumeId: string): Promise<VolumeWorkspaceRecord | null> {
    const volume = await prisma.volume.findUnique({
      where: { id: volumeId },
      include: {
        novel: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!volume) {
      return null;
    }

    return {
      volume: {
        id: volume.id,
        novelId: volume.novelId,
        title: volume.title,
        description: volume.description,
        createdAt: volume.createdAt,
        updatedAt: volume.updatedAt
      },
      novel: volume.novel
    };
  }
}
