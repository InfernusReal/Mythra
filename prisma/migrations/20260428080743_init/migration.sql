-- CreateTable
CREATE TABLE "Novel" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Novel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Volume" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Volume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "volumeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "maxChaptersPerMilestone" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scene" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "outline" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneGraphEdge" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "fromSceneId" TEXT NOT NULL,
    "toSceneId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SceneGraphEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "savedVersion" INTEGER NOT NULL DEFAULT 0,
    "maxWordCount" INTEGER NOT NULL DEFAULT 3000,
    "fontFamily" TEXT NOT NULL DEFAULT 'Georgia',
    "fontSize" INTEGER NOT NULL DEFAULT 16,
    "lineHeight" DOUBLE PRECISION NOT NULL DEFAULT 1.7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterSceneLink" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapterSceneLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldLayer" (
    "id" TEXT NOT NULL,
    "volumeId" TEXT NOT NULL,
    "layerKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "orderingMode" TEXT NOT NULL,
    "vibe" TEXT,
    "constraints" TEXT,
    "narrativeFlavor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorldLayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldNode" (
    "id" TEXT NOT NULL,
    "volumeId" TEXT NOT NULL,
    "layerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "positionJustification" TEXT,
    "advantages" TEXT,
    "disadvantages" TEXT,
    "relationships" TEXT,
    "geographicalLocation" TEXT,
    "traditions" TEXT,
    "specialTraits" TEXT,
    "lastReminderQueuedAt" TIMESTAMP(3),
    "nextReminderDueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorldNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneWorldLink" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "worldNodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SceneWorldLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Volume_novelId_idx" ON "Volume"("novelId");

-- CreateIndex
CREATE INDEX "Milestone_volumeId_idx" ON "Milestone"("volumeId");

-- CreateIndex
CREATE INDEX "Scene_milestoneId_idx" ON "Scene"("milestoneId");

-- CreateIndex
CREATE INDEX "SceneGraphEdge_milestoneId_idx" ON "SceneGraphEdge"("milestoneId");

-- CreateIndex
CREATE INDEX "SceneGraphEdge_toSceneId_idx" ON "SceneGraphEdge"("toSceneId");

-- CreateIndex
CREATE UNIQUE INDEX "SceneGraphEdge_fromSceneId_toSceneId_key" ON "SceneGraphEdge"("fromSceneId", "toSceneId");

-- CreateIndex
CREATE INDEX "Chapter_milestoneId_idx" ON "Chapter"("milestoneId");

-- CreateIndex
CREATE INDEX "ChapterSceneLink_sceneId_idx" ON "ChapterSceneLink"("sceneId");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterSceneLink_chapterId_sceneId_key" ON "ChapterSceneLink"("chapterId", "sceneId");

-- CreateIndex
CREATE INDEX "WorldLayer_volumeId_position_idx" ON "WorldLayer"("volumeId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "WorldLayer_volumeId_layerKey_key" ON "WorldLayer"("volumeId", "layerKey");

-- CreateIndex
CREATE INDEX "WorldNode_volumeId_layerId_idx" ON "WorldNode"("volumeId", "layerId");

-- CreateIndex
CREATE INDEX "WorldNode_nextReminderDueAt_idx" ON "WorldNode"("nextReminderDueAt");

-- CreateIndex
CREATE INDEX "SceneWorldLink_worldNodeId_idx" ON "SceneWorldLink"("worldNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "SceneWorldLink_sceneId_worldNodeId_key" ON "SceneWorldLink"("sceneId", "worldNodeId");

-- AddForeignKey
ALTER TABLE "Volume" ADD CONSTRAINT "Volume_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "Volume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneGraphEdge" ADD CONSTRAINT "SceneGraphEdge_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneGraphEdge" ADD CONSTRAINT "SceneGraphEdge_fromSceneId_fkey" FOREIGN KEY ("fromSceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneGraphEdge" ADD CONSTRAINT "SceneGraphEdge_toSceneId_fkey" FOREIGN KEY ("toSceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterSceneLink" ADD CONSTRAINT "ChapterSceneLink_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterSceneLink" ADD CONSTRAINT "ChapterSceneLink_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldLayer" ADD CONSTRAINT "WorldLayer_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "Volume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldNode" ADD CONSTRAINT "WorldNode_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "Volume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldNode" ADD CONSTRAINT "WorldNode_layerId_fkey" FOREIGN KEY ("layerId") REFERENCES "WorldLayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneWorldLink" ADD CONSTRAINT "SceneWorldLink_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneWorldLink" ADD CONSTRAINT "SceneWorldLink_worldNodeId_fkey" FOREIGN KEY ("worldNodeId") REFERENCES "WorldNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
