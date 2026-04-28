import { prisma } from "../../lib/database/prisma";
import type {
  CreateWorldLayerInput,
  PersistedWorldLayerRecord,
  UpdateWorldLayerInput,
  WorldRepository,
  WorldVolumeSummary
} from "./world-layer.types";
import { WORLD_NODE_REQUIRED_FIELDS } from "./world-node.types";
import type { PersistedWorldNodeRecord, WorldLayerSummary } from "./world-node.types";
import type {
  LinkWorldNodeToSceneInput,
  SceneWorldLinkRecord,
  WorldReferenceNodeRecord
} from "./world-reference.types";

export class PrismaWorldRepository implements WorldRepository {
  async findVolumeSummaryById(volumeId: string): Promise<WorldVolumeSummary | null> {
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
      id: volume.id,
      title: volume.title,
      novelId: volume.novel.id,
      novelTitle: volume.novel.title
    };
  }

  async listLayersByVolumeId(volumeId: string): Promise<PersistedWorldLayerRecord[]> {
    return prisma.worldLayer.findMany({
      where: { volumeId },
      orderBy: {
        position: "asc"
      }
    }) as Promise<PersistedWorldLayerRecord[]>;
  }

  async createLayers(inputs: CreateWorldLayerInput[]): Promise<PersistedWorldLayerRecord[]> {
    if (inputs.length === 0) {
      return [];
    }

    await prisma.worldLayer.createMany({
      data: inputs
    });

    return this.listLayersByVolumeId(inputs[0].volumeId);
  }

  async updateLayer(input: UpdateWorldLayerInput): Promise<PersistedWorldLayerRecord> {
    return prisma.worldLayer.update({
      where: {
        volumeId_layerKey: {
          volumeId: input.volumeId,
          layerKey: input.layerKey
        }
      },
      data: {
        orderingMode: input.orderingMode,
        vibe: input.vibe,
        constraints: input.constraints,
        narrativeFlavor: input.narrativeFlavor
      }
    }) as Promise<PersistedWorldLayerRecord>;
  }

  async findLayerByKey(volumeId: string, layerKey: WorldLayerSummary["layerKey"]): Promise<WorldLayerSummary | null> {
    return prisma.worldLayer.findUnique({
      where: {
        volumeId_layerKey: {
          volumeId,
          layerKey
        }
      },
      select: {
        id: true,
        volumeId: true,
        layerKey: true,
        displayName: true,
        position: true
      }
    }) as Promise<WorldLayerSummary | null>;
  }

  async listNodesByLayerId(layerId: string): Promise<PersistedWorldNodeRecord[]> {
    return prisma.worldNode.findMany({
      where: { layerId },
      orderBy: {
        createdAt: "asc"
      }
    }) as Promise<PersistedWorldNodeRecord[]>;
  }

  async listNodesByVolumeId(volumeId: string): Promise<PersistedWorldNodeRecord[]> {
    return prisma.worldNode.findMany({
      where: { volumeId },
      orderBy: {
        createdAt: "asc"
      }
    }) as Promise<PersistedWorldNodeRecord[]>;
  }

  async findNodeById(nodeId: string): Promise<PersistedWorldNodeRecord | null> {
    return prisma.worldNode.findUnique({
      where: { id: nodeId }
    }) as Promise<PersistedWorldNodeRecord | null>;
  }

  async createNode(input: {
    volumeId: string;
    layerId: string;
    name: string;
    positionJustification: string | null;
    advantages: string | null;
    disadvantages: string | null;
    relationships: string | null;
    geographicalLocation: string | null;
    traditions: string | null;
    specialTraits: string | null;
    lastReminderQueuedAt: Date | null;
    nextReminderDueAt: Date | null;
  }): Promise<PersistedWorldNodeRecord> {
    return prisma.worldNode.create({
      data: input
    }) as Promise<PersistedWorldNodeRecord>;
  }

  async updateNode(input: {
    nodeId: string;
    volumeId: string;
    layerId: string;
    name: string;
    positionJustification: string | null;
    advantages: string | null;
    disadvantages: string | null;
    relationships: string | null;
    geographicalLocation: string | null;
    traditions: string | null;
    specialTraits: string | null;
    lastReminderQueuedAt: Date | null;
    nextReminderDueAt: Date | null;
  }): Promise<PersistedWorldNodeRecord> {
    return prisma.worldNode.update({
      where: { id: input.nodeId },
      data: {
        volumeId: input.volumeId,
        layerId: input.layerId,
        name: input.name,
        positionJustification: input.positionJustification,
        advantages: input.advantages,
        disadvantages: input.disadvantages,
        relationships: input.relationships,
        geographicalLocation: input.geographicalLocation,
        traditions: input.traditions,
        specialTraits: input.specialTraits,
        lastReminderQueuedAt: input.lastReminderQueuedAt,
        nextReminderDueAt: input.nextReminderDueAt
      }
    }) as Promise<PersistedWorldNodeRecord>;
  }

  async updateNodeReminderSchedule(input: {
    nodeId: string;
    lastReminderQueuedAt: Date;
    nextReminderDueAt: Date;
  }): Promise<PersistedWorldNodeRecord> {
    return prisma.worldNode.update({
      where: { id: input.nodeId },
      data: {
        lastReminderQueuedAt: input.lastReminderQueuedAt,
        nextReminderDueAt: input.nextReminderDueAt
      }
    }) as Promise<PersistedWorldNodeRecord>;
  }

  async findSceneWorldLink(sceneId: string, worldNodeId: string): Promise<SceneWorldLinkRecord | null> {
    return prisma.sceneWorldLink.findUnique({
      where: {
        sceneId_worldNodeId: {
          sceneId,
          worldNodeId
        }
      }
    }) as Promise<SceneWorldLinkRecord | null>;
  }

  async createSceneWorldLink(input: LinkWorldNodeToSceneInput): Promise<SceneWorldLinkRecord> {
    return prisma.sceneWorldLink.create({
      data: input
    }) as Promise<SceneWorldLinkRecord>;
  }

  async listWorldReferencesBySceneIds(sceneIds: string[]): Promise<WorldReferenceNodeRecord[]> {
    if (sceneIds.length === 0) {
      return [];
    }

    const links = await prisma.sceneWorldLink.findMany({
      where: {
        sceneId: {
          in: sceneIds
        }
      },
      include: {
        worldNode: {
          include: {
            layer: {
              select: {
                layerKey: true,
                displayName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return links.map((link: (typeof links)[number]) => {
      const missingRequiredFields = WORLD_NODE_REQUIRED_FIELDS.filter((fieldName) => !link.worldNode[fieldName]);

      return {
        sceneId: link.sceneId,
        worldNodeId: link.worldNodeId,
        nodeName: link.worldNode.name,
        layerKey: link.worldNode.layer.layerKey as WorldReferenceNodeRecord["layerKey"],
        layerName: link.worldNode.layer.displayName,
        positionJustification: link.worldNode.positionJustification,
        advantages: link.worldNode.advantages,
        disadvantages: link.worldNode.disadvantages,
        relationships: link.worldNode.relationships,
        geographicalLocation: link.worldNode.geographicalLocation,
        traditions: link.worldNode.traditions,
        specialTraits: link.worldNode.specialTraits,
        missingRequiredFields,
        isComplete: missingRequiredFields.length === 0
      };
    });
  }
}
