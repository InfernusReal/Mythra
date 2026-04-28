import { notFound } from "next/navigation";

import { WorldLayerPanel } from "../../../../../src/components/world/world-layer-panel";
import { WorldLayerService } from "../../../../../src/modules/world-building/world-layer.service";
import { WorldRuleEngineService } from "../../../../../src/modules/world-building/world-rule-engine.service";
import { PrismaWorldRepository } from "../../../../../src/modules/world-building/world.repository";

type VolumeWorldPageProps = {
  params: Promise<{
    volumeId: string;
  }>;
};

export default async function VolumeWorldPage({ params }: VolumeWorldPageProps) {
  const resolvedParams = await params;
  const worldLayerService = new WorldLayerService(new PrismaWorldRepository(), new WorldRuleEngineService());
  const result = await worldLayerService.getVolumeWorldLayers({
    volumeId: resolvedParams.volumeId
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
      <WorldLayerPanel initialTree={result.data} />
    </main>
  );
}
