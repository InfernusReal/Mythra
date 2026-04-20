import { prisma } from "../../lib/database/prisma";
import type {
  CreateMilestoneInput,
  MilestoneDetailRecord,
  MilestoneRecord,
  MilestoneRepository,
  VolumeSummary
} from "./milestone.types";

export class PrismaMilestoneRepository implements MilestoneRepository {
  async findVolumeById(volumeId: string): Promise<VolumeSummary | null> {
    return prisma.volume.findUnique({
      where: { id: volumeId },
      select: {
        id: true,
        title: true
      }
    });
  }

  async listByVolumeId(volumeId: string): Promise<MilestoneRecord[]> {
    return prisma.milestone.findMany({
      where: { volumeId },
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  async create(input: CreateMilestoneInput): Promise<MilestoneRecord> {
    return prisma.milestone.create({
      data: {
        volumeId: input.volumeId,
        title: input.title,
        summary: input.summary ?? null,
        maxChaptersPerMilestone: input.maxChaptersPerMilestone ?? null
      }
    });
  }

  async findMilestoneDetailById(milestoneId: string): Promise<MilestoneDetailRecord | null> {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        volume: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!milestone) {
      return null;
    }

    return {
      milestone: {
        id: milestone.id,
        volumeId: milestone.volumeId,
        title: milestone.title,
        summary: milestone.summary,
        maxChaptersPerMilestone: milestone.maxChaptersPerMilestone,
        createdAt: milestone.createdAt,
        updatedAt: milestone.updatedAt
      },
      volume: milestone.volume
    };
  }

  async findMilestoneById(milestoneId: string): Promise<MilestoneRecord | null> {
    return prisma.milestone.findUnique({
      where: { id: milestoneId }
    });
  }
}
