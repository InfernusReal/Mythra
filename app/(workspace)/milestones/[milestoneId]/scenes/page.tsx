import { notFound } from "next/navigation";

import { SceneGraph } from "../../../../../src/components/scenes/scene-graph";
import { PrismaSceneRepository } from "../../../../../src/modules/scenes/scene.repository";
import { SceneGraphService } from "../../../../../src/modules/scenes/scene-graph.service";

type MilestoneScenesPageProps = {
  params: Promise<{
    milestoneId: string;
  }>;
};

export default async function MilestoneScenesPage({ params }: MilestoneScenesPageProps) {
  const resolvedParams = await params;
  const sceneGraphService = new SceneGraphService(new PrismaSceneRepository());
  const result = await sceneGraphService.getMilestoneSceneGraph({
    milestoneId: resolvedParams.milestoneId
  });

  if (!result.ok) {
    notFound();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        backgroundColor: "#f5f7fb"
      }}
    >
      <SceneGraph initialState={result.data} />
    </main>
  );
}
