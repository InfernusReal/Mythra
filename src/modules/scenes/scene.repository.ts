import { prisma } from "../../lib/database/prisma";
import type {
  CreateSceneGraphEdgeInput,
  CreateSceneInput,
  SceneGraphEdgeRecord,
  SceneMilestoneSummary,
  SceneRecord,
  SceneRepository,
  UpdateSceneInput
} from "./scene.types";

export class PrismaSceneRepository implements SceneRepository {
  async findMilestoneById(milestoneId: string): Promise<SceneMilestoneSummary | null> {
    return prisma.milestone.findUnique({
      where: { id: milestoneId },
      select: {
        id: true,
        title: true,
        volumeId: true
      }
    });
  }

  async listScenesByMilestoneId(milestoneId: string): Promise<SceneRecord[]> {
    return prisma.scene.findMany({
      where: { milestoneId },
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  async findSceneById(sceneId: string): Promise<SceneRecord | null> {
    return prisma.scene.findUnique({
      where: { id: sceneId }
    });
  }

  async createScene(input: CreateSceneInput): Promise<SceneRecord> {
    return prisma.scene.create({
      data: {
        milestoneId: input.milestoneId,
        outline: input.outline,
        explanation: input.explanation
      }
    });
  }

  async updateScene(input: UpdateSceneInput): Promise<SceneRecord> {
    return prisma.scene.update({
      where: { id: input.sceneId },
      data: {
        outline: input.outline,
        explanation: input.explanation
      }
    });
  }

  async listGraphEdgesByMilestoneId(milestoneId: string): Promise<SceneGraphEdgeRecord[]> {
    return prisma.sceneGraphEdge.findMany({
      where: { milestoneId },
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  async findGraphEdgeByNodes(fromSceneId: string, toSceneId: string): Promise<SceneGraphEdgeRecord | null> {
    return prisma.sceneGraphEdge.findUnique({
      where: {
        fromSceneId_toSceneId: {
          fromSceneId,
          toSceneId
        }
      }
    });
  }

  async createGraphEdge(input: CreateSceneGraphEdgeInput): Promise<SceneGraphEdgeRecord> {
    return prisma.sceneGraphEdge.create({
      data: {
        milestoneId: input.milestoneId,
        fromSceneId: input.fromSceneId,
        toSceneId: input.toSceneId,
        relationship: input.relationship
      }
    });
  }
}
