import { notFound } from "next/navigation";

import { VolumeWorkspaceShell } from "../../../../src/components/volumes/volume-workspace-shell";
import { PrismaVolumeRepository } from "../../../../src/modules/volumes/volume.repository";
import { VolumeService } from "../../../../src/modules/volumes/volume.service";

type VolumeWorkspacePageProps = {
  params: Promise<{
    volumeId: string;
  }>;
};

export default async function VolumeWorkspacePage({ params }: VolumeWorkspacePageProps) {
  const resolvedParams = await params;
  const volumeService = new VolumeService(new PrismaVolumeRepository());
  const result = await volumeService.getVolumeWorkspace({
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
      <VolumeWorkspaceShell workspace={result.data} />
    </main>
  );
}
