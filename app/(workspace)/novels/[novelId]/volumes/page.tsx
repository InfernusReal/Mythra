import { notFound } from "next/navigation";

import { VolumeListShell } from "../../../../../src/components/volumes/volume-list-shell";
import { PrismaVolumeRepository } from "../../../../../src/modules/volumes/volume.repository";
import { VolumeService } from "../../../../../src/modules/volumes/volume.service";

type NovelVolumesPageProps = {
  params: Promise<{
    novelId: string;
  }>;
};

export default async function NovelVolumesPage({ params }: NovelVolumesPageProps) {
  const resolvedParams = await params;
  const volumeService = new VolumeService(new PrismaVolumeRepository());
  const result = await volumeService.getNovelVolumes({
    novelId: resolvedParams.novelId
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
      <VolumeListShell initialState={result.data} />
    </main>
  );
}
